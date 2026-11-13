# Audiobook Generator — Free Ebook to Audiobook Converter (EPUB, PDF, MOBI, AZW3, TXT → M4B, MP3)

**Audiobook Generator** is a free, open-source desktop app that converts ebooks into audiobooks with natural-sounding AI neural voices. Turn **EPUB, PDF, MOBI, AZW3 (Kindle) and TXT** files into **M4B or MP3 audiobooks** with chapters, cover art and text synchronized with the narration — on Windows, macOS and Linux.

- 📚 **Ebook to audiobook**: EPUB, PDF, MOBI, AZW/AZW3 (Kindle) and TXT, one book or many at once
- 🗣️ **300+ neural voices in 70+ languages** (Microsoft Edge text-to-speech)
- 🎧 **M4B audiobooks** with chapters and cover, plus MP3, Opus, FLAC and WAV
- 📝 **Synchronized text** (read along while you listen): .lrc, .srt and .sync.json, by sentence or word by word
- 🌍 **Translation** before narrating, and automatic language detection
- 🖥️ **Interface in 5 languages**: Português, English, Español, العربية, Русский
- ⚡ **Adaptive conversion** that tunes itself to your computer and the voice service, and 🪶 **Lite mode** for slower computers

**[⬇️ Download the latest version](https://github.com/thenauan/audiobook-generator/releases/latest)** · [What's new](#whats-new-in-162) · [Installation](#installation) · [How to use](#how-to-use) · [Supported languages](#supported-languages) · [FAQ](#faq)

---

## What's new in 1.6.2

- **New icon and the Audiobook Player's look:** iOS blue accent, pure black dark mode, the Player's glass and shadows, and the same press and hover feel on every button. The sidebar shows the app symbol with "Generator".
- **Faster metadata:** title, author and cover appear in about 0.2 s, with "Loading e-book metadata…" on the card until then (Convert waits for it).
- Easier to see in light and dark mode, font size like the Player (Standard and Large), and a cleaner initial setup that scrolls under its buttons.
- Settings rows, cards, buttons and pop-ups look exactly like the Audiobook Player in light and dark mode.
- Other apps shows the current Audiobook Player icon.
- Smaller fixes: confirmation before deleting a chapter marker, synopsis up to 2,000 characters, "See all" only when needed, and release notes in your language.

## What's new in 1.5.0

- **Faster, and it adapts by itself:** voice connections tune themselves to what the service handles, M4B is assembled in parallel, and with the app in front the conversion gets priority. Minimized, it uses a bit less so you can keep using the computer.
- **Easier-to-read synced text:** sentences and words together by default, words with the book's punctuation, and long sentences split at natural points instead of whole paragraphs.
- **Metadata and cover in every format**, checked in the finished file. WAV and "One MP3 per chapter" save the synced text next to the audio.
- **Clear failures:** the app says why a book failed and offers Try again, Cancel, or continuing without the translation or the text.
- **The narrator reads more naturally** (scores, units, dates, Roman numerals, emojis…), and a rule that fails no longer stops the conversion.
- **Interface in English, Spanish, Arabic and Russian**, automatic updates, and a Lite mode suggestion for weaker computers.

## What's new in 1.4.0

- **New "Voice" audio quality (default):** the voices arrive as 24 kHz mono, so the app keeps them at 24 kHz (MP3 96k, AAC 64k, Opus 40k) instead of resampling to 44.1 kHz — **the same sound in files about half the size** (a 10-hour book: ~430 MB in MP3 and ~290 MB in M4B) and a faster final step. Standard, High and Maximum are still available.
- **Works without FFmpeg in MP3:** chapters are joined directly in Python and chapters and cover are added by the tags. Without FFmpeg, other formats switch to MP3 with a warning (without volume levelling and the 1.5 s pause at chapter starts).
- **Settings are saved on disk** and come back after closing the app, in any window.
- Every engine message carries a stable code, so other interfaces (like the terminal version) translate them without depending on the Portuguese text.

## What's new in 1.3.0

- **Lite mode** (Settings › System and about, or in the initial setup) for slower computers — it changes both the interface and the conversion:
  - **Interface:** no background blur, still color backgrounds instead of animations, opaque cards and pop-ups.
  - **Conversion:** one book at a time (the others wait "In queue"), 4 voice connections instead of 10, one audio step (FFmpeg) at a time and lowest CPU priority. Converting takes longer, but the computer and the app stay responsive. Audio quality is the same.
- Animations pause when the window is out of focus; the app opens in optimized mode and loads screens on demand. On first launch only the welcome screen and initial setup load.
- **Converted is saved on disk** and survives closing and reopening the app; audiobooks already in the save folder are **recovered with their own cover and metadata** (narrator, genre, year, language, chapters, synced text).
- **More genres and subgenres** (including LGBTQIA+), several per book; cards take their color from the real cover.
- One progress percentage for the whole book and a time remaining that follows the real pace.

## What's new in 1.2.0

- **313 voices in 73 languages** — narrate books in any language with a Microsoft neural voice; samples for every Portuguese, English, Spanish, Arabic and Russian voice.
- **Kindle formats** AZW / AZW3 / PRC can now be chosen in the file picker (DRM-free).
- **M4B is the default** output format; synced text **by sentence, word by word, or both**.
- **Fix language** and **Translate to** right on each book card.
- All books in a batch convert **together**, with real download speed and progress until the final file.
- Detailed, copyable error messages, **Retry all**, and deleted items go to the **Recycle Bin**.
- New welcome screen and initial setup, automatic save folder, new icons.

See the full list in the [CHANGELOG](CHANGELOG.md).

## Features

| | |
|---|---|
| **Input formats** | EPUB, PDF (with selectable text), MOBI, AZW / AZW3 / PRC (Kindle, without DRM), TXT |
| **Output formats** | M4B (AAC, default), MP3 (single file or one per chapter), Opus, FLAC, WAV |
| **Audio quality** | Voice (default: same sound, about half the size), Standard, High or Maximum (up to MP3 320 kbps / AAC 256 kbps) |
| **Chapters** | Detected from the book's table of contents and headings, editable before converting |
| **Cover & metadata** | Title, author, genre, cover and chapters extracted automatically and editable |
| **Voices** | 300+ Microsoft neural voices in 70+ languages, with audio samples to preview |
| **Natural reading** | "Brasil x Noruega" is read as a match, "3 x 1" as a score and "10 x 20 cm" as a size; times, units, Roman numerals and links are prepared for the voice, footnote marks are skipped, and emojis are read by name |
| **Synced text** | Embedded in the audio file and/or saved as .lrc, .srt and .sync.json — by sentence, by word, or both |
| **Translation** | Translate a book into Portuguese, English, Spanish, Arabic or Russian before narrating |
| **Batch conversion** | Convert several books at once; interrupted conversions resume where they stopped |
| **Performance** | Adaptive by default (3–32 voice connections tuned to what the service handles, audio steps on all CPU cores but one, below-normal priority). Lite mode: lighter interface (no blur, still backgrounds) and conversion (one book at a time, 4 connections, lowest CPU priority) |
| **Library** | "Converted" screen to listen to previews, edit, generate text and delete books (to the Recycle Bin) |

## Supported languages

### Interface languages
The app interface is available in the languages below. English was translated by hand; **Spanish, Arabic and Russian were translated automatically and may contain errors**, and the app says so in those languages.

| Language | In the app |
|---|---|
| 🇧🇷 Portuguese (Brazil) | Português — *Conversor de e-books em audiobooks* |
| 🇺🇸 English | English — *Ebook to audiobook converter* |
| 🇪🇸 Spanish | Español — *Conversor de libros electrónicos a audiolibros* |
| 🇸🇦 Arabic | العربية — *محوّل الكتب الإلكترونية إلى كتب صوتية* |
| 🇷🇺 Russian | Русский — *Конвертер электронных книг в аудиокниги* |

### Narration languages (70+)
Books can be narrated in **any language that has a Microsoft neural voice** — 313 voices in 73 languages — even if the interface is not in that language: Afrikaans, Albanian, Amharic, Arabic, Azerbaijani, Bengali, Bosnian, Bulgarian, Burmese, Catalan, Chinese (Mandarin, Cantonese, Taiwanese), Croatian, Czech, Danish, Dutch, English (US, UK, Australia, India and more), Estonian, Filipino, Finnish, French, Galician, Georgian, German, Greek, Gujarati, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Irish, Italian, Japanese, Javanese, Kannada, Kazakh, Khmer, Korean, Lao, Latvian, Lithuanian, Macedonian, Malay, Malayalam, Marathi, Mongolian, Nepali, Norwegian, Pashto, Persian, Polish, Portuguese (Brazil and Portugal), Romanian, Russian, Serbian, Sinhala, Slovak, Slovenian, Somali, Spanish (Spain, Mexico and Latin America), Sundanese, Swahili, Swedish, Tamil, Telugu, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese, Welsh and Zulu.

All voices in Portuguese, English, Spanish, Arabic and Russian come with an audio sample you can play before choosing.

## Installation

> An internet connection is needed during installation (to download dependencies, about 300 MB) and while converting (the voices are generated by Microsoft's online text-to-speech service).

### Windows
1. Download `Audiobook-Generator-with-AI-Windows.zip` from the [Releases](https://github.com/thenauan/audiobook-generator/releases) page.
2. Extract the folder wherever you like.
3. Run `Installer.exe`. It installs everything the app needs (including FFmpeg, through winget, when missing).
4. Open the app from the Desktop shortcut **Audiobook Generator with AI**.

### macOS / Linux
1. Download `Audiobook-Generator-with-AI-Unix.zip` from the [Releases](https://github.com/thenauan/audiobook-generator/releases) page.
2. Extract the folder.
3. Open a terminal in the folder and run:
   - macOS: `bash installer_mac.sh`
   - Linux: `bash installer_linux.sh`
4. The app is added to your Desktop or Applications menu.

### Requirements
- [Node.js](https://nodejs.org/) 18 or newer
- [Python](https://www.python.org/) 3.10 or newer
- [FFmpeg](https://ffmpeg.org/) (for M4B, Opus, FLAC and WAV, and chapter volume normalization)

The installers check and install these for you.

## How to use

1. **First launch:** choose the interface language and, if you want, set the defaults: theme, voice, format, quality, synced text and the folder where audiobooks are saved (if you skip it, the app creates `Documents/Audiobook Generator`).
2. **Add ebooks:** drag EPUB, PDF, MOBI or TXT files into the **Converter**, or click to choose them. The cover, title, author, language and chapters are read automatically.
3. **Adjust each book (optional):** on each card you can change the voice (hover a voice to hear its sample), the format, the language (or translate the book), genre, narrator and chapters.
4. **Convert:** click **Converter**. Each card shows the progress, the parts narrated, the real download speed and the remaining time. If something fails, the card explains why and you can retry one book or all of them.
5. **Listen:** finished audiobooks appear in **Converted** and in your save folder, ready for any audiobook player — including [Audiobook Player](https://github.com/thenauan/audiobook-player), which reads the synced text.

The **Help** screen inside the app has step-by-step guides for every feature.

## FAQ

**Is it free?** Yes. The app is free and open source (MIT license).

**Which format should I choose?** M4B is the standard audiobook format: one file with chapters and cover, supported by most audiobook apps. MP3 plays everywhere.

**Can I convert a PDF?** Yes, if the PDF has selectable text. Scanned PDFs (images only) need OCR first.

**Can I convert DRM-protected ebooks?** No. Protected files are detected and the app tells you it cannot read them.

**Can I narrate a French (or Japanese, Greek…) book with the interface in English?** Yes. Interface and narration are independent; the book is narrated by a voice of its own language.

**The app or the conversion is heavy on my computer. What can I do?** Turn on **Lite mode** in Settings › System and about. The interface loses blur and animations, and conversions run one book at a time, with fewer voice connections and the lowest CPU priority — slower, but the computer stays free.

**Can it convert faster on a powerful computer?** It already does it by itself: conversion is adaptive by default. Voice connections go up while Microsoft's service keeps up and back off when it slows down or throttles (3 to 32), and the audio steps (including M4B chapters) run in parallel on all CPU cores but one, at below-normal priority so other programs still come first. The internet connection still sets part of the speed; the GPU (NVIDIA/CUDA) is used for the AI transcription of synced text whenever available.

**How do I update?** The app updates itself: it checks GitHub Releases when it opens, downloads and installs new versions and asks you to restart. You can turn this off, or check manually, in Settings › System and about.

**Does it work offline?** The app runs on your computer, but the voices (and translation) need an internet connection while converting.

## Other languages · Outros idiomas · Otros idiomas · لغات أخرى · Другие языки

### 🇧🇷 Português — Conversor de e-books em audiobooks
O **Audiobook Generator** é um aplicativo gratuito para **converter e-books em audiobooks** com vozes neurais realistas. Transforme livros em **EPUB, PDF, MOBI, AZW3 (Kindle) e TXT** em **audiolivros M4B ou MP3**, com capítulos, capa e texto sincronizado com a narração. A interface está em português e a narração funciona em mais de 70 idiomas. Funciona no Windows, macOS e Linux. [Baixe a versão mais recente](https://github.com/thenauan/audiobook-generator/releases/latest), rode o instalador e arraste seus livros para o Conversor. Em computadores mais fracos, ative o **modo leve** (Ajustes › Sistema e sobre): a interface fica sem desfoque e animações e a conversão faz um livro por vez, com prioridade mínima. Nos outros, a conversão é **adaptável** e se ajusta sozinha ao que o computador e o serviço de voz aguentam.

### 🇪🇸 Español — Convertir libros electrónicos en audiolibros
**Audiobook Generator** es una aplicación gratuita para **convertir libros electrónicos en audiolibros** con voces neuronales naturales. Convierte archivos **EPUB, PDF, MOBI, AZW3 (Kindle) y TXT** en **audiolibros M4B o MP3**, con capítulos, portada y texto sincronizado con la narración. La interfaz está disponible en español y la narración funciona en más de 70 idiomas. Funciona en Windows, macOS y Linux. [Descarga la última versión](https://github.com/thenauan/audiobook-generator/releases/latest), ejecuta el instalador y arrastra tus libros al Conversor.

### 🇸🇦 العربية — تحويل الكتب الإلكترونية إلى كتب صوتية
**Audiobook Generator** تطبيق مجاني **لتحويل الكتب الإلكترونية إلى كتب صوتية** بأصوات عصبية طبيعية. حوّل ملفات **EPUB وPDF وMOBI وAZW3 وTXT** إلى **كتب صوتية بصيغة M4B أو MP3** مع الفصول والغلاف ونص متزامن مع القراءة. الواجهة متوفرة باللغة العربية، والقراءة الصوتية تدعم أكثر من 70 لغة. يعمل على Windows وmacOS وLinux. [حمّل أحدث إصدار](https://github.com/thenauan/audiobook-generator/releases/latest) وشغّل برنامج التثبيت ثم اسحب كتبك إلى المحوّل.

### 🇷🇺 Русский — Конвертер электронных книг в аудиокниги
**Audiobook Generator** — бесплатное приложение, которое **превращает электронные книги в аудиокниги** с помощью естественных нейронных голосов. Конвертируйте файлы **EPUB, PDF, MOBI, AZW3 (Kindle) и TXT** в **аудиокниги M4B или MP3** с главами, обложкой и текстом, синхронизированным с озвучкой. Интерфейс доступен на русском языке, а озвучка работает более чем на 70 языках. Работает в Windows, macOS и Linux. [Скачайте последнюю версию](https://github.com/thenauan/audiobook-generator/releases/latest), запустите установщик и перетащите книги в Конвертер.

## Development

```bash
# Node dependencies
npm install

# Python dependencies
python -m pip install ebooklib beautifulsoup4 lxml pypdf pdfplumber mobi deep-translator langdetect mutagen edge-tts tqdm colorama faster-whisper

# Run (opens the app in the browser)
npm run dev
```

## License

MIT License

---

<sub>Keywords: ebook to audiobook converter, epub to audiobook, pdf to audiobook, epub to m4b, epub to mp3, mobi to audiobook, azw3 to audiobook, kindle book to audiobook, text to speech audiobook maker, AI audiobook generator, free audiobook creator, edge tts audiobook, conversor de ebook para audiobook, converter epub em audiolivro, conversor de pdf em audiobook, convertir epub a audiolibro, convertir pdf a audiolibro, конвертер epub в аудиокнигу, озвучка книг, تحويل الكتب إلى صوت, كتاب صوتي.</sub>
