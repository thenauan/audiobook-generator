import sys
import json
import os
import base64
from ebooklib import epub
from pypdf import PdfReader
import mobi
from bs4 import BeautifulSoup

def extract_metadata(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    title = "Unknown"
    author = "Unknown"
    language = "Unknown"
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
    if language == "Unknown" and text_sample.strip():
        try:
            from langdetect import detect
            language = detect(text_sample.strip())
        except:
            pass

    if char_count == 0:
        size_bytes = os.path.getsize(file_path)
        char_count = (size_bytes / 2)

    duration_mins = char_count / 900
    proc_time_mins = duration_mins / 40
    duration_hours = duration_mins / 60
    
    if duration_hours >= 1:
        duration_str = f"{int(duration_hours)}h {int((duration_hours % 1) * 60)}m"
    else:
        duration_str = f"{int(duration_mins)}m"
        
    if proc_time_mins >= 1:
        proc_time_str = f"{int(proc_time_mins)} min"
    else:
        proc_time_str = f"{int(proc_time_mins * 60)} seg"

    audio_size_mb = duration_mins * 0.9
    if audio_size_mb > 1024:
        audio_size_str = f"{audio_size_mb / 1024:.2f} GB"
    else:
        audio_size_str = f"{audio_size_mb:.2f} MB"

    return {
        "title": title,
        "author": author,
        "language": language,
        "durationEst": duration_str,
        "processingTimeEst": proc_time_str,
        "audioSizeEst": audio_size_str,
        "cover": cover_base64
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
