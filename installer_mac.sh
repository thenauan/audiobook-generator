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

# Ícone e identificação do app (sem o Info.plist o macOS mostra o ícone genérico)
cp "$DIR/public/icon.icns" "$APP_DIR/Contents/Resources/icon.icns"
cat << 'PLIST' > "$APP_DIR/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleName</key><string>Audiobook Generator with AI</string>
  <key>CFBundleDisplayName</key><string>Audiobook Generator with AI</string>
  <key>CFBundleIdentifier</key><string>com.thenauan.audiobookgenerator</string>
  <key>CFBundleExecutable</key><string>launcher</string>
  <key>CFBundleIconFile</key><string>icon</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>1.6.1</string>
</dict>
</plist>
PLIST
touch "$APP_DIR"

echo "Installation complete! An executable 'Audiobook Generator with AI.app' was created on your Desktop."

