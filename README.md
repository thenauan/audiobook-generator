# Audiobook Generator with AI

An AI-powered tool to automatically generate high-quality audiobooks from text or PDF files. Features translation, voice synthesis (TTS), and metadata extraction.

## Features
- **PDF & E-book Support:** Convert Epub, Pdf, Mobi and Txt files into audiobooks, one book or many at once.
- **Audio Formats:** M4B (AAC), MP3, Opus, FLAC and WAV, in a single file with chapters and cover or one MP3 per chapter, with Standard, High or Maximum quality.
- **AI Text-To-Speech (TTS):** Uses Edge TTS neural voices, with a per-book pronunciation dictionary.
- **Synced Text:** Generates text synced with the narration (from the book file or from the audio alone), embedded in the audio file, saved to the library folder (.lrc, .srt, .sync.json), or both.
- **Language Detection & Translation:** Translates books in other languages before narrating.
- **Automatic Metadata:** Extracts cover images, titles, authors and chapters, all editable before and after conversion.
- **Converted library:** Listen to previews, edit metadata, generate text and delete one or many items with confirmation.

## Installation

### Prerequisites (For developers)
If you wish to run the app manually from source, ensure you have:
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) (v3.10+)
- [FFmpeg](https://ffmpeg.org/) (needed to export M4B, Opus, FLAC and WAV)

### Standard Installation (For End Users)
> **Note:** An active internet connection is required during the first installation to download dependencies (~300MB).

**Windows:**
The installer also installs FFmpeg (via winget) when it is missing.
1. Download the `Audiobook-Generator-with-AI-Windows.zip` from the [Releases](https://github.com/thenauan/audiobook-generator/releases) page.
2. Extract the folder to your preferred location.
3. Run `Installer.exe`.
4. Follow the prompts to create a Desktop Shortcut.

**Mac / Linux:**
1. Download the `Audiobook-Generator-with-AI-Unix.zip` from the [Releases](https://github.com/thenauan/audiobook-generator/releases) page.
2. Extract the folder.
3. Open a terminal in the folder and run:
   - Mac: `bash installer_mac.sh`
   - Linux: `bash installer_linux.sh`
4. The application will be added to your Desktop or Applications menu.

## Development

To run the application in developer mode (opens in browser):
```bash
# Install Node dependencies
npm install

# Install Python dependencies
python -m pip install ebooklib beautifulsoup4 pypdf pdfplumber mobi deep-translator langdetect mutagen edge-tts tqdm colorama faster-whisper

# Run the dev server
npm run dev
```

## License
MIT License