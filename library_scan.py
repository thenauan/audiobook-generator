"""
Lê os audiobooks de uma pasta (a pasta de salvamento) para recuperá-los em Convertidos: título, autor, narrador,
gênero, subgênero, ano, idioma, duração, capítulos com tempos, se tem texto sincronizado e a capa embutida.

Uso: python library_scan.py <pasta>   ->  imprime uma lista JSON
"""
import base64
import io
import json
import os
import subprocess
import sys

import mutagen

EXT = (".m4b", ".mp3", ".opus", ".flac", ".wav", ".m4a", ".ogg")
CAPA_MAX = 600  # capas recuperadas são reduzidas (a lista de Convertidos fica leve)


def _texto(v):
    if v is None:
        return ""
    if isinstance(v, list):
        v = v[0] if v else ""
    if hasattr(v, "text"):
        t = v.text
        v = t[0] if isinstance(t, list) and t else t
    return str(v).strip()


def _tag(tags, *chaves):
    if not tags:
        return ""
    for k in chaves:
        try:
            v = tags.get(k)
        except Exception:
            v = None
        t = _texto(v)
        if t:
            return t
    return ""


def _capa_bytes(f, caminho):
    """(bytes, mime) da capa embutida, em qualquer formato."""
    tags = getattr(f, "tags", None)
    try:
        if tags is not None:
            if "covr" in tags and tags["covr"]:  # M4B / M4A
                c = tags["covr"][0]
                return bytes(c), "image/png" if getattr(c, "imageformat", 0) == 14 else "image/jpeg"
            for k in list(tags.keys()):  # MP3 (APIC)
                if str(k).startswith("APIC"):
                    return tags[k].data, tags[k].mime or "image/jpeg"
        if hasattr(f, "pictures") and f.pictures:  # FLAC
            return f.pictures[0].data, f.pictures[0].mime or "image/jpeg"
        if tags is not None and "metadata_block_picture" in tags:  # Opus / Ogg
            from mutagen.flac import Picture
            p = Picture(base64.b64decode(tags["metadata_block_picture"][0]))
            return p.data, p.mime or "image/jpeg"
    except Exception:
        pass
    return None, None


def _capa_data_url(dados, mime):
    if not dados:
        return None
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(dados)).convert("RGB")
        img.thumbnail((CAPA_MAX, CAPA_MAX * 1.6))
        saida = io.BytesIO()
        img.save(saida, "JPEG", quality=85, optimize=True)
        dados, mime = saida.getvalue(), "image/jpeg"
    except Exception:
        pass  # sem o Pillow: usa a capa como está
    return f"data:{mime};base64,{base64.b64encode(dados).decode('ascii')}"


def _capitulos(caminho):
    """Capítulos com início e duração (pelo ffprobe, que lê os capítulos de M4B, MP3, Opus e FLAC)."""
    try:
        flags = 0x08000000 if os.name == "nt" else 0
        r = subprocess.run(["ffprobe", "-v", "error", "-print_format", "json", "-show_chapters", caminho],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30, creationflags=flags)
        caps = json.loads(r.stdout or "{}").get("chapters") or []
    except Exception:
        return []
    saida = []
    for i, c in enumerate(caps, 1):
        ini, fim = float(c.get("start_time") or 0), float(c.get("end_time") or 0)
        d = max(0, int(round(fim - ini)))
        saida.append({"id": f"c{i}", "title": (c.get("tags") or {}).get("title") or f"Capítulo {i}",
                      "duration": f"{d // 3600}:{d % 3600 // 60:02d}:{d % 60:02d}" if d >= 3600 else f"{d // 60}:{d % 60:02d}"})
    return saida


def ler(caminho):
    try:
        f = mutagen.File(caminho)
    except Exception:
        f = None
    tags = getattr(f, "tags", None)
    info = getattr(f, "info", None)
    chaves = [str(k) for k in (tags.keys() if tags else [])]
    dados, mime = _capa_bytes(f, caminho) if f is not None else (None, None)
    return {
        "path": caminho,
        "title": _tag(tags, "\xa9nam", "TIT2", "TITLE", "title") or os.path.splitext(os.path.basename(caminho))[0],
        "author": _tag(tags, "\xa9ART", "aART", "TPE1", "ARTIST", "artist"),
        "narrator": _tag(tags, "\xa9wrt", "TCOM", "COMPOSER", "composer", "NARRATOR"),
        "genre": _tag(tags, "\xa9gen", "TCON", "GENRE", "genre"),
        "subgenre": _tag(tags, "SUBGENRE", "TXXX:SUBGENRE"),
        "year": _tag(tags, "\xa9day", "TDRC", "TYER", "DATE", "date")[:4],
        "language": _tag(tags, "LANGUAGE", "TLAN", "language"),
        "description": _tag(tags, "desc", "\xa9cmt", "COMM::eng", "COMMENT", "DESCRIPTION"),
        "duration": int(info.length) if info is not None and getattr(info, "length", 0) else 0,
        "size": os.path.getsize(caminho),
        "mtime": os.path.getmtime(caminho),
        "lyrics": any(k.startswith(("SYLT", "USLT")) or k in ("\xa9lyr", "LYRICS") for k in chaves),
        "cover": _capa_data_url(dados, mime),
        "chapters": _capitulos(caminho),
    }


def escanear(pasta):
    itens = []
    for nome in sorted(os.listdir(pasta)):
        if nome.startswith("."):
            continue
        p = os.path.join(pasta, nome)
        if os.path.isfile(p) and nome.lower().endswith(EXT):
            item = ler(p)
            base = os.path.splitext(p)[0]
            item["lyrics"] = item["lyrics"] or any(os.path.exists(base + e) for e in (".lrc", ".sync.json"))
            itens.append(item)
        elif os.path.isdir(p) and nome.endswith("(Audiobook)"):
            caps = sorted(os.path.join(p, x) for x in os.listdir(p) if x.lower().endswith(EXT))
            if not caps:
                continue
            item = ler(caps[0])
            album = ""
            try:
                album = _tag(mutagen.File(caps[0]).tags, "TALB", "\xa9alb", "ALBUM")
            except Exception:
                pass
            item["title"] = album or nome[:-len("(Audiobook)")].strip() or item["title"]
            item["files"] = [p]
            item["size"] = sum(os.path.getsize(c) for c in caps)
            item["duration"] = 0
            item["chapters"] = []
            for i, c in enumerate(caps, 1):
                try:
                    d = int(mutagen.File(c).info.length)
                except Exception:
                    d = 0
                item["duration"] += d
                item["chapters"].append({"id": f"c{i}", "title": os.path.splitext(os.path.basename(c))[0],
                                         "duration": f"{d // 60}:{d % 60:02d}"})
            itens.append(item)
    return itens


if __name__ == "__main__":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    pasta = sys.argv[1] if len(sys.argv) > 1 else ""
    print(json.dumps(escanear(pasta) if pasta and os.path.isdir(pasta) else [], ensure_ascii=False))
