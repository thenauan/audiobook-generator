import sys
import json
import os
import base64
from ebooklib import epub
from pypdf import PdfReader
import mobi
from bs4 import BeautifulSoup

def normalize_language_name(lang_str):
    if not lang_str:
        return "Português (Brasil)"
    cleaned = str(lang_str).strip().lower().replace("_", "-")
    if cleaned in ["unknown", "desconhecido", "und", "", "none"]:
        return "Português (Brasil)"
    
    # Português (Brasil e variações)
    if cleaned in ["pt", "pt-br", "br", "por", "portugues", "português", "pt-brasil", "portugues (brasil)", "português (brasil)"]:
        return "Português (Brasil)"
    if cleaned in ["pt-pt", "portugues (portugal)", "português (portugal)"]:
        return "Português (Portugal)"
    
    # Inglês
    if cleaned in ["en", "en-us", "eng", "english", "ingles", "inglês"]:
        return "Inglês"
    if cleaned in ["en-gb", "english (uk)", "inglês (reino unido)"]:
        return "Inglês (Reino Unido)"
    
    # Espanhol
    if cleaned in ["es", "es-es", "es-la", "spa", "espanhol", "español", "spanish"]:
        return "Espanhol"
    
    # Francês
    if cleaned in ["fr", "fra", "fre", "frances", "francês", "français", "french"]:
        return "Francês"
    
    # Alemão
    if cleaned in ["de", "deu", "ger", "alemao", "alemão", "deutsch", "german"]:
        return "Alemão"
    
    # Italiano
    if cleaned in ["it", "ita", "italiano", "italian"]:
        return "Italiano"
        
    # Russo
    if cleaned in ["ru", "rus", "russo", "russian"]:
        return "Russo"
        
    # Japonês
    if cleaned in ["ja", "jpn", "japones", "japonês", "japanese"]:
        return "Japonês"

    # Chinês
    if cleaned in ["zh", "chi", "zho", "chines", "chinês", "chinese"]:
        return "Chinês"

    return str(lang_str).strip().title()

def detect_sample_language(text):
    if not text or len(text.strip()) < 20:
        return ""
    try:
        from langdetect import detect
        res = detect(text.strip())
        if res:
            return res
    except:
        pass
    
    # Fast stop-words heuristic
    words = text.lower().split()
    pt_markers = {'que', 'não', 'uma', 'para', 'com', 'como', 'mais', 'pela', 'pelo', 'está', 'este', 'essa', 'livro', 'capítulo', 'muito', 'quando'}
    en_markers = {'the', 'and', 'that', 'have', 'with', 'this', 'from', 'they', 'will', 'would', 'there', 'their', 'book', 'chapter', 'about', 'which'}
    es_markers = {'que', 'los', 'las', 'del', 'por', 'con', 'para', 'como', 'más', 'pero', 'libro', 'capítulo', 'cuando', 'este', 'esta'}
    
    pt_score = sum(1 for w in words if w in pt_markers)
    en_score = sum(1 for w in words if w in en_markers)
    es_score = sum(1 for w in words if w in es_markers)
    
    if pt_score > en_score and pt_score > es_score and pt_score >= 2:
        return "pt-BR"
    elif en_score > pt_score and en_score > es_score and en_score >= 2:
        return "en"
    elif es_score > pt_score and es_score > en_score and es_score >= 2:
        return "es"
    return ""

def extract_metadata(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    title = ""
    author = ""
    genre = ""
    subgenre = ""
    narrator = ""
    language = ""
    cover_base64 = None
    char_count = 0
    text_sample = ""
    
    try:
        if ext == '.txt':
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                char_count = len(content)
                text_sample = content[:2000]
                title = os.path.basename(file_path).rsplit('.', 1)[0]

        elif ext == '.epub':
            book = epub.read_epub(file_path)
            title_meta = book.get_metadata('DC', 'title')
            if title_meta: title = title_meta[0][0]
            creator_meta = book.get_metadata('DC', 'creator')
            if creator_meta: author = creator_meta[0][0]
            lang_meta = book.get_metadata('DC', 'language')
            if lang_meta: language = lang_meta[0][0]
            subj_meta = book.get_metadata('DC', 'subject')
            if subj_meta and len(subj_meta) > 0:
                genre = str(subj_meta[0][0])
                if len(subj_meta) > 1:
                    subgenre = str(subj_meta[1][0])
            
            for item in book.get_items():
                if item.get_type() == 9: # IMAGE
                    if 'cover' in item.get_id().lower() or 'cover' in item.get_name().lower():
                        cover_base64 = base64.b64encode(item.get_content()).decode('utf-8')
                        break
                elif item.get_type() == 1: # DOCUMENT
                    content = BeautifulSoup(item.get_content(), 'html.parser').get_text(separator=' ', strip=True)
                    char_count += len(content)
                    if len(text_sample) < 2000: text_sample += content + " "

        elif ext == '.pdf':
            reader = PdfReader(file_path)
            meta = reader.metadata
            if meta:
                if meta.title:
                    title = meta.title
                if meta.author:
                    author = meta.author
                if hasattr(meta, 'subject') and meta.subject:
                    genre = meta.subject
                
                # Try to get language from metadata
                try:
                    if '/Lang' in reader.trailer['/Root']:
                        language = reader.trailer['/Root']['/Lang']
                except:
                    pass
            
            for page in reader.pages:
                content = page.extract_text() or ""
                char_count += len(content)
                if len(text_sample) < 2000: text_sample += content + " "

        elif ext in ['.mobi', '.azw']:
            temp_dir, html_content = mobi.extract(file_path)
            with open(html_content, 'r', encoding='utf-8', errors='ignore') as f:
                content = BeautifulSoup(f.read(), 'html.parser').get_text(separator=' ', strip=True)
                char_count = len(content)
                text_sample = content[:2000]
            import shutil
            shutil.rmtree(temp_dir, ignore_errors=True)
            
    except Exception as e:
        pass

    # Language detection fallback based on text sample
    if (not language or str(language).lower() in ["unknown", "und", "desconhecido", ""]) and text_sample.strip():
        detected = detect_sample_language(text_sample)
        if detected:
            language = detected

    if char_count == 0:
        size_bytes = os.path.getsize(file_path)
        char_count = (size_bytes / 2)

    duration_mins = char_count / 900
    # Calibração realista da velocidade de síntese neural (Edge TTS + WebSocket chunking + FFmpeg loudnorm/m4b):
    # A síntese com processamento e áudio final ocorre a aproximadamente 7.5x a 8x do tempo real de reprodução.
    proc_time_mins = max(0.25, duration_mins / 7.5)
    duration_hours = duration_mins / 60
    
    if duration_hours >= 1:
        duration_str = f"{int(duration_hours)}h {int((duration_hours % 1) * 60)}m"
    else:
        duration_str = f"{int(duration_mins)}m"
        
    if proc_time_mins >= 60:
        p_hrs = int(proc_time_mins // 60)
        p_mins = int(proc_time_mins % 60)
        proc_time_str = f"{p_hrs}h {p_mins}m" if p_mins > 0 else f"{p_hrs}h"
    elif proc_time_mins >= 1:
        p_mins = int(proc_time_mins)
        p_secs = int((proc_time_mins % 1) * 60)
        proc_time_str = f"{p_mins} min e {p_secs} seg" if p_secs > 5 else f"{p_mins} min"
    else:
        proc_time_str = f"{max(10, int(proc_time_mins * 60))} seg"

    audio_size_mb = duration_mins * 0.9
    if audio_size_mb > 1024:
        audio_size_str = f"{audio_size_mb / 1024:.2f} GB"
    else:
        audio_size_str = f"{audio_size_mb:.2f} MB"

    # Obligatory fields fallback to "Desconhecido"
    clean_title = str(title).strip() if title else ""
    if not clean_title or clean_title.lower() == "unknown":
        clean_title = "Desconhecido"

    clean_author = str(author).strip() if author else ""
    if not clean_author or clean_author.lower() == "unknown":
        clean_author = "Desconhecido"

    # Optional fields default to empty string
    clean_genre = str(genre).strip() if genre else ""
    clean_subgenre = str(subgenre).strip() if subgenre else ""
    clean_narrator = str(narrator).strip() if narrator else ""
    clean_language = normalize_language_name(language)

    cover_data = None
    if cover_base64:
        cover_data = f"data:image/jpeg;base64,{cover_base64}"

    chapters_data = []
    try:
        from converter import extrair_texto, estruturar_obra_nlp
        full_text = extrair_texto(file_path)
        if full_text and full_text.strip():
            raw_caps = estruturar_obra_nlp(full_text, False)
            for idx, c in enumerate(raw_caps):
                clean_tit = c["titulo"]
                content_str = c["conteudo"].strip()
                snippet = content_str[:500] if len(content_str) > 500 else content_str
                if len(content_str) > 500:
                    snippet += "..."
                chapters_data.append({
                    "id": f"cap-{idx + 1}",
                    "title": clean_tit,
                    "snippet": snippet,
                    "content": content_str
                })
    except Exception as ex_ch:
        pass

    if not chapters_data and text_sample.strip():
        chapters_data.append({
            "id": "cap-1",
            "title": clean_title or "Capítulo 1",
            "snippet": text_sample[:500] + ("..." if len(text_sample) > 500 else ""),
            "content": text_sample
        })

    return {
        "title": clean_title,
        "author": clean_author,
        "genre": clean_genre,
        "subgenre": clean_subgenre,
        "narrator": clean_narrator,
        "language": clean_language,
        "durationEst": duration_str,
        "processingTimeEst": proc_time_str,
        "audioSizeEst": audio_size_str,
        "cover": cover_data,
        "chapters": chapters_data
    }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        try:
            if not os.path.exists(file_path):
                print(json.dumps({"error": "File not found"}))
                sys.exit(1)
            metadata = extract_metadata(file_path)
            # Ensure we only print the JSON
            print(json.dumps(metadata))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.exit(1)
    else:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)
