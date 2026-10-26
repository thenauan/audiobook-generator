import os
import sys
import json
import base64
from io import BytesIO

def inject_metadata(data):
    file_path = data.get('filePath')
    if not file_path or not os.path.exists(file_path):
        return {"success": False, "error": f"Arquivo não encontrado: {file_path}", "fileUpdated": False}
    
    title = data.get('title', '').strip()
    author = data.get('author', '').strip()
    genre = data.get('genre', '').strip()
    subgenre = data.get('subgenre', '').strip()
    combined_genre = f"{genre}, {subgenre}".strip(', ') if (genre and subgenre) else (genre or subgenre)
    narrator = data.get('narrator', '').strip()
    language = data.get('language', '').strip()
    year = str(data.get('year', '')).strip()
    description = data.get('description', '').strip()
    cover = data.get('cover')

    # Prepare cover image bytes if present
    cover_bytes = None
    cover_mime = 'image/jpeg'
    if cover:
        try:
            if cover.startswith('data:'):
                header, encoded = cover.split(',', 1)
                if 'image/png' in header:
                    cover_mime = 'image/png'
                cover_bytes = base64.b64decode(encoded)
            elif os.path.exists(cover):
                with open(cover, 'rb') as f:
                    cover_bytes = f.read()
                if cover.lower().endswith('.png'):
                    cover_mime = 'image/png'
        except Exception as e:
            print(f"Aviso ao ler imagem de capa: {e}", file=sys.stderr)

    ext = os.path.splitext(file_path)[1].lower()

    if ext in ['.mp3']:
        from mutagen.mp3 import MP3
        from mutagen.id3 import ID3, TIT2, TPE1, TPE2, TALB, TCON, COMM, TLAN, TDRC, APIC, TXXX
        try:
            audio = MP3(file_path)
            if audio.tags is None:
                audio.add_tags()
            tags = audio.tags

            if title:
                tags['TIT2'] = TIT2(encoding=3, text=title)
                tags['TALB'] = TALB(encoding=3, text=title)
            if author:
                tags['TPE1'] = TPE1(encoding=3, text=author)
                tags['TPE2'] = TPE2(encoding=3, text=author)
            if combined_genre:
                tags['TCON'] = TCON(encoding=3, text=combined_genre)
            if narrator:
                tags['TXXX:Narrator'] = TXXX(encoding=3, desc='Narrator', text=narrator)
            if language:
                tags['TLAN'] = TLAN(encoding=3, text=language)
            if year:
                tags['TDRC'] = TDRC(encoding=3, text=year)
            if description:
                tags['COMM:desc:por'] = COMM(encoding=3, lang='por', desc='description', text=description)
                tags['COMM::por'] = COMM(encoding=3, lang='por', desc='', text=description)

            if cover_bytes:
                tags['APIC:cover'] = APIC(
                    encoding=3,
                    mime=cover_mime,
                    type=3, # front cover
                    desc='Cover',
                    data=cover_bytes
                )

            audio.save(v2_version=3)
            return {"success": True, "fileUpdated": True, "message": "Metadados ID3 injetados com sucesso no MP3."}
        except Exception as err:
            return {"success": False, "error": f"Erro ao injetar ID3 no MP3: {err}", "fileUpdated": False}

    elif ext in ['.m4b', '.m4a', '.mp4']:
        from mutagen.mp4 import MP4, MP4Cover
        try:
            audio = MP4(file_path)
            tags = audio.tags
            if tags is None:
                audio.add_tags()
                tags = audio.tags

            if title:
                tags['\xa9nam'] = [title]
                tags['\xa9alb'] = [title]
            if author:
                tags['\xa9ART'] = [author]
                tags['aART'] = [author]
            if combined_genre:
                tags['\xa9gen'] = [combined_genre]
            if narrator:
                tags['\xa9wrt'] = [narrator]
            if year:
                tags['\xa9day'] = [year]
            if description:
                tags['desc'] = [description]
                tags['\xa9cmt'] = [description]

            if cover_bytes:
                img_fmt = MP4Cover.FORMAT_PNG if cover_mime == 'image/png' else MP4Cover.FORMAT_JPEG
                tags['covr'] = [MP4Cover(cover_bytes, imageformat=img_fmt)]

            audio.save()
            return {"success": True, "fileUpdated": True, "message": "Metadados MP4 injetados com sucesso no arquivo M4B/M4A."}
        except Exception as err:
            return {"success": False, "error": f"Erro ao injetar metadados M4B: {err}", "fileUpdated": False}

    return {"success": True, "fileUpdated": False, "message": f"Formato {ext} não requer injeção direta de metadados binários."}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Argumento de dados ausente"}))
        sys.exit(1)

    arg = sys.argv[1]
    try:
        if os.path.exists(arg):
            with open(arg, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.loads(arg)
        result = inject_metadata(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

