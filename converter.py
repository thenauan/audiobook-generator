import os
import re
import asyncio
import shutil
import zipfile
import gc
import json
import sys
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup
from pypdf import PdfReader
import mobi
from deep_translator import GoogleTranslator
from langdetect import detect, DetectorFactory
from mutagen.mp3 import MP3
from mutagen.id3 import ID3, TIT2, TALB, TRCK, TPE1, TPE2, TCON, APIC, CHAP, CTOC
from audio_output import (FORMATOS, EXTENSOES_AUDIO, formato, qualidade, normalizar_capitulo, duracao_ms,
                          gerar_arquivo_unico, codificar_capitulo, obter_communicate)

DetectorFactory.seed = 0

def get_unique_path(base_path):
    if not os.path.exists(base_path):
        return base_path
    name, ext = os.path.splitext(base_path)
    counter = 1
    while os.path.exists(f"{name} ({counter}){ext}"):
        counter += 1
    return f"{name} ({counter}){ext}"

def limpar_texto_tts(texto: str) -> str:
    """Filtro prévio de higienização de texto para TTS.
    Remove quebras de linha com hífen, notas de rodapé, chamadas sobrescritas e números isolados."""
    if not texto:
        return ""
    # 1. Remover soft hyphens (\u00ad) e caracteres invisíveis de diagramação
    texto = texto.replace('\u00ad', '').replace('\ufeff', '').replace('\u200b', '')

    # 2. Unificar palavras com quebra de linha com hífen (ex: transfor-\nmação -> transformação)
    texto = re.sub(r'(\b[a-zA-ZÀ-ÿ]+)[-\u2010\u2011]\s*\r?\n\s*([a-zA-ZÀ-ÿ]+\b)', r'\1\2', texto)

    # 3. Remover blocos de notas de rodapé antes de limpar pontuação inline
    texto = re.sub(r'(?m)^\s*(?:\[\s*\d{1,4}\s*\]|\d{1,4}\.|\*+|[-–—])?\s*(?:Nota\b|N\.\s*(?:do\s*T|da\s*E)|Nota do Tradutor|Nota da Edi[çc][ãa]o|Vide|Cf\.|Ibid|Op\.\s*cit).*$', '', texto, flags=re.IGNORECASE)
    texto = re.sub(r'(?m)^\s*N\.\s*(?:do\s*T|da\s*E)\.?:?.*$', '', texto, flags=re.IGNORECASE)

    # 4. Remover marcas de notas de rodapé inline entre colchetes, ex: [1], [23], [*], [a], [nota 2]
    texto = re.sub(r'\[\s*(?:\d{1,4}|\*+|[a-zA-Z]{1,2}|†|‡|nota\s*\d*|note\s*\d*)\s*\]', '', texto, flags=re.IGNORECASE)

    # 5. Remover dígitos sobrescritos (ex: ¹, ², ³, etc.) usados como chamada de nota
    texto = re.sub(r'[¹²³⁴⁵⁶⁷⁸⁹⁰]+', '', texto)

    # 6. Remover chamadas de notas entre parênteses coladas ao texto, ex: palavra(1) ou ponto.(2)
    texto = re.sub(r'(?<=[a-zA-ZÀ-ÿ\.,;:?!])\(\d{1,3}\)', '', texto)

    # 7. Remover números de página isolados em linhas próprias
    texto = re.sub(r'(?m)^\s*\d{1,4}\s*$', '', texto)

    # 8. Converter quebras de seção (***, * * *, ---, ___) em pausas naturais (. . . . .)
    texto = re.sub(r'(?m)^\s*(?:\*{3,}|-{3,}|_{3,}|\*\s*\*\s*\*)\s*$', '\n\n. . . . .\n\n', texto)

    # 9. Normalizar travessões no início de falas
    texto = re.sub(r'^[–—]\s*', '— ', texto, flags=re.MULTILINE)

    # 10. Normalizar espaços múltiplos e quebras de linha excessivas
    texto = re.sub(r'[ \t]+', ' ', texto)
    texto = re.sub(r'\r\n', '\n', texto)
    texto = re.sub(r'\n{3,}', '\n\n', texto)

    return texto.strip()

def dividir_em_blocos_seguros(texto: str, max_chars: int = 2500) -> list:
    """Divide o texto em blocos de até max_chars respeitando parágrafos e pontuação final.
    Garante 100% de estabilidade no TTS sem cortar palavras ou frases ao meio."""
    if not texto:
        return []
    texto = texto.strip()
    if len(texto) <= max_chars:
        return [texto]
    
    paragrafos = [p.strip() for p in re.split(r'\n\s*\n', texto) if p.strip()]
    blocos = []
    bloco_atual = []
    tamanho_atual = 0
    
    for p in paragrafos:
        if tamanho_atual + len(p) + 2 <= max_chars:
            bloco_atual.append(p)
            tamanho_atual += len(p) + 2
        else:
            if bloco_atual:
                blocos.append("\n\n".join(bloco_atual))
                bloco_atual = []
                tamanho_atual = 0
            
            if len(p) <= max_chars:
                bloco_atual.append(p)
                tamanho_atual = len(p)
            else:
                frases = re.split(r'(?<=[.!?…])\s+', p)
                sub_bloco = []
                sub_tam = 0
                for f in frases:
                    if sub_tam + len(f) + 1 <= max_chars:
                        sub_bloco.append(f)
                        sub_tam += len(f) + 1
                    else:
                        if sub_bloco:
                            blocos.append(" ".join(sub_bloco))
                            sub_bloco = []
                            sub_tam = 0
                        if len(f) <= max_chars:
                            sub_bloco.append(f)
                            sub_tam = len(f)
                        else:
                            palavras = f.split(" ")
                            p_bloco = []
                            p_tam = 0
                            for w in palavras:
                                if p_tam + len(w) + 1 <= max_chars:
                                    p_bloco.append(w)
                                    p_tam += len(w) + 1
                                else:
                                    if p_bloco:
                                        blocos.append(" ".join(p_bloco))
                                        p_bloco = []
                                        p_tam = 0
                                    p_bloco.append(w)
                                    p_tam = len(w)
                            if p_bloco:
                                sub_bloco.append(" ".join(p_bloco))
                                sub_tam += len(" ".join(p_bloco))
                if sub_bloco:
                    bloco_atual.append(" ".join(sub_bloco))
                    tamanho_atual += len(" ".join(sub_bloco))
                    
    if bloco_atual:
        blocos.append("\n\n".join(bloco_atual))
        
    return blocos

def formatar_nome_capitulo(tit_c: str, idx_f: int, total_caps: int) -> str:
    """Garante numeração com zeros à esquerda (ex: 01 - Prefácio.mp3, 10 - Capítulo 9.mp3)
    para evitar erros de ordenação lexicográfica em reprodutores automotivos e portáteis."""
    pad_width = max(2, len(str(total_caps)))
    m_num = re.match(r'^(\d+)\s*[-–—.]?\s*(.*)$', tit_c.strip())
    if m_num:
        num_val = int(m_num.group(1))
        resto = m_num.group(2).strip() or f"Capítulo {num_val}"
        prefixo = f"{num_val:0{pad_width}d}"
        nome_final = f"{prefixo} - {resto}"
    else:
        prefixo = f"{idx_f:0{pad_width}d}"
        nome_final = f"{prefixo} - {tit_c.strip()}"
    return re.sub(r'[\\/*?:\'\"<>|]', '', nome_final).strip()

# Number representations across different languages for chapter parsing
UNIDADES_PT = 'UM|DOIS|TRÊS|QUATRO|CINCO|SEIS|SETE|OITO|NOVE'
DEZENAS_PT = 'DEZ|VINTE|TRINTA|QUARENTA|CINQUENTA|SESSENTA|SETENTA|OITENTA|NOVENTA'
CENTENAS_PT = 'CEM|CENTO|DUZENTOS|TREZENTOS|QUATROCENTOS|QUINHENTOS|SEISCENTOS|SETECENTOS|OITOCENTOS|NOVECENTOS'
ESPECIAIS_PT = 'ONZE|DOZE|TREZE|CATORZE|QUINZE|DEZESSEIS|DEZESSETE|DEZOITO|DEZENOVE'

UNIDADES_EN = 'ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE'
DEZENAS_EN = 'TEN|TWENTY|THIRTY|FORTY|FIFTY|SIXTY|SEVENTY|EIGHTY|NINETY'
CENTENAS_EN = 'ONE HUNDRED|TWO HUNDRED|THREE HUNDRED|FOUR HUNDRED|FIVE HUNDRED|SIX HUNDRED|SEVEN HUNDRED|EIGHT HUNDRED|NINE HUNDRED'
ESPECIAIS_EN = 'ELEVEN|TWELVE|THIRTEEN|FOURTEEN|FIFTEEN|SIXTEEN|SEVENTEEN|EIGHTEEN|NINETEEN'

UNIDADES_ES = 'UNO|DOS|TRES|CUATRO|CINCO|SEIS|SIETE|OCHO|NUEVE'
DEZENAS_ES = 'DIEZ|VEINTE|TREINTA|CUARENTA|CINCUENTA|SESENTA|SETENTA|OCHENTA|NOVENTA'
CENTENAS_ES = 'CIEN|CIENTO|DOSCIENTOS|TRESCIENTOS|CUATROCIENTOS|QUINIENTOS|SEISCIENTOS|SETECIENTOS|OCHOCIENTOS|NOVECIENTOS'
ESPECIAIS_ES = 'ONCE|DOCE|TRECE|CATORCE|QUINCE|DIECISEIS|DIECISIETE|DIECIOCHO|DIECINUEVE|VEINTIUNO|VEINTIDOS|VEINTITRES|VEINTICUATRO|VEINTICINCO|VEINTISEIS|VEINTISIETE|VEINTIOCHO|VEINTINUEVE'

UNIDADES_AR = 'واحد|اثنان|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة'

UNIDADES = f'{UNIDADES_PT}|{UNIDADES_EN}|{UNIDADES_ES}|{UNIDADES_AR}'
DEZENAS = f'{DEZENAS_PT}|{DEZENAS_EN}|{DEZENAS_ES}'
CENTENAS = f'{CENTENAS_PT}|{CENTENAS_EN}|{CENTENAS_ES}'
ESPECIAIS = f'{ESPECIAIS_PT}|{ESPECIAIS_EN}|{ESPECIAIS_ES}'

EXTENSO_COMPLETO = rf'(?:(?:{CENTENAS})|(?:{DEZENAS})(?:\s+(?:E|AND|Y)\s+(?:{UNIDADES}))?|{UNIDADES}|{ESPECIAIS})'

PALAVRAS_CHAVE = [
    'PRÓLOGO', 'PROLOGO', 'EPÍLOGO', 'EPILOGO', 'INTRODUÇÃO', 'CAPÍTULO', 'CAPITULO', 'PREFÁCIO',
    'PROLOGUE', 'EPILOGUE', 'INTRODUCTION', 'CHAPTER', 'PREFACE',
    'INTRODUCCIÓN', 'INTRODUCCION', 'PREFACIO',
    'مقدمة', 'فصل', 'خاتمة', 'تمهيد', 'الفصل'
]

def emit(event):
    # Sends Server-Sent Events (SSE) data to the Node.js frontend
    print(json.dumps(event), flush=True)

def extrair_texto(caminho):
    # Extracts text content based on the file extension
    ext = caminho.lower().split('.')[-1]
    try:
        if ext == 'txt':
            with open(caminho, 'r', encoding='utf-8') as f: return f.read()
        elif ext == 'epub':
            try:
                # Try reading proper EPUB structure
                book = epub.read_epub(caminho)
                return "\n\n".join([BeautifulSoup(i.get_content(), 'html.parser').get_text(separator='\n\n', strip=True) 
                                    for i in book.get_items() if i.get_type() == 1])
            except:
                # Fallback to raw HTML extraction for badly formatted EPUBs
                texto_fallback = []
                with zipfile.ZipFile(caminho, 'r') as z:
                    for item in z.namelist():
                        if item.endswith(('.html', '.xhtml', '.htm')):
                            soup = BeautifulSoup(z.read(item), 'html.parser')
                            texto_fallback.append(soup.get_text(separator='\n\n', strip=True))
                return "\n\n".join(texto_fallback)
        elif ext == 'pdf':
            return "\n\n".join([p.extract_text() for p in PdfReader(caminho).pages if p.extract_text()])
        elif ext in ['mobi', 'azw']:
            temp_dir, html_content = mobi.extract(caminho)
            with open(html_content, 'r', encoding='utf-8') as f:
                texto = BeautifulSoup(f.read(), 'html.parser').get_text(separator='\n\n', strip=True)
            if os.path.exists(temp_dir): shutil.rmtree(temp_dir)
            return texto
    except Exception as e:
        emit({"type": "log", "message": f"Extraction error: {e}"})
        return None

async def traduzir_bloco(idx, bloco, semaforo, file_id, total_blocos, progress_state, target_lang):
    # Translates a single text block asynchronously with retries and timeout
    async with semaforo:
        espera = 3
        for _ in range(4):
            try:
                tradutor = GoogleTranslator(source='auto', target=target_lang)
                res = await asyncio.wait_for(
                    asyncio.to_thread(tradutor.translate, bloco),
                    timeout=45.0
                )
                progress_state['done'] += 1
                emit({"type": "progress", "fileId": file_id, "status": "translating", "progress": (progress_state['done'] / total_blocos) * 100})
                return idx, res
            except asyncio.TimeoutError:
                emit({"type": "log", "message": f"Timeout na tradução do bloco {idx} (tentativa {_ + 1})."})
            except Exception as e:
                emit({"type": "log", "message": f"Erro na tradução do bloco {idx} (tentativa {_ + 1}): {repr(e)}"})
                
            if _ == 3:
                break
            await asyncio.sleep(espera)
            espera *= 2
            
        progress_state['done'] += 1
        emit({"type": "progress", "fileId": file_id, "status": "translating", "progress": (progress_state['done'] / total_blocos) * 100})
        return idx, bloco

async def traduzir_texto(texto_bruto, file_id, target_lang):
    # Splits text into smaller chunks (~3000 chars) to respect translation API limits
    paragrafos = texto_bruto.split('\n\n')
    blocos, bloco_atual, tam = [], [], 0
    for p in paragrafos:
        if tam + len(p) < 3000:
            bloco_atual.append(p)
            tam += len(p) + 2
        else:
            if bloco_atual: blocos.append("\n\n".join(bloco_atual))
            bloco_atual, tam = [p], len(p)
    if bloco_atual: blocos.append("\n\n".join(bloco_atual))

    semaforo = asyncio.Semaphore(10)
    progress_state = {'done': 0}
    tasks = [traduzir_bloco(i, b, semaforo, file_id, len(blocos), progress_state, target_lang) for i, b in enumerate(blocos)]
    resultados = await asyncio.gather(*tasks)
    
    resultados.sort(key=lambda x: x[0])
    return "\n\n".join([r[1] for r in resultados])

def identificar_marcos(linhas, idx, modo_romano):
    # Identifies chapter markers based on keywords or roman numerals
    linha = linhas[idx].strip()
    if not linha: return False, None, 0
    up = linha.upper()
    for pw in PALAVRAS_CHAVE:
        if up.startswith(pw):
            reg = rf'^({pw}(?:\s+(?:\b(?:{EXTENSO_COMPLETO})\b|\d+))?)(.*)$'
            m = re.match(reg, up, re.IGNORECASE)
            if not m and modo_romano:
                m = re.match(rf'^({pw}(?:\s+\b[IVXLCDM]+\b)?)(.*)$', up, re.IGNORECASE)
            if m:
                tit, resto = m.group(1).strip(), m.group(len(m.groups())).strip()
                if not resto and idx + 1 < len(linhas):
                    prox = linhas[idx+1].strip()
                    if 0 < len(prox) < 45 and not prox.endswith(('.', '!', '?', ':')): 
                        return True, f"{tit} {prox}".title(), 2
                return True, tit.title(), 1
    if re.match(r'^(\d+|[IVXLCDM]+)\.?\s*$', up): return True, f"Capítulo {up.replace('.', '')}", 1
    return False, None, 0

def estruturar_obra_nlp(texto_bruto, eh_traducao):
    # Parses the raw text into a structured chapter list using NLP heuristics
    linhas_raw = texto_bruto.split('\n')
    contagem = {}
    for l in linhas_raw:
        if len(l.strip()) > 15: contagem[l.strip()] = contagem.get(l.strip(), 0) + 1
    lixo = {l for l, c in contagem.items() if c > 3}
    linhas = [l.strip() for l in linhas_raw if l.strip() not in lixo and l.strip()]
    
    score_romano = sum(5 for l in linhas[:1000] if re.search(r'\b(?:CAP[ÍI]TULO|CHAPTER|فصل|الفصل)\s+[IVXLC]+\b', l.upper()))
    modo_romano = score_romano >= 10
    capitulos = []
    cap_atual = {"titulo": "00 - Introducao", "conteudo": []}
    
    i = 0
    while i < len(linhas):
        is_cap, tit, cons = identificar_marcos(linhas, i, modo_romano)
        if is_cap:
            if cap_atual["conteudo"]:
                cap_atual["conteudo"] = "".join(cap_atual["conteudo"]).strip()
                capitulos.append(cap_atual)
            cap_atual = {"titulo": f"{len(capitulos):02d} - {tit}", "conteudo": []}
            i += cons
        else:
            p = re.sub(r'([a-zA-Z])\1{3,}', r'\1\1', linhas[i].replace('“', '"').replace('”', '"'))
            p = re.sub(r'^[-–—]\s*', '— ', p, flags=re.MULTILINE)
            if eh_traducao or (p and p[-1] in ['.', '!', '?', ':', '"', '—']):
                cap_atual["conteudo"].append(p + "\n\n")
            else:
                cap_atual["conteudo"].append(p + " ")
            i += 1
                
    if cap_atual["conteudo"]:
        cap_atual["conteudo"] = "".join(cap_atual["conteudo"]).strip()
        capitulos.append(cap_atual)
    return capitulos

def dividir_capitulos_longos(capitulos, max_chars=35000):
    """Detecta capítulos excessivamente longos (> ~6.000 palavras / 45 minutos de áudio)
    e os divide automaticamente em partes (Parte 1, Parte 2) em quebras de parágrafos naturais."""
    caps_finais = []
    for cap in capitulos:
        conteudo = cap.get("conteudo", "")
        palavras = len(conteudo.split()) if conteudo else 0
        if len(conteudo) > max_chars or palavras > 6000:
            num_partes = max(2, (len(conteudo) + max_chars - 1) // max_chars)
            paragrafos = [p.strip() for p in re.split(r'\n\s*\n', conteudo) if p.strip()]
            partes_conteudo = [[] for _ in range(num_partes)]
            tam_por_parte = len(conteudo) // num_partes
            
            p_idx = 0
            cur_tam = 0
            for p in paragrafos:
                partes_conteudo[p_idx].append(p)
                cur_tam += len(p)
                if cur_tam >= tam_por_parte and p_idx < num_partes - 1:
                    p_idx += 1
                    cur_tam = 0
                    
            for idx_p, p_paras in enumerate(partes_conteudo, start=1):
                p_text = "\n\n".join(p_paras).strip()
                if p_text:
                    orig_tit = cap.get("titulo", "Capítulo")
                    caps_finais.append({
                        "titulo": f"{orig_tit} - Parte {idx_p}",
                        "conteudo": p_text
                    })
        else:
            caps_finais.append(cap)
    return caps_finais

    # If the text has no chapters, split arbitrarily to prevent massive single files
    if len(capitulos) == 1 and len(capitulos[0]["conteudo"]) > 50000:
        texto_gigante = capitulos[0]["conteudo"]
        novos_caps = []
        for idx, start in enumerate(range(0, len(texto_gigante), 35000)):
            novos_caps.append({"titulo": f"Parte {idx+1:02d}", "conteudo": texto_gigante[start:start+35000]})
        return dividir_capitulos_longos(novos_caps)
        
    return dividir_capitulos_longos(capitulos)

from text_processor import melhorar_pronuncia

async def baixar_bloco_audio(idx, texto, voz, semaforo_tts, file_id, total_blocos, progress_state, sync_enabled=True, cache_dir=None, idx_f=1):
    # Recupera áudio via Edge TTS com suporte a cache local para retomada automática
    mult = 75 if sync_enabled else 100
    chunk_cache_path = os.path.join(cache_dir, f"chunk_{idx_f}_{idx}_hq.mp3") if cache_dir else None

    # 1. Verificar cache em disco do bloco individual (Prioridade 1: Resiliência)
    if chunk_cache_path and os.path.exists(chunk_cache_path) and os.path.getsize(chunk_cache_path) > 150:
        try:
            with open(chunk_cache_path, "rb") as f:
                data = f.read()
            if len(data) > 150:
                progress_state['done'] += 1
                prog = (progress_state['done'] / total_blocos) * mult
                emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": prog, "partsDone": progress_state['done'], "partsTotal": total_blocos})
                return idx, bytearray(data)
        except Exception:
            pass

    async with semaforo_tts:
        espera = 5
        for tentativa in range(6):
            buf = bytearray()
            try:
                async def fetch():
                    comm = obter_communicate()(texto, voz)
                    async for chunk in comm.stream():
                        if chunk["type"] == "audio":
                            buf.extend(chunk["data"])
                await asyncio.wait_for(fetch(), timeout=60.0)
                if len(buf) > 100:
                    # Persistir bloco no cache imediatamente
                    if chunk_cache_path:
                        try:
                            with open(chunk_cache_path, "wb") as f:
                                f.write(buf)
                        except Exception:
                            pass
                    progress_state['done'] += 1
                    prog = (progress_state['done'] / total_blocos) * mult
                    emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": prog, "partsDone": progress_state['done'], "partsTotal": total_blocos})
                    return idx, buf
                raise ValueError("Vazio")
            except (Exception, asyncio.TimeoutError) as e:
                emit({"type": "log", "message": f"Aviso: TTS falhou no bloco {idx} (Tentativa {tentativa + 1}/6) - {repr(e)}"})
                await asyncio.sleep(espera)
                espera += 5
                
        emit({"type": "log", "message": f"Erro Critico: Bloco {idx} falhou apos 6 tentativas."})
        progress_state['done'] += 1
        prog = (progress_state['done'] / total_blocos) * mult
        emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": prog, "partsDone": progress_state['done'], "partsTotal": total_blocos})
        return idx, bytearray()

def embutir_capa_id3(audio, cover_base64):
    if not cover_base64:
        return
    try:
        import base64
        clean_b64 = str(cover_base64).strip()
        mime = 'image/jpeg'
        if clean_b64.startswith('data:'):
            header, clean_b64 = clean_b64.split(',', 1)
            if 'image/png' in header:
                mime = 'image/png'
            elif 'image/webp' in header:
                mime = 'image/webp'
            elif 'image/svg+xml' in header:
                mime = 'image/svg+xml'
        raw_bytes = base64.b64decode(clean_b64)
        audio.tags.add(
            APIC(
                encoding=3,
                mime=mime,
                type=3,
                desc=u'Cover',
                data=raw_bytes
            )
        )
    except Exception as e:
        emit({"type": "log", "message": f"Aviso ao embutir capa ID3: {e}"})

def aplicar_tags_capitulo_mp3(caminho, titulo, autor, album, faixa, cover_base64=None, genero=None, narrador=None):
    # Tags ID3 de um capítulo (modo um arquivo por capítulo)
    try:
        audio = MP3(caminho, ID3=ID3)
        if audio.tags is None: audio.add_tags()
        audio.tags.add(TIT2(encoding=3, text=titulo))
        audio.tags.add(TALB(encoding=3, text=album))
        audio.tags.add(TRCK(encoding=3, text=str(faixa)))
        audio.tags.add(TPE1(encoding=3, text=autor))
        if genero:
            audio.tags.add(TCON(encoding=3, text=str(genero)))
        if narrador:
            audio.tags.add(TPE2(encoding=3, text=str(narrador)))
        embutir_capa_id3(audio, cover_base64)
        audio.save(v2_version=3)
    except Exception as e:
        emit({"type": "log", "message": f"Erro tags ID3: {e}"})

def aplicar_tags_arquivo_unico(caminho, titulo, autor, cover_base64, chapters_info, genero=None, narrador=None):
    # Specifically embeds table of contents (TOC) and chapters markers into single-file outputs
    try:
        audio = MP3(caminho, ID3=ID3)
        if audio.tags is None: audio.add_tags()
        audio.tags.add(TIT2(encoding=3, text=titulo))
        audio.tags.add(TALB(encoding=3, text=titulo))
        audio.tags.add(TRCK(encoding=3, text="1"))
        audio.tags.add(TPE1(encoding=3, text=autor))
        if genero:
            audio.tags.add(TCON(encoding=3, text=str(genero)))
        if narrador:
            audio.tags.add(TPE2(encoding=3, text=str(narrador)))
        
        embutir_capa_id3(audio, cover_base64)
            
        if chapters_info:
            child_ids = []
            for ch in chapters_info:
                child_id = ch["id"].encode('utf-8')
                child_ids.append(child_id)
                chap = CHAP(
                    element_id=child_id,
                    start_time=ch["start_time"],
                    end_time=ch["end_time"],
                    sub_frames=[TIT2(encoding=3, text=ch["title"])]
                )
                audio.tags.add(chap)
                
            ctoc = CTOC(element_id=b"toc", flags=3, child_element_ids=child_ids, sub_frames=[TIT2(encoding=3, text="Table of Contents")])
            audio.tags.add(ctoc)
            
        audio.save(v2_version=3)
    except Exception as e:
        emit({"type": "log", "message": f"Erro tags ID3 arquivo unico: {e}"})

async def upload_to_drive_async(file_path, folder_id, file_id, emit):
    # Handles background asynchronous uploading to Google Drive
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from google.oauth2.credentials import Credentials
        
        if not os.path.exists('token.json'):
            return
            
        creds = Credentials.from_authorized_user_file('token.json', ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'])
        service = build('drive', 'v3', credentials=creds)
        
        file_name = os.path.basename(file_path)
        file_metadata = {'name': file_name, 'parents': [folder_id]} if folder_id and folder_id != 'root' else {'name': file_name}
        media = MediaFileUpload(file_path, mimetype='audio/mpeg', resumable=True)
        
        def upload():
            request = service.files().create(body=file_metadata, media_body=media, fields='id')
            response = None
            while response is None: status, response = request.next_chunk()
            
        await asyncio.to_thread(upload)
    except Exception as e:
        emit({"type": "log", "message": f"Erro no upload para o Drive: {e}"})

async def process_file(file_info, config):
    # Main pipeline: Extract -> Translate -> Optimize -> Structure -> TTS -> Save -> Upload
    try:
        file_id = file_info["id"]
        caminho = file_info["path"]
        titulo = file_info["title"]
        autor = file_info["author"]
        genero = file_info.get("genre", "")
        subgenero = file_info.get("subgenre", "")
        narrador = file_info.get("narrator", "")
        eh_trad = file_info.get("translate", False)
        
        # --- Robust Configuration Parsing ---
        # The most reliable config is the one embedded within the file's own info.
        app_config = file_info.get("config", {})

        # If not embedded, try to find it in the root object from the backend.
        if not app_config:
            app_config = config.get("config", config)

        # The config might be a JSON string that needs parsing.
        if isinstance(app_config, str):
            try:
                app_config = json.loads(app_config.replace('\\', '/'))
            except json.JSONDecodeError:
                app_config = {} # Failed to parse, reset to empty dict

        # Extract individual settings from the parsed config, with defaults.
        pasta_destino = app_config.get("outputFolder") or app_config.get("output_dir")
        voz_final = app_config.get("voice", "pt-BR-AntonioNeural")
        modo_pasta = app_config.get("mode_folder", True)
        target_lang = app_config.get("target_lang", "pt")

        # --- Aggressive Fallback ---
        # If pasta_destino is still missing, perform a raw regex search on the command line arguments.
        if not pasta_destino:
            raw_args = sys.argv[1] if len(sys.argv) > 1 else ''
            m = re.search(r'(?:outputFolder|output_dir).*?[:=]\s*\\?["\']?([^"\'},]+)', raw_args, re.IGNORECASE)
            if m: pasta_destino = m.group(1).strip().replace('\\\\', '/').replace('\\', '/')
        
        if not pasta_destino:
            raw_args_preview = (sys.argv[1] if len(sys.argv) > 1 else '')[:200]
            emit({"type": "error", "fileId": file_id, "error": f"CRITICAL: Destination folder not found. Raw data: {raw_args_preview}..."})
            return
            
        emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": 0})
        
        texto = await asyncio.to_thread(extrair_texto, caminho)
        if not texto:
            emit({"type": "error", "fileId": file_id, "error": "Failed to extract text"})
            return

        # Prioridade 2 (Qualidade): Filtro prévio de limpeza para TTS (hífens de quebra de linha, notas de rodapé, números soltos)
        texto = limpar_texto_tts(texto)

        if eh_trad:
            emit({"type": "progress", "fileId": file_id, "status": "translating", "progress": 0})
            texto = await traduzir_texto(texto, file_id, target_lang)
            texto = limpar_texto_tts(texto)
            
        pronunciation_map = file_info.get("pronunciationMap") or file_info.get("pronunciation_map") or app_config.get("pronunciation_map") or []
        emit({"type": "progress", "fileId": file_id, "status": "editing", "progress": 0})
        texto = await asyncio.to_thread(melhorar_pronuncia, texto, voz_final, pronunciation_map)
        emit({"type": "progress", "fileId": file_id, "status": "editing", "progress": 100})
        
        user_chapters = file_info.get("chapters")
        if user_chapters and isinstance(user_chapters, list) and len(user_chapters) > 0:
            caps = []
            for uc in user_chapters:
                tit = (uc.get("title") or "").strip() or "Capítulo"
                conteudo = limpar_texto_tts((uc.get("content") or uc.get("conteudo") or "").strip())
                caps.append({"titulo": tit, "conteudo": conteudo})
            # Se todos os conteúdos estiverem vazios (caso apenas títulos tenham sido enviados), preenche a partir de estruturar_obra_nlp
            if not any(c["conteudo"] for c in caps):
                raw_caps = await asyncio.to_thread(estruturar_obra_nlp, texto, eh_trad)
                for idx, rc in enumerate(raw_caps):
                    if idx < len(caps):
                        caps[idx]["conteudo"] = limpar_texto_tts(rc["conteudo"])
                    else:
                        caps.append({"titulo": rc["titulo"], "conteudo": limpar_texto_tts(rc["conteudo"])})
        else:
            caps = await asyncio.to_thread(estruturar_obra_nlp, texto, eh_trad)
            for c in caps:
                c["conteudo"] = limpar_texto_tts(c["conteudo"])

        # Divisão automática de capítulos longos (> 6.000 palavras / 45 min)
        caps = dividir_capitulos_longos(caps, max_chars=35000)

        nome_dir = re.sub(r'[\\/*?:\'\"<>|]', '', titulo).strip() or "Audiobook"
        pasta_destino_limpa = pasta_destino.replace('\\', '/')

        # Prioridade 3 (Formato): formato do arquivo (m4b, mp3 único, opus, flac, wav ou um mp3 por capítulo) e qualidade
        file_cfg = file_info.get("config", {}) or {}
        file_format = file_info.get("fileType") or file_info.get("file_format") or file_cfg.get("file_format") or file_cfg.get("fileType") or app_config.get("file_format") or app_config.get("fileType") or ("multiple" if modo_pasta else "single")
        fmt_saida = formato(file_format)
        qualidade_saida = qualidade(file_info.get("audio_quality") or file_cfg.get("audio_quality") or app_config.get("audio_quality"))
        is_multiple = (fmt_saida == 'multiple')
        ext_saida = FORMATOS[fmt_saida]["ext"]

        dests = []
        if is_multiple:
            p_base = os.path.join(pasta_destino_limpa, f"{nome_dir} (Audiobook)")
            p = get_unique_path(p_base)
            os.makedirs(p, exist_ok=True)
            dests.append(p)
        else:
            os.makedirs(pasta_destino_limpa, exist_ok=True)
            dests.append(pasta_destino_limpa)

        # Prioridade 1 (Resiliência): Cache persistente por livro para retomada transparente após falhas
        safe_titulo_cache = re.sub(r'[\\/*?:\'\"<>|]', '_', titulo).strip() or "audiobook"
        cache_base = os.path.join(pasta_destino_limpa, ".cache_audiobooks")
        cache_dir = os.path.join(cache_base, safe_titulo_cache)
        os.makedirs(cache_dir, exist_ok=True)

        jobs = []; total_p = 0
        for c in caps:
            tit_intro = f"{c['titulo']}."
            conteudo_cap = c['conteudo']
            texto_capitulo = f"{tit_intro}\n\n{conteudo_cap}" if conteudo_cap else tit_intro
            # Chunking seguro respeitando parágrafos e pontuação final (2.000 a 2.500 caracteres)
            partes = dividir_em_blocos_seguros(texto_capitulo, max_chars=2500)
            if not partes:
                partes = [tit_intro]
            jobs.append((c['titulo'], partes))
            total_p += len(partes)

        total_p = max(1, total_p) # Ensure it does not divide by zero on the frontend
        emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": 5, "partsDone": 0, "partsTotal": total_p})

        semaforo_g = asyncio.Semaphore(4)
        progress_state = {'done': 0}
        generated_files = []
        chapters_info = []
        current_time_ms = 0

        gerar_sync = file_info.get("generate_sync_text", file_cfg.get("generate_sync_text", app_config.get("generate_sync_text", True)))
        if gerar_sync is None or gerar_sync == "":
            gerar_sync = True

        for idx_f, (tit_c, pedacos) in enumerate(jobs, start=1):
            # Capítulo normalizado e guardado sem perda (FLAC): o formato final é codificado uma única vez
            chap_file = os.path.join(cache_dir, f"cap_{idx_f}.flac")

            if os.path.exists(chap_file) and os.path.getsize(chap_file) > 1024:
                emit({"type": "log", "message": f"Capítulo {idx_f} recuperado do cache com sucesso."})
                progress_state['done'] += len(pedacos)
                mult = 75 if gerar_sync else 100
                prog = (progress_state['done'] / total_p) * mult
                emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": prog, "partsDone": progress_state['done'], "partsTotal": total_p})
            else:
                tasks = [baixar_bloco_audio(idx, p, voz_final, semaforo_g, file_id, total_p, progress_state, gerar_sync, cache_dir, idx_f) for idx, p in enumerate(pedacos)]
                res = await asyncio.gather(*tasks)
                res.sort(key=lambda x: x[0])
                raw_audio = bytearray()
                for _, data in res:
                    raw_audio.extend(data)
                if len(raw_audio) <= 500:
                    emit({"type": "log", "message": f"Aviso: capítulo {idx_f} ficou sem áudio e foi ignorado."})
                    continue

                raw_cap_path = os.path.join(cache_dir, f"raw_cap_{idx_f}.mp3")
                with open(raw_cap_path, "wb") as cf:
                    cf.write(raw_audio)
                # Normalização EBU R128 (-18 LUFS) e pausa de silêncio natural de 1.5s
                if await asyncio.to_thread(normalizar_capitulo, raw_cap_path, chap_file):
                    try:
                        os.remove(raw_cap_path)
                    except Exception:
                        pass
                else:
                    chap_file = raw_cap_path  # sem ffmpeg funcional: usa a voz original

            if is_multiple:
                for d in dests:
                    nome_seguro = formatar_nome_capitulo(tit_c, idx_f, len(jobs))
                    full_path = get_unique_path(os.path.join(d, f"{nome_seguro}{ext_saida}"))
                    await asyncio.to_thread(codificar_capitulo, chap_file, full_path, fmt_saida, qualidade_saida)
                    await asyncio.to_thread(aplicar_tags_capitulo_mp3, full_path, tit_c, autor, titulo, idx_f, file_info.get("cover"), genero, narrador)
                    generated_files.append(full_path)
            else:
                dur_ms = await asyncio.to_thread(duracao_ms, chap_file)
                if dur_ms > 0:
                    chapters_info.append({"id": f"ch{idx_f}", "title": tit_c, "start_time": current_time_ms, "end_time": current_time_ms + dur_ms, "file": chap_file})
                    current_time_ms += dur_ms

        if not is_multiple:
            emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": 72, "message": f"Compilando audiobook {ext_saida} com capítulos..."})
            nome_seguro_unico = re.sub(r'[\\/*?:\'\"<>|]', '', titulo).strip() or "Audiobook"
            for d in dests:
                saida_unica = get_unique_path(os.path.join(d, f"{nome_seguro_unico}{ext_saida}"))
                await asyncio.to_thread(gerar_arquivo_unico, saida_unica, fmt_saida, qualidade_saida, chapters_info, titulo, autor, genero, narrador, file_info.get("cover"), cache_dir)
                if ext_saida == ".mp3":
                    await asyncio.to_thread(aplicar_tags_arquivo_unico, saida_unica, titulo, autor, file_info.get("cover"), chapters_info, genero, narrador)
                generated_files.append(saida_unica)

        # --- ETAPA DE SINCRONIZAÇÃO DE TEXTO COM O AUDIOBOOK ---
        # Uma única passada do motor gera o texto; o destino (metadados, biblioteca ou ambos) vem dos Ajustes.
        sync_text_info = None
        if gerar_sync:
            emit({"type": "progress", "fileId": file_id, "status": "syncing", "progress": 78, "message": "Iniciando alinhamento de texto e áudio..."})
            try:
                from sync_text_tools import generate_sync_text

                destino_texto = file_info.get("sync_text_destination", file_cfg.get("sync_text_destination", app_config.get("sync_text_destination", "both")))
                dest_dir = dests[0] if dests else pasta_destino_limpa
                audios = [p for p in generated_files if os.path.splitext(p)[1].lower() in EXTENSOES_AUDIO]
                main_audio_path = audios[0] if audios else None
                # Um arquivo por capítulo: o texto do livro inteiro não cabe nas tags de cada parte
                alvos_metadados = audios if not is_multiple else []

                emit({"type": "progress", "fileId": file_id, "status": "syncing", "progress": 85, "message": "Estruturando capítulos, frases e timestamps..."})
                resultado = generate_sync_text(
                    audio_path=main_audio_path,
                    ebook_path=caminho,
                    out_dir=dest_dir,
                    title=titulo,
                    author=autor,
                    destination=destino_texto,
                    custom_chapters=caps,
                    embed_targets=alvos_metadados,
                    log=lambda m: emit({"type": "log", "message": m}),
                )
                generated_files.extend(resultado["files"])
                if resultado.get("fallbackToLibrary"):
                    emit({"type": "log", "message": "Este formato não guarda texto nos metadados: o texto foi salvo na pasta da biblioteca."})
                sync_text_info = {
                    "content": resultado["content"],
                    "format": resultado["format"],
                    "wordCount": resultado["wordCount"],
                    "savedToLibrary": resultado["savedToLibrary"],
                    "embedded": len(resultado["embedded"]) > 0,
                }
                emit({"type": "progress", "fileId": file_id, "status": "syncing", "progress": 99, "message": "Texto sincronizado com sucesso!"})
            except Exception as se:
                emit({"type": "log", "message": f"Aviso sincronização texto: {se}"})

        drive_folder_id = config.get("driveFolderId")
        if drive_folder_id and os.path.exists('token.json'):
            for f in generated_files:
                await upload_to_drive_async(f, drive_folder_id, file_id, emit)

        # --- CALCULATE FINAL METRICS FOR UI ---
        final_size_bytes = sum(os.path.getsize(p) for p in generated_files if os.path.exists(p))
        final_size_mb = final_size_bytes / (1024 * 1024)
        final_size_str = f"{final_size_mb:.2f} MB"

        final_duration_ms = sum(duracao_ms(p) for p in generated_files
                                if os.path.exists(p) and os.path.splitext(p)[1].lower() in EXTENSOES_AUDIO)

        final_duration_str = ""
        if final_duration_ms > 0:
            s = int(final_duration_ms / 1000)
            h = s // 3600
            m = (s % 3600) // 60
            final_duration_str = f"{h}h {m}m" if h > 0 else f"{m}m"

        emit({"type": "done", "fileId": file_id, "paths": generated_files, "finalSize": final_size_str, "finalDuration": final_duration_str, "syncText": sync_text_info})

        # Limpeza do cache do livro após conclusão com 100% de sucesso
        try:
            shutil.rmtree(cache_dir, ignore_errors=True)
            if os.path.exists(cache_base) and not os.listdir(cache_base):
                os.rmdir(cache_base)
        except Exception:
            pass
    except Exception as e:
        import traceback
        emit({"type": "log", "message": f"Erro em '{file_info.get('title', '')}': {traceback.format_exc()[-1500:]}"})
        emit({"type": "error", "fileId": file_info["id"], "error": str(e)})

async def main():
    if len(sys.argv) < 2:
        print("Uso: python converter.py '<json_config>'")
        sys.exit(1)
        
    config_arg = sys.argv[1]
    
    # Permite ler arquivo JSON ou string diretamente (à prova de limite de caracteres)
    if config_arg.endswith('.json') and os.path.exists(config_arg):
        with open(config_arg, 'r', encoding='utf-8') as f:
            config = json.load(f)
    else:
        config = json.loads(config_arg)
    
    files = config.get("files", [])
    
    await asyncio.gather(*[process_file(f, config) for f in files])

if __name__ == "__main__":
    asyncio.run(main())
