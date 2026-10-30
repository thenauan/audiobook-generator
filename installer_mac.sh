#!/bin/bash
cd "$(dirname "$0")"
DIR="$(pwd)"

echo "==================================================="
echo "  Audiobook Generator with AI - Installer (Mac OS) "
echo "  Note: An active internet connection is required. "
echo "  Approximate download size: ~300MB                "
echo "==================================================="

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js not found! Please install Node.js."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 not found! Please install Python3."
    exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
    if command -v brew &> /dev/null; then
        echo "Installing FFmpeg (audio encoder)..."
        brew install ffmpeg
    else
        echo "[WARNING] FFmpeg not found. Install it (brew install ffmpeg) to export M4B, Opus, FLAC and WAV."
    fi
fi

echo "Installing Node.js dependencies..."
npm install
npm run build

echo "Installing Python dependencies..."
python3 -m pip install ebooklib beautifulsoup4 lxml pypdf pdfplumber mobi deep-translator langdetect mutagen edge-tts tqdm colorama faster-whisper

echo "Creating executable app (.app) on Desktop..."
APP_DIR="$HOME/Desktop/Audiobook Generator with AI.app"
mkdir -p "$APP_DIR/Contents/MacOS"
mkdir -p "$APP_DIR/Contents/Resources"

cat << EOF > "$APP_DIR/Contents/MacOS/launcher"
#!/bin/bash
cd "$DIR"
export PATH="/usr/local/bin:/opt/homebrew/bin:\$PATH"
npx electron electron-main.cjs
EOF

chmod +x "$APP_DIR/Contents/MacOS/launcher"

echo "Installation complete! An executable 'Audiobook Generator with AI.app' was created on your Desktop."

