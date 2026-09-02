# Audiobook Generator with AI

An AI-powered tool to automatically generate high-quality audiobooks from text or PDF files. Features translation, voice synthesis (TTS), and metadata extraction.

## Features
- **PDF & E-book Support:** Convert standard documents and books into audio seamlessly.
- **Language Detection & Translation:** Automatically translates content to your target language.
- **AI Text-To-Speech (TTS):** Uses advanced Edge TTS models for natural-sounding voices.
- **Automatic Metadata:** Extracts cover images, titles, and authors automatically.

## Installation

### Prerequisites (For developers)
If you wish to run the app manually from source, ensure you have:
- [Node.js](https://nodejs.org/) (v18+)
- [Python 3](https://www.python.org/) (v3.10+)

### Standard Installation (For End Users)
> **Note:** An active internet connection is required during the first installation to download dependencies (~300MB).

**Windows:**
1. Download the `Audiobook-Generator-with-AI-Windows.zip` from the [Releases](#) page.
2. Extract the folder to your preferred location.
3. Run `Installer.exe`.
4. Follow the prompts to create a Desktop Shortcut.

**Mac / Linux:**
1. Download the `Audiobook-Generator-with-AI-Unix.zip` from the [Releases](#) page.
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
python -m pip install ebooklib beautifulsoup4 pypdf mobi deep-translator langdetect mutagen edge-tts tqdm colorama

# Run the dev server
npm run dev
```

## License
MIT License