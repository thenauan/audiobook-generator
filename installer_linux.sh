#!/bin/bash
cd "$(dirname "$0")"
DIR="$(pwd)"

echo "==================================================="
echo "  Audiobook Generator with AI - Installer (Linux)  "
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

echo "Installing Node.js dependencies..."
npm install

echo "Installing Python dependencies..."
python3 -m pip install ebooklib beautifulsoup4 pypdf mobi deep-translator langdetect mutagen edge-tts tqdm colorama

echo "Creating system shortcut..."
mkdir -p ~/.local/share/applications
cat << EOF > ~/.local/share/applications/audiobook-generator-ai.desktop
[Desktop Entry]
Name=Audiobook Generator with AI
Exec=bash -c "cd '$DIR' && npx electron electron-main.cjs"
Icon=$DIR/public/icon.png
Terminal=false
Type=Application
Categories=Utility;
EOF

chmod +x ~/.local/share/applications/audiobook-generator-ai.desktop

# Try to copy the shortcut to the desktop if it exists
if [ -d "$HOME/Desktop" ]; then
    cp ~/.local/share/applications/audiobook-generator-ai.desktop "$HOME/Desktop/"
    chmod +x "$HOME/Desktop/audiobook-generator-ai.desktop"
elif [ -d "$HOME/Área de Trabalho" ]; then
    cp ~/.local/share/applications/audiobook-generator-ai.desktop "$HOME/Área de Trabalho/"
    chmod +x "$HOME/Área de Trabalho/audiobook-generator-ai.desktop"
fi

echo "Installation complete! The 'Audiobook Generator with AI' application should now be in your system menu or desktop."

