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
from mutagen.id3 import ID3, TIT2, TALB, TRCK, TPE1

DetectorFactory.seed = 0

def get_unique_path(base_path):
    if not os.path.exists(base_path):
        return base_path
    name, ext = os.path.splitext(base_path)
    counter = 1
    while os.path.exists(f"{name} ({counter}){ext}"):
        counter += 1
    return f"{name} ({counter}){ext}"

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

    # If the text has no chapters, split arbitrarily to prevent massive single files
    if len(capitulos) == 1 and len(capitulos[0]["conteudo"]) > 50000:
        texto_gigante = capitulos[0]["conteudo"]
        novos_caps = []
        for idx, start in enumerate(range(0, len(texto_gigante), 40000)):
            novos_caps.append({"titulo": f"Parte {idx+1:02d}", "conteudo": texto_gigante[start:start+40000]})
        return novos_caps
        
    return capitulos

from text_processor import melhorar_pronuncia

async def baixar_bloco_audio(idx, texto, voz, semaforo_tts, file_id, total_blocos, progress_state):
    # Fetches the audio buffer from Edge TTS with exponential backoff and a slight stagger to prevent rate limits
    async with semaforo_tts:
        espera = 5
        for _ in range(6):
            buf = bytearray()
            try:
                async def fetch():
                    import edge_tts
                    comm = edge_tts.Communicate(texto, voz)
                    async for chunk in comm.stream():
                        if chunk["type"] == "audio": buf.extend(chunk["data"])
                await asyncio.wait_for(fetch(), timeout=60.0)
                if len(buf) > 100:
                    progress_state['done'] += 1
                    emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": (progress_state['done'] / total_blocos) * 100, "partsDone": progress_state['done'], "partsTotal": total_blocos})
                    return idx, buf
                raise ValueError("Vazio")
            except (Exception, asyncio.TimeoutError) as e:
                emit({"type": "log", "message": f"Aviso: TTS falhou no bloco {idx} (Tentativa {_ + 1}/6) - {repr(e)}"})
                await asyncio.sleep(espera)
                espera += 5
                
        emit({"type": "log", "message": f"Erro Critico: Bloco {idx} falhou apos 6 tentativas."})
        progress_state['done'] += 1
        emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": (progress_state['done'] / total_blocos) * 100, "partsDone": progress_state['done'], "partsTotal": total_blocos})
        return idx, bytearray()

def persistir_no_disco(caminho, resultados, titulo, autor, album, faixa, modo_pasta, cover_base64=None):
    # Persists the concatenated audio chunks to disk and embeds ID3 metadata
    with open(caminho, "wb") as f:
        for _, data in resultados: f.write(data)
    try:
        from mutagen.id3 import APIC, CHAP, CTOC
        audio = MP3(caminho, ID3=ID3)
        if audio.tags is None: audio.add_tags()
        audio.tags.add(TIT2(encoding=3, text=titulo if modo_pasta else album))
        audio.tags.add(TALB(encoding=3, text=album))
        audio.tags.add(TRCK(encoding=3, text=str(faixa)))
        audio.tags.add(TPE1(encoding=3, text=autor))
        
        if cover_base64:
            import base64
            audio.tags.add(
                APIC(
                    encoding=3,
                    mime='image/jpeg',
                    type=3,
                    desc=u'Cover',
                    data=base64.b64decode(cover_base64)
                )
            )
            
        audio.save(v2_version=3)
    except Exception as e:
        emit({"type": "log", "message": f"Erro tags ID3: {e}"})

def aplicar_tags_arquivo_unico(caminho, titulo, autor, cover_base64, chapters_info):
    # Specifically embeds table of contents (TOC) and chapters markers into single-file outputs
    try:
        from mutagen.id3 import APIC, CHAP, CTOC
        audio = MP3(caminho, ID3=ID3)
        if audio.tags is None: audio.add_tags()
        audio.tags.add(TIT2(encoding=3, text=titulo))
        audio.tags.add(TALB(encoding=3, text=titulo))
        audio.tags.add(TRCK(encoding=3, text="1"))
        audio.tags.add(TPE1(encoding=3, text=autor))
        
        if cover_base64:
            import base64
            audio.tags.add(
                APIC(
                    encoding=3,
                    mime='image/jpeg',
                    type=3,
                    desc=u'Cover',
                    data=base64.b64decode(cover_base64)
                )
            )
            
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

        if eh_trad:
            emit({"type": "progress", "fileId": file_id, "status": "translating", "progress": 0})
            texto = await traduzir_texto(texto, file_id, target_lang)
            
        emit({"type": "progress", "fileId": file_id, "status": "editing", "progress": 0})
        texto = await asyncio.to_thread(melhorar_pronuncia, texto, voz_final)
        emit({"type": "progress", "fileId": file_id, "status": "editing", "progress": 100})
        
        caps = await asyncio.to_thread(estruturar_obra_nlp, texto, eh_trad)

        nome_dir = re.sub(r'[\\/*?:\'\"<>|]', '', titulo) # Sanitize directory name
        pasta_destino_limpa = pasta_destino.replace('\\', '/')
        dests = []
        if modo_pasta:
            p_base = os.path.join(pasta_destino_limpa, f"{nome_dir} (Audiobook)")
            p = get_unique_path(p_base)
            os.makedirs(p, exist_ok=True)
            dests.append(p)
        else:
            os.makedirs(pasta_destino_limpa, exist_ok=True)
            dests.append(pasta_destino_limpa)

        jobs = []; total_p = 0
        for c in caps:
            narr = f"{c['titulo']}. . . {c['conteudo']}"
            partes = [narr[i:i+3000] for i in range(0, len(narr), 3000)]
            jobs.append((c['titulo'], partes))
            total_p += len(partes)
            
        total_p = max(1, total_p) # Ensure it does not divide by zero on the frontend
        emit({"type": "progress", "fileId": file_id, "status": "processing", "progress": 5, "partsDone": 0, "partsTotal": total_p})

        semaforo_g = asyncio.Semaphore(4)
        progress_state = {'done': 0}
        generated_files = []

        # Pre-allocate single file on disk if needed to prevent excessive RAM consumption on huge books
        if not modo_pasta:
            nome_seguro_single = re.sub(r'[\\/*?:\'\"<>|]', '', titulo)
            full_paths_single = [get_unique_path(os.path.join(d, f"{nome_seguro_single}.mp3")) for d in dests]
            for fp in full_paths_single:
                open(fp, 'wb').close() # Cria/Limpa o arquivo antes de começar
            chapters_info = []
            current_time_ms = 0

        for idx_f, (tit_c, pedacos) in enumerate(jobs, start=1):
            tasks = [baixar_bloco_audio(idx, p, voz_final, semaforo_g, file_id, total_p, progress_state) for idx, p in enumerate(pedacos)]
            res = await asyncio.gather(*tasks)
            res.sort(key=lambda x: x[0])
            
            if modo_pasta:
                for d in dests:
                    nome_seguro = re.sub(r'[\\/*?:\'\"<>|]', '', tit_c)
                    arq_f = f"{nome_seguro}.mp3"
                    full_path = get_unique_path(os.path.join(d, arq_f))
                    await asyncio.to_thread(persistir_no_disco, full_path, res, tit_c, autor, titulo, idx_f, modo_pasta, file_info.get("cover"))
                    generated_files.append(full_path)
            else:
                cap_audio = bytearray()
                for _, data in res: cap_audio.extend(data)
                
                # Append chunk stream directly to the target file
                for fp in full_paths_single:
                    with open(fp, 'ab') as f:
                        f.write(cap_audio)
                
                # Calculate runtime duration of the downloaded block for chapter markers
                try:
                    import io
                    audio_info = MP3(io.BytesIO(cap_audio))
                    dur_ms = int(audio_info.info.length * 1000)
                except:
                    dur_ms = int(len(cap_audio) * 0.16)
                    
                if dur_ms > 0:
                    chapters_info.append({"id": f"ch{idx_f}", "title": tit_c, "start_time": current_time_ms, "end_time": current_time_ms + dur_ms})
                    current_time_ms += dur_ms

        if not modo_pasta:
            for fp in full_paths_single:
                await asyncio.to_thread(aplicar_tags_arquivo_unico, fp, titulo, autor, file_info.get("cover"), chapters_info)
                generated_files.append(fp)

        drive_folder_id = config.get("driveFolderId")
        if drive_folder_id and os.path.exists('token.json'):
            for f in generated_files:
                await upload_to_drive_async(f, drive_folder_id, file_id, emit)

        # --- CALCULATE FINAL METRICS FOR UI ---
        final_size_bytes = sum(os.path.getsize(p) for p in generated_files if os.path.exists(p))
        final_size_mb = final_size_bytes / (1024 * 1024)
        final_size_str = f"{final_size_mb:.2f} MB"

        final_duration_ms = 0
        for p in generated_files:
            try:
                if os.path.exists(p):
                    audio = MP3(p)
                    if audio.info:
                        final_duration_ms += audio.info.length * 1000
            except:
                pass

        final_duration_str = ""
        if final_duration_ms > 0:
            s = int(final_duration_ms / 1000)
            h = s // 3600
            m = (s % 3600) // 60
            final_duration_str = f"{h}h {m}m" if h > 0 else f"{m}m"

        emit({"type": "done", "fileId": file_id, "paths": generated_files, "finalSize": final_size_str, "finalDuration": final_duration_str})
    except Exception as e:
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
