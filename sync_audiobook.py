#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sincronizador de Audiobook e Ebook (WhisperX + Alinhamento por Blocos e Capítulos).

Implementa o fluxo completo de ponta a ponta para alinhar um arquivo de áudio
existente (.mp3, .m4b, .wav, .flac) com o texto original de um ebook (.epub,
.mobi, .pdf, .txt), garantindo que o texto exibido ao leitor seja 100% fiel
à grafia e à pontuação do ebook:

1. Extrai e limpa o texto do ebook preservando a ordem do `spine` e limites de capítulos.
2. Transcreve o áudio com WhisperX para localizar o que foi efetivamente narrado.
3. Calcula os tempos exatos de cada palavra falada via modelo de alinhamento fonético.
4. Associa as palavras do áudio às palavras do ebook usando alinhamento ancorado por
   blocos (`SequenceMatcher` sem `autojunk` + interpolação local):
   - Ignora automaticamente partes do ebook que não foram narradas (capa, ficha
     catalográfica, sumário, notas de rodapé).
   - Preserva o texto original do ebook mesmo quando a transcrição automática (ASR)
     troca uma palavra parecida (ex.: nomes próprios ou homófonos), interpolando os
     tempos a partir das palavras vizinhas ancoradas.
5. Agrupa as palavras em frases respeitando pontuação final e quebras de capítulo/parágrafo.
6. Valida a integridade temporal, a ordem cronológica e a taxa de cobertura antes de
   exportar o JSON final para o player.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from difflib import SequenceMatcher
import html
import importlib.util
import json
import sys
from pathlib import Path
import posixpath
import re
from typing import Any, Dict, List, Optional, Tuple, Union
import unicodedata
import xml.etree.ElementTree as ET
import zipfile

from bs4 import BeautifulSoup

# Importações opcionais (EbookLib, WhisperX, PyTorch e extratores do módulo anterior)
try:
    from ebooklib import ITEM_DOCUMENT, epub
    HAS_EBOOKLIB = True
except ImportError:
    HAS_EBOOKLIB = False
    ITEM_DOCUMENT = 9

try:
    import whisperx
    HAS_WHISPERX = True
except ImportError:
    HAS_WHISPERX = False

try:
    import faster_whisper
    HAS_FASTER_WHISPER = True
except ImportError:
    HAS_FASTER_WHISPER = False

# Patch de compatibilidade com PyAV recente no Windows
try:
    import av
    if hasattr(av, "open"):
        _orig_av_open = av.open
        def _compat_av_open(*args, **kwargs):
            kwargs.pop("metadata_errors", None)
            return _orig_av_open(*args, **kwargs)
        av.open = _compat_av_open
except Exception:
    pass

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

# Reaproveita extratores de PDF, MOBI e TXT do módulo do projeto, se presente
HAS_PROJECT_EXTRACTORS = False
try:
    from ebook_audiobook_converter import (
        extract_text_from_mobi,
        extract_text_from_pdf,
        extract_text_from_txt,
        structure_text_into_chapters,
        detect_chapter_header,
    )
    HAS_PROJECT_EXTRACTORS = True
except ImportError:
    _conv_path = Path(__file__).resolve().parent / "ebook_audiobook_converter.py"
    if _conv_path.exists():
        _spec = importlib.util.spec_from_file_location("ebook_audiobook_converter", _conv_path)
        if _spec and _spec.loader:
            _mod = importlib.util.module_from_spec(_spec)
            sys.modules["ebook_audiobook_converter"] = _mod
            _spec.loader.exec_module(_mod)
            extract_text_from_mobi = _mod.extract_text_from_mobi
            extract_text_from_pdf = _mod.extract_text_from_pdf
            extract_text_from_txt = _mod.extract_text_from_txt
            structure_text_into_chapters = getattr(_mod, "structure_text_into_chapters", None)
            detect_chapter_header = getattr(_mod, "detect_chapter_header", None)
            HAS_PROJECT_EXTRACTORS = True


# Abreviações que terminam com ponto mas não encerram uma frase
COMMON_ABBREVIATIONS = {
    "sr", "sra", "srta", "dr", "dra", "prof", "profa", "eng", "pe", "st", "sto",
    "sta", "etc", "ex", "fig", "cap", "vol", "pág", "pag", "art", "inc", "ltda",
    "mr", "mrs", "ms", "jr", "vs", "ed", "no", "tel", "av", "r", "min", "seg",
}


# =============================================================================
# ETAPA 2 — EXTRAÇÃO ESTRUTURADA DO EBOOK (ORDEM DE LEITURA / SPINE)
# =============================================================================

def _clean_chapter_html(raw_html: Union[bytes, str]) -> List[str]:
    """
    Limpa o HTML/XHTML de um capítulo removendo elementos não narráveis
    (script, style, nav, svg) e retorna uma lista de parágrafos limpos.
    """
    if isinstance(raw_html, bytes):
        html_str = raw_html.decode("utf-8", errors="replace")
    else:
        html_str = raw_html

    soup = BeautifulSoup(html_str, "html.parser")
    for element in soup(["script", "style", "nav", "svg", "head", "noscript"]):
        element.decompose()

    # Ignora seções marcadas explicitamente como sumário ou navegação no EPUB 3
    for nav_elem in soup.find_all(attrs={"epub:type": re.compile(r"toc|landmarks|page-list", re.I)}):
        nav_elem.decompose()

    body = soup.body or soup
    paragraphs: List[str] = []

    block_tags = body.find_all(["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "blockquote"])
    if block_tags:
        for tag in block_tags:
            if tag.find_parent(["p", "li", "blockquote"]):
                continue
            txt = html.unescape(tag.get_text(" ", strip=True))
            txt = re.sub(r"\s{2,}", " ", txt).strip()
            if txt:
                paragraphs.append(txt)
    else:
        full_text = html.unescape(body.get_text(" ", strip=True))
        full_text = re.sub(r"\s{2,}", " ", full_text).strip()
        if full_text:
            paragraphs.append(full_text)

    return paragraphs


def extract_epub_chapters(epub_path: Union[str, Path]) -> List[Dict[str, Any]]:
    """
    Extrai os capítulos do EPUB seguindo estritamente a ordem de leitura definida
    pelo `spine` e ignorando itens não lineares (`linear="no"`, como capas avulsas).
    Utiliza `ebooklib` quando instalado ou o leitor nativo ZIP/OPF como fallback.
    """
    epub_path = Path(epub_path)
    if not epub_path.exists():
        raise FileNotFoundError(f"Arquivo EPUB não encontrado: {epub_path}")

    chapters: List[Dict[str, Any]] = []

    # 1. Caminho preferencial com EbookLib (conforme Etapa 2 do tutorial)
    if HAS_EBOOKLIB:
        book = epub.read_epub(str(epub_path))
        documents = {
            item.get_id(): item
            for item in book.get_items_of_type(ITEM_DOCUMENT)
        }

        for entry in book.spine:
            item_id = entry[0] if isinstance(entry, tuple) else entry
            linear = entry[1] if (isinstance(entry, tuple) and len(entry) > 1) else "yes"
            if str(linear).lower() == "no":
                continue

            item = documents.get(item_id)
            if item is None:
                continue

            paragraphs = _clean_chapter_html(item.get_content())
            text = "\n".join(paragraphs).strip()
            if text:
                chapters.append({
                    "id": item.get_id(),
                    "name": item.get_name(),
                    "paragraphs": paragraphs,
                    "text": text,
                })
        return chapters

    # 2. Fallback nativo (sem depender do pacote ebooklib instalado)
    with zipfile.ZipFile(epub_path, "r") as zf:
        namelist = set(zf.namelist())
        opf_path: Optional[str] = None

        if "META-INF/container.xml" in namelist:
            root = ET.fromstring(zf.read("META-INF/container.xml"))
            for elem in root.iter():
                if elem.tag.endswith("rootfile") and "full-path" in elem.attrib:
                    opf_path = elem.attrib["full-path"]
                    break

        if not opf_path:
            opf_candidates = [n for n in namelist if n.lower().endswith(".opf")]
            opf_path = opf_candidates[0] if opf_candidates else None

        opf_dir = posixpath.dirname(opf_path) if opf_path else ""
        manifest: Dict[str, str] = {}
        spine_entries: List[Tuple[str, str]] = []

        if opf_path and opf_path in namelist:
            opf_root = ET.fromstring(zf.read(opf_path))
            for elem in opf_root.iter():
                tag_local = elem.tag.split("}")[-1].lower()
                if tag_local == "item":
                    item_id = elem.attrib.get("id", "")
                    href = elem.attrib.get("href", "")
                    media_type = elem.attrib.get("media-type", "")
                    properties = elem.attrib.get("properties", "")
                    if "nav" in properties.split():
                        continue
                    if "html" in media_type or href.lower().endswith((".xhtml", ".html", ".htm")):
                        full_href = posixpath.normpath(posixpath.join(opf_dir, href)) if opf_dir else href
                        manifest[item_id] = full_href
                elif tag_local == "itemref":
                    idref = elem.attrib.get("idref", "")
                    linear = elem.attrib.get("linear", "yes")
                    if idref:
                        spine_entries.append((idref, linear))

        for item_id, linear in spine_entries:
            if linear.lower() == "no":
                continue
            href = manifest.get(item_id)
            if not href or href not in namelist:
                continue
            paragraphs = _clean_chapter_html(zf.read(href))
            text = "\n".join(paragraphs).strip()
            if text:
                chapters.append({
                    "id": item_id,
                    "name": href,
                    "paragraphs": paragraphs,
                    "text": text,
                })

    return chapters


def extract_ebook_chapters(ebook_path: Union[str, Path]) -> List[Dict[str, Any]]:
    """
    Extrai capítulos/blocos de texto de qualquer formato suportado (.epub, .mobi, .pdf, .txt),
    estruturando-os com Capítulo 0 ('0 - Introdução') e anúncios de capítulo correspondentes.
    """
    ebook_path = Path(ebook_path)
    ext = ebook_path.suffix.lower()

    if ext == ".epub":
        raw_chapters = extract_epub_chapters(ebook_path)
        all_text = "\n\n".join(ch["text"] for ch in raw_chapters if ch.get("text"))
        if HAS_PROJECT_EXTRACTORS and structure_text_into_chapters:
            blocks = structure_text_into_chapters(all_text)
            return [
                {
                    "id": f"chapter_{b.index}",
                    "index": b.index,
                    "name": b.title,
                    "paragraphs": [it.text for it in b.items],
                    "text": "\n".join(it.text for it in b.items),
                }
                for b in blocks
            ]
        return raw_chapters

    if ext in (".mobi", ".azw", ".prc") and HAS_PROJECT_EXTRACTORS:
        text = extract_text_from_mobi(ebook_path)
    elif ext == ".pdf" and HAS_PROJECT_EXTRACTORS:
        text = extract_text_from_pdf(ebook_path)
    elif ext == ".txt":
        text = (
            extract_text_from_txt(ebook_path)
            if HAS_PROJECT_EXTRACTORS
            else ebook_path.read_text(encoding="utf-8", errors="replace")
        )
    else:
        raise ValueError(f"Formato de ebook '{ext}' não suportado ou extrator indisponível.")

    if HAS_PROJECT_EXTRACTORS and structure_text_into_chapters:
        blocks = structure_text_into_chapters(text)
        return [
            {
                "id": f"chapter_{b.index}",
                "index": b.index,
                "name": b.title,
                "paragraphs": [it.text for it in b.items],
                "text": "\n".join(it.text for it in b.items),
            }
            for b in blocks
        ]

    paragraphs = [p.strip() for p in re.split(r"\n+", text) if p.strip()]
    return [
        {
            "id": "chapter_1",
            "index": 1,
            "name": ebook_path.name,
            "paragraphs": paragraphs,
            "text": "\n".join(paragraphs),
        }
    ]


# =============================================================================
# ETAPA 3 — TRANSCRIÇÃO DO ÁUDIO COM WHISPERX
# =============================================================================

def _detect_compute_environment(
    preferred_device: Optional[str] = None,
) -> Tuple[str, str]:
    """Detecta automaticamente se há GPU CUDA disponível ou se deve usar CPU."""
    if preferred_device:
        device = preferred_device
    elif HAS_TORCH and torch.cuda.is_available():
        device = "cuda"
    else:
        device = "cpu"

    compute_type = "float16" if device == "cuda" else "int8"
    return device, compute_type


def extract_audio_words(
    audio_path: Union[str, Path],
    language: str = "pt",
    model_name: str = "tiny",
    device: Optional[str] = None,
    log_func=print,
) -> List[Dict[str, Any]]:
    """Extrai palavras e tempos [start, end] do áudio via faster-whisper ou WhisperX."""
    if HAS_FASTER_WHISPER:
        if log_func:
            log_func(f"Reconhecendo fala do áudio com faster-whisper (modelo '{model_name}')...")
        from faster_whisper import WhisperModel
        dev, compute_type = _detect_compute_environment(device)
        model = WhisperModel(model_name, device=dev, compute_type=compute_type)
        segments, info = model.transcribe(str(audio_path), language=language, word_timestamps=True)
        raw_words = []
        for seg in segments:
            if getattr(seg, "words", None):
                for w in seg.words:
                    word_str = w.word.strip()
                    if word_str:
                        raw_words.append({
                            "word": word_str,
                            "start": float(w.start),
                            "end": float(w.end),
                            "score": float(getattr(w, "probability", 1.0)),
                        })
        return _repair_missing_audio_word_timestamps(raw_words)

    elif HAS_WHISPERX:
        if log_func:
            log_func("Reconhecendo fala do áudio com WhisperX...")
        audio, transcript_segments = transcribe_audio(
            audio_path, language=language, model_name=model_name, device=device
        )
        return align_transcript(audio, transcript_segments, language=language, device=device)

    else:
        raise RuntimeError(
            "Nenhum motor de ASR instalado. Instale 'faster-whisper' com: pip install faster-whisper"
        )


def transcribe_audio_to_sync(
    audio_path: Union[str, Path],
    language: str = "pt",
    model_name: str = "tiny",
    device: Optional[str] = None,
    log_func=print,
) -> Dict[str, Any]:
    """
    Transcreve um arquivo de áudio diretamente para frases e palavras com timestamps
    sem necessitar de um ebook prévio (Modo: Apenas Áudio -> Texto).
    """
    audio_path = Path(audio_path)
    if not audio_path.exists():
        raise FileNotFoundError(f"Arquivo de áudio não encontrado: {audio_path}")

    if HAS_FASTER_WHISPER:
        if log_func:
            log_func(f"Transcrevendo áudio '{audio_path.name}' com faster-whisper (modelo '{model_name}')...")
        from faster_whisper import WhisperModel
        dev, compute_type = _detect_compute_environment(device)
        model = WhisperModel(model_name, device=dev, compute_type=compute_type)
        segments_gen, info = model.transcribe(str(audio_path), language=language, word_timestamps=True)

        raw_segments = []
        raw_words = []
        for seg in segments_gen:
            s_text = seg.text.strip()
            if s_text:
                raw_segments.append({
                    "start": round(float(seg.start), 2),
                    "end": round(float(seg.end), 2),
                    "text": s_text,
                })
            if getattr(seg, "words", None):
                for w in seg.words:
                    w_str = w.word.strip()
                    if w_str:
                        raw_words.append({
                            "start": round(float(w.start), 2),
                            "end": round(float(w.end), 2),
                            "text": w_str,
                        })
        # Identifica seções de capítulos na transcrição do áudio
        chapters_meta: List[Dict[str, Any]] = []
        current_ch = 0
        for seg in raw_segments:
            if HAS_PROJECT_EXTRACTORS and detect_chapter_header:
                ch_info = detect_chapter_header(seg["text"])
                if ch_info:
                    num, title = ch_info
                    if chapters_meta:
                        chapters_meta[-1]["end"] = seg["start"]
                    chapters_meta.append({
                        "index": num,
                        "title": title,
                        "start": seg["start"],
                        "end": seg["end"],
                    })
                    current_ch = num
            seg["chapter"] = current_ch

        if chapters_meta:
            chapters_meta[-1]["end"] = raw_segments[-1]["end"] if raw_segments else 0.0

        for w in raw_words:
            w_start = w["start"]
            w["chapter"] = current_ch
            for ch_entry in chapters_meta:
                if ch_entry["start"] <= w_start <= ch_entry["end"]:
                    w["chapter"] = ch_entry["index"]
                    break

        sync_res = {
            "version": 1,
            "audio": audio_path.name,
            "language": getattr(info, "language", language),
            "unit": "seconds",
            "segments": raw_segments,
            "sentences": raw_segments,
            "words": raw_words,
            "metadata": {
                "sync_source": "audio_transcription_whisper",
                "has_native_timestamps": True,
                "duration": round(float(getattr(info, "duration", 0.0)), 2),
            },
        }
        if chapters_meta:
            sync_res["chapters"] = chapters_meta
        return sync_res

    elif HAS_WHISPERX:
        if log_func:
            log_func(f"Transcrevendo áudio '{audio_path.name}' com WhisperX...")
        audio, transcript_segments = transcribe_audio(
            audio_path, language=language, model_name=model_name, device=device
        )
        aligned = align_transcript(audio, transcript_segments, language=language, device=device)
        raw_words = []
        for w in aligned:
            if "start" in w and "end" in w:
                raw_words.append({
                    "start": round(float(w["start"]), 2),
                    "end": round(float(w["end"]), 2),
                    "text": w.get("word", ""),
                })
        clean_segs = [
            {
                "start": round(float(s["start"]), 2),
                "end": round(float(s["end"]), 2),
                "text": s["text"].strip(),
            }
            for s in transcript_segments
        ]
        return {
            "version": 1,
            "audio": audio_path.name,
            "language": language,
            "unit": "seconds",
            "segments": clean_segs,
            "sentences": clean_segs,
            "words": raw_words,
            "metadata": {
                "sync_source": "audio_transcription_whisperx",
                "has_native_timestamps": True,
            },
        }

    else:
        raise RuntimeError("Instale 'faster-whisper' para transcrição de áudio.")


def transcribe_audio(
    audio_path: Union[str, Path],
    language: str = "pt",
    model_name: str = "small",
    device: Optional[str] = None,
    batch_size: int = 4,
) -> Tuple[Any, List[Dict[str, Any]]]:
    """
    Carrega o áudio e gera a transcrição inicial por segmentos usando o WhisperX.
    Esta transcrição serve apenas como referência fonética/temporal para localizar
    as correspondências no texto original do ebook.
    """
    if not HAS_WHISPERX:
        raise RuntimeError(
            "A biblioteca 'whisperx' não está instalada neste ambiente."
        )

    dev, compute_type = _detect_compute_environment(device)
    model = whisperx.load_model(
        model_name,
        dev,
        compute_type=compute_type,
        language=language,
    )
    audio = whisperx.load_audio(str(audio_path))
    result = model.transcribe(
        audio,
        batch_size=batch_size,
        language=language,
    )
    return audio, result["segments"]


# =============================================================================
# ETAPA 4 — ALINHAMENTO FONÉTICO E ASSOCIAÇÃO ROBUSTA COM AS PALAVRAS DO EBOOK
# =============================================================================

def normalize_word(text: str) -> str:
    """
    Normaliza uma palavra para comparação insensível a maiúsculas/minúsculas,
    pontuação periférica e variações de acentuação/Unicode.
    """
    text = unicodedata.normalize("NFKC", text).casefold()
    return re.sub(r"^[^\w]+|[^\w]+$", "", text)


def strip_accents(text: str) -> str:
    """Remove acentos para comparação fonética aproximada quando o ASR erra acentuação."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in nfkd if not unicodedata.combining(ch))


def align_transcript(
    audio: Any,
    transcript_segments: List[Dict[str, Any]],
    language: str = "pt",
    device: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Executa o modelo de alinhamento fonético do WhisperX para obter `start` e `end`
    de cada palavra reconhecida, preenchendo eventuais lacunas de numerais/pontuação.
    """
    if not HAS_WHISPERX:
        raise RuntimeError("A biblioteca 'whisperx' não está instalada.")

    dev, _ = _detect_compute_environment(device)
    model_a, metadata = whisperx.load_align_model(
        language_code=language,
        device=dev,
    )
    result = whisperx.align(
        transcript_segments,
        model_a,
        metadata,
        audio,
        dev,
        return_char_alignments=False,
    )
    raw_words = result.get("word_segments", [])
    return _repair_missing_audio_word_timestamps(raw_words)


def _repair_missing_audio_word_timestamps(
    raw_words: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    O WhisperX ocasionalmente retorna números (ex.: '1984') ou palavras curtas sem
    'start'/'end' em `word_segments`. Esta função interpola esses tempos a partir
    das palavras vizinhas para não perder nenhum token narrado.
    """
    if not raw_words:
        return []

    cleaned: List[Dict[str, Any]] = []
    n = len(raw_words)
    i = 0
    while i < n:
        w = raw_words[i]
        word_text = str(w.get("word") or w.get("text") or "").strip()
        if not word_text:
            i += 1
            continue

        if "start" in w and "end" in w and w["start"] is not None and w["end"] is not None:
            cleaned.append({
                "word": word_text,
                "start": float(w["start"]),
                "end": float(w["end"]),
                "score": float(w.get("score", 1.0)),
            })
            i += 1
        else:
            j = i
            missing_tokens: List[str] = []
            while j < n:
                wj = raw_words[j]
                wt = str(wj.get("word") or wj.get("text") or "").strip()
                if wt and (wj.get("start") is None or wj.get("end") is None):
                    missing_tokens.append(wt)
                    j += 1
                else:
                    break

            prev_end = cleaned[-1]["end"] if cleaned else 0.0
            next_start = (
                float(raw_words[j]["start"])
                if (j < n and raw_words[j].get("start") is not None)
                else prev_end + 0.25 * len(missing_tokens)
            )
            if next_start <= prev_end:
                next_start = prev_end + 0.15 * len(missing_tokens)

            step = (next_start - prev_end) / max(1, len(missing_tokens))
            for k, tok in enumerate(missing_tokens):
                cleaned.append({
                    "word": tok,
                    "start": round(prev_end + k * step, 3),
                    "end": round(prev_end + (k + 1) * step, 3),
                    "score": 0.5,
                })
            i = j

    return cleaned


@dataclass
class EbookToken:
    """Representa uma palavra original do ebook com metadados de posição estrutural."""
    text: str
    norm: str
    norm_no_accent: str
    chapter_index: int
    paragraph_index: int
    is_paragraph_end: bool = False


def tokenize_chapters_with_structure(
    chapters: List[Dict[str, Any]]
) -> List[EbookToken]:
    """
    Converte os capítulos do ebook em uma lista linear de tokens preservando a
    grafia original (`text`), a forma normalizada (`norm`) e os limites de
    capítulo e parágrafo para que `group_sentences` não una capítulos distintos.
    """
    tokens: List[EbookToken] = []
    for c_idx, ch in enumerate(chapters):
        c_num = ch.get("index", c_idx)
        paragraphs = ch.get("paragraphs") or [
            p.strip() for p in re.split(r"\n+", ch.get("text", "")) if p.strip()
        ]
        for p_idx, para in enumerate(paragraphs):
            words = re.findall(r"\S+", para)
            for w_idx, w in enumerate(words):
                norm = normalize_word(w)
                if not norm:
                    if tokens:
                        tokens[-1].text = f"{tokens[-1].text} {w}"
                    continue
                tokens.append(
                    EbookToken(
                        text=w,
                        norm=norm,
                        norm_no_accent=strip_accents(norm),
                        chapter_index=c_num,
                        paragraph_index=p_idx,
                        is_paragraph_end=(w_idx == len(words) - 1),
                    )
                )
    return tokens


def _distribute_time_proportionally(
    ebook_slice: List[EbookToken],
    start_time: float,
    end_time: float,
    match_type: str = "interpolated",
) -> List[Dict[str, Any]]:
    """
    Distribui o intervalo [start_time, end_time] proporcionalmente ao comprimento
    de cada palavra do ebook quando o ASR trocou ou fundiu palavras dentro de uma frase narrada.
    """
    if not ebook_slice:
        return []

    if end_time < start_time:
        end_time = start_time

    weights = [max(1, len(tok.norm)) for tok in ebook_slice]
    total_weight = sum(weights) or 1
    duration = max(0.01 * len(ebook_slice), end_time - start_time)

    results: List[Dict[str, Any]] = []
    cursor = start_time
    for idx, (tok, w) in enumerate(zip(ebook_slice, weights)):
        piece_dur = (w / total_weight) * duration
        w_end = end_time if idx == len(ebook_slice) - 1 else (cursor + piece_dur)
        results.append({
            "start": round(float(cursor), 3),
            "end": round(float(w_end), 3),
            "text": tok.text,
            "chapter_index": tok.chapter_index,
            "paragraph_index": tok.paragraph_index,
            "is_paragraph_end": tok.is_paragraph_end,
            "match_type": match_type,
        })
        cursor = w_end

    return results


def match_ebook_words(
    ebook_input: Union[str, List[Dict[str, Any]]],
    audio_words: List[Dict[str, Any]],
    max_interpolated_gap_words: int = 8,
) -> List[Dict[str, Any]]:
    """
    Associa as palavras da transcrição do áudio (`audio_words`) às palavras originais
    do ebook (`ebook_input`), garantindo que o texto final exibido seja 100% fiel ao ebook.

    Aprimoramentos em relação ao protótipo básico:
    1. Desativa `autojunk=False` no `SequenceMatcher` para impedir que preposições e
       artigos frequentes ("de", "a", "o", "que") sejam ignorados.
    2. Preserva o texto original do ebook mesmo quando o WhisperX comete pequenos erros
       de reconhecimento (substituições locais de até `max_interpolated_gap_words` palavras
       entre âncoras exatas), interpolando os tempos das palavras do áudio para as
       palavras reais do ebook.
    3. Descarta blocos do ebook que não foram narrados no áudio (ex.: ficha catalográfica,
       prefácio omitido, sumário ou notas de rodapé no início/meio/fim).
    """
    if isinstance(ebook_input, str):
        chapters = [{"id": "ch1", "name": "book", "text": ebook_input}]
    else:
        chapters = ebook_input

    ebook_tokens = tokenize_chapters_with_structure(chapters)
    if not ebook_tokens or not audio_words:
        return []

    valid_audio: List[Dict[str, Any]] = []
    for aw in audio_words:
        raw_w = str(aw.get("word") or aw.get("text") or "").strip()
        norm_w = normalize_word(raw_w)
        if not norm_w:
            continue
        if aw.get("start") is None or aw.get("end") is None:
            continue
        valid_audio.append({
            "word": raw_w,
            "norm": norm_w,
            "norm_no_accent": strip_accents(norm_w),
            "start": float(aw["start"]),
            "end": float(aw["end"]),
        })

    if not valid_audio:
        return []

    ebook_norms = [t.norm_no_accent for t in ebook_tokens]
    audio_norms = [a["norm_no_accent"] for a in valid_audio]

    matcher = SequenceMatcher(None, ebook_norms, audio_norms, autojunk=False)
    opcodes = matcher.get_opcodes()

    matched_words: List[Dict[str, Any]] = []

    for idx, (tag, i1, i2, j1, j2) in enumerate(opcodes):
        if tag == "equal":
            for e_idx, a_idx in zip(range(i1, i2), range(j1, j2)):
                tok = ebook_tokens[e_idx]
                aud = valid_audio[a_idx]
                matched_words.append({
                    "start": round(aud["start"], 3),
                    "end": round(aud["end"], 3),
                    "text": tok.text,
                    "chapter_index": tok.chapter_index,
                    "paragraph_index": tok.paragraph_index,
                    "is_paragraph_end": tok.is_paragraph_end,
                    "match_type": "exact",
                })

        elif tag == "replace":
            ebook_span_len = i2 - i1
            audio_span_len = j2 - j1

            has_left_anchor = idx > 0 and opcodes[idx - 1][0] == "equal"
            has_right_anchor = idx + 1 < len(opcodes) and opcodes[idx + 1][0] == "equal"

            ebook_str = " ".join(ebook_norms[i1:i2])
            audio_str = " ".join(audio_norms[j1:j2])
            char_similarity = SequenceMatcher(None, ebook_str, audio_str).ratio()

            is_local_asr_mismatch = (
                (ebook_span_len <= max_interpolated_gap_words and audio_span_len <= max_interpolated_gap_words)
                and (has_left_anchor or has_right_anchor or char_similarity >= 0.45)
            ) or (char_similarity >= 0.60)

            if is_local_asr_mismatch and audio_span_len > 0:
                span_start = valid_audio[j1]["start"]
                span_end = valid_audio[j2 - 1]["end"]
                matched_words.extend(
                    _distribute_time_proportionally(
                        ebook_tokens[i1:i2],
                        start_time=span_start,
                        end_time=span_end,
                        match_type="interpolated_replace",
                    )
                )

        elif tag == "delete":
            ebook_span_len = i2 - i1
            has_left_anchor = idx > 0 and opcodes[idx - 1][0] == "equal"
            has_right_anchor = idx + 1 < len(opcodes) and opcodes[idx + 1][0] == "equal"

            if (
                has_left_anchor
                and has_right_anchor
                and ebook_span_len <= 2
                and matched_words
                and j1 < len(valid_audio)
            ):
                prev_word_end = matched_words[-1]["end"]
                next_word_start = valid_audio[j1]["start"]
                same_chapter = (
                    ebook_tokens[i1].chapter_index == matched_words[-1]["chapter_index"]
                )
                if same_chapter and 0.0 <= (next_word_start - prev_word_end) <= 2.0:
                    gap_start = prev_word_end
                    gap_end = max(prev_word_end + 0.04, next_word_start)
                    if next_word_start <= prev_word_end + 0.02:
                        nudge = min(0.06, (matched_words[-1]["end"] - matched_words[-1]["start"]) * 0.25)
                        matched_words[-1]["end"] = round(matched_words[-1]["end"] - nudge, 3)
                        gap_start = matched_words[-1]["end"]
                        gap_end = next_word_start

                    matched_words.extend(
                        _distribute_time_proportionally(
                            ebook_tokens[i1:i2],
                            start_time=gap_start,
                            end_time=gap_end,
                            match_type="interpolated_ellipsis",
                        )
                    )

    return matched_words


# =============================================================================
# ETAPA 6 — AGRUPAR PALAVRAS EM FRASES (RESPEITANDO CAPÍTULOS E PARÁGRAFOS)
# =============================================================================

def _is_sentence_terminal(word_text: str) -> bool:
    """
    Verifica se a palavra encerra uma frase (., ?, !, …), ignorando abreviações
    conhecidas como 'Sr.', 'Dra.', 'etc.'.
    """
    stripped = word_text.rstrip('”"\'»)]}')
    if not stripped.endswith((".", "?", "!", "…")):
        return False
    clean_token = stripped.rstrip(".?!…").lower()
    if stripped.endswith(".") and clean_token in COMMON_ABBREVIATIONS:
        return False
    return True


def group_sentences(words: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Agrupa as palavras sincronizadas em frases completas, fechando a frase quando:
    1. Encontra pontuação final (`.`, `?`, `!`, `…`), exceto abreviações;
    2. Atinge o final de um parágrafo ou título (`is_paragraph_end == True`);
    3. Muda de capítulo (`chapter_index` diferente da palavra anterior).
    """
    sentences: List[Dict[str, Any]] = []
    current: List[Dict[str, Any]] = []

    for word in words:
        if current:
            prev = current[-1]
            chapter_changed = (
                word.get("chapter_index") is not None
                and prev.get("chapter_index") is not None
                and word.get("chapter_index") != prev.get("chapter_index")
            )
            if chapter_changed:
                sent_dict = {
                    "start": current[0]["start"],
                    "end": current[-1]["end"],
                    "text": " ".join(item["text"] for item in current),
                }
                if current[0].get("chapter_index") is not None:
                    sent_dict["chapter"] = current[0]["chapter_index"]
                sentences.append(sent_dict)
                current = []

        current.append(word)

        if _is_sentence_terminal(word["text"]) or word.get("is_paragraph_end", False):
            sent_dict = {
                "start": current[0]["start"],
                "end": current[-1]["end"],
                "text": " ".join(item["text"] for item in current),
            }
            if current[0].get("chapter_index") is not None:
                sent_dict["chapter"] = current[0]["chapter_index"]
            sentences.append(sent_dict)
            current = []

    if current:
        sent_dict = {
            "start": current[0]["start"],
            "end": current[-1]["end"],
            "text": " ".join(item["text"] for item in current),
        }
        if current[0].get("chapter_index") is not None:
            sent_dict["chapter"] = current[0]["chapter_index"]
        sentences.append(sent_dict)

    return sentences


# =============================================================================
# ETAPA 7 — VALIDAÇÃO DOS TEMPOS E DIAGNÓSTICO DE QUALIDADE
# =============================================================================

def validate_words(
    words: List[Dict[str, Any]],
    audio_duration: Optional[float] = None,
    duration_tolerance: float = 2.0,
) -> bool:
    """
    Valida se todas as palavras possuem tempos não negativos, `end >= start`,
    ordem cronológica estrita e se estão dentro da duração total do áudio.
    """
    if not words:
        raise ValueError("A lista de palavras sincronizadas está vazia.")

    previous_start = -1.0
    for idx, word in enumerate(words):
        start = float(word["start"])
        end = float(word["end"])
        if start < 0 or end < start:
            raise ValueError(f"Tempo inválido no índice {idx}: {word}")
        if start < previous_start - 1e-3:
            raise ValueError(
                f"Palavras fora da ordem temporal no índice {idx}: "
                f"atual={start}s < anterior={previous_start}s ({word})"
            )
        previous_start = start

    if audio_duration is not None and audio_duration > 0:
        max_end = max(float(w["end"]) for w in words)
        if max_end > audio_duration + duration_tolerance:
            raise ValueError(
                f"O tempo final ({max_end:.2f}s) excede a duração do áudio ({audio_duration:.2f}s)."
            )

    return True


def export_sync(
    words: List[Dict[str, Any]],
    audio_path: Union[str, Path],
    output_path: Optional[Union[str, Path]] = None,
    language: str = "pt",
    diagnostics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Valida e exporta o JSON final contendo tanto as palavras (`words`) quanto as
    frases agrupadas (`sentences` e `segments`, para compatibilidade direta com o player).
    """
    validate_words(words)
    sentences = group_sentences(words)

    clean_words = [
        {
            "start": round(float(w["start"]), 2),
            "end": round(float(w["end"]), 2),
            "text": w["text"],
            **({"chapter": w["chapter_index"]} if w.get("chapter_index") is not None else {}),
        }
        for w in words
    ]
    clean_sentences = [
        {
            "start": round(float(s["start"]), 2),
            "end": round(float(s["end"]), 2),
            "text": s["text"],
            **({"chapter": s["chapter"]} if s.get("chapter") is not None else {}),
        }
        for s in sentences
    ]

    chapters_meta: List[Dict[str, Any]] = []
    seen_c: Dict[int, Dict[str, Any]] = {}
    for w in words:
        c_idx = w.get("chapter_index")
        if c_idx is not None:
            if c_idx not in seen_c:
                c_title = "0 - Introdução" if c_idx == 0 else f"Capítulo {c_idx}"
                item_entry = {
                    "index": c_idx,
                    "title": c_title,
                    "start": round(float(w["start"]), 2),
                    "end": round(float(w["end"]), 2),
                }
                seen_c[c_idx] = item_entry
                chapters_meta.append(item_entry)
            else:
                seen_c[c_idx]["end"] = max(seen_c[c_idx]["end"], round(float(w["end"]), 2))

    data: Dict[str, Any] = {
        "version": 1,
        "audio": Path(audio_path).name,
        "language": language,
        "unit": "seconds",
        "words": clean_words,
        "sentences": clean_sentences,
        "segments": clean_sentences,
    }

    if chapters_meta:
        data["chapters"] = chapters_meta

    if diagnostics:
        data["diagnostics"] = diagnostics

    if output_path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as file:
            json.dump(data, file, ensure_ascii=False, indent=2)

    return data


# =============================================================================
# ETAPAS 5 E 8 — PONTO DE ENTRADA PRINCIPAL E INTEGRAÇÃO AO CONVERSOR
# =============================================================================

def synchronize_audiobook(
    audio_path: Union[str, Path],
    ebook_path: Union[str, Path],
    output_path: Optional[Union[str, Path]] = None,
    language: str = "pt",
    model_name: str = "tiny",
    device: Optional[str] = None,
    precomputed_audio_words: Optional[List[Dict[str, Any]]] = None,
    log_func=print,
) -> Dict[str, Any]:
    """
    Executa o fluxo completo de sincronização entre um audiobook existente e seu ebook:
    1. Extrai e limpa os capítulos do ebook na ordem de leitura.
    2. Transcreve o áudio com faster-whisper / WhisperX.
    3. Alinha foneticamente cada palavra falada.
    4. Associa os tempos do áudio ao texto original do ebook, descartando páginas não
       narradas e corrigindo eventuais deslizes da transcrição automática.
    5. Agrupa em frases, valida os tempos e salva o JSON final.
    """
    if log_func:
        log_func("1/4 — Extraindo o texto do ebook...")
    chapters = extract_ebook_chapters(ebook_path)
    ebook_text = "\n".join(chapter["text"] for chapter in chapters)
    if not ebook_text.strip():
        raise ValueError("Não foi possível extrair texto do ebook.")

    if precomputed_audio_words is not None:
        if log_func:
            log_func("2/4 & 3/4 — Usando palavras alinhadas fornecidas...")
        audio_words = _repair_missing_audio_word_timestamps(precomputed_audio_words)
    else:
        if log_func:
            log_func("2/4 & 3/4 — Analisando o áudio e calculando tempos das palavras...")
        audio_words = extract_audio_words(
            audio_path,
            language=language,
            model_name=model_name,
            device=device,
            log_func=log_func,
        )

    if log_func:
        log_func("4/4 — Comparando, ancorando com o ebook e validando...")
    matched_words = match_ebook_words(chapters, audio_words)
    if not matched_words:
        raise ValueError(
            "Nenhuma correspondência foi encontrada. "
            "Verifique o idioma e se o ebook corresponde ao áudio."
        )

    exact_count = sum(1 for w in matched_words if w.get("match_type") == "exact")
    interpolated_count = len(matched_words) - exact_count
    diagnostics = {
        "total_ebook_chapters": len(chapters),
        "total_audio_words_detected": len(audio_words),
        "total_synced_ebook_words": len(matched_words),
        "exact_word_matches": exact_count,
        "interpolated_asr_corrections": interpolated_count,
        "audio_coverage_ratio": round(len(matched_words) / max(1, len(audio_words)), 3),
    }

    result_data = export_sync(
        matched_words,
        audio_path=Path(audio_path).name,
        output_path=output_path,
        language=language,
        diagnostics=diagnostics,
    )
    if output_path:
        print(f"Arquivo de sincronização criado: {output_path}")
    return result_data


def interactive_menu() -> None:
    """
    Etapa 8 — Menu interativo para integrar ao `gerador_de_audiobook.py` existente,
    mantendo a geração de texto sincronizado separada da síntese de voz.
    """
    print("\n=== Menu do Conversor de Audiobook ===")
    print("1. Converter apenas texto do ebook / extrair Media Overlays (SMIL)")
    print("2. Gerar texto sincronizado para audiobook existente (Áudio + Ebook)")
    choice = input("Escolha uma opção (1 ou 2): ").strip()

    if choice == "2":
        audio_path = input("Caminho do arquivo de áudio (ex.: audiobook.mp3): ").strip()
        ebook_path = input("Caminho do arquivo de ebook (ex.: livro.epub): ").strip()
        output_path = (
            input("Caminho do JSON de saída [sincronizado.json]: ").strip()
            or "sincronizado.json"
        )
        lang = input("Idioma do audiobook [pt]: ").strip() or "pt"
        synchronize_audiobook(
            audio_path=audio_path,
            ebook_path=ebook_path,
            output_path=output_path,
            language=lang,
        )
    elif choice == "1":
        if HAS_PROJECT_EXTRACTORS:
            from ebook_audiobook_converter import EbookAudiobookConverter
            ebook_path = input("Caminho do arquivo de ebook: ").strip()
            audio_name = input("Nome do arquivo de áudio correspondente: ").strip() or "audiobook.m4b"
            mode = input("Modo ('sentence', 'word' ou 'both') [both]: ").strip() or "both"
            output_path = input("Caminho do JSON de saída [sincronizado.json]: ").strip() or "sincronizado.json"
            EbookAudiobookConverter().convert(
                ebook_path=ebook_path,
                audio_filename=audio_name,
                granularity=mode,  # type: ignore[arg-type]
                output_json_path=output_path,
            )
            print(f"Arquivo exportado em: {output_path}")
        else:
            print("Módulo ebook_audiobook_converter.py não encontrado na mesma pasta.")
    else:
        print("Opção inválida.")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Sincroniza o texto de um ebook (.epub, .mobi, .pdf, .txt) com a narração de um audiobook."
    )
    parser.add_argument("--audio", "-a", help="Caminho do arquivo de áudio (ex.: audiobook.mp3)")
    parser.add_argument("--ebook", "-e", help="Caminho do arquivo de ebook (ex.: livro.epub)")
    parser.add_argument(
        "--output",
        "-o",
        default="sincronizado.json",
        help="Caminho do arquivo JSON de saída (padrão: sincronizado.json)",
    )
    parser.add_argument("--language", "-l", default="pt", help="Código do idioma (padrão: pt)")
    parser.add_argument(
        "--model",
        "-m",
        default="small",
        help="Modelo WhisperX a utilizar (tiny, base, small, medium, large-v2)",
    )
    parser.add_argument(
        "--menu",
        action="store_true",
        help="Abre o menu interativo (Etapa 8)",
    )

    args = parser.parse_args()
    if args.menu:
        interactive_menu()
    elif args.audio and args.ebook:
        synchronize_audiobook(
            audio_path=args.audio,
            ebook_path=args.ebook,
            output_path=args.output,
            language=args.language,
            model_name=args.model,
        )
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
