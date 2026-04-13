# 🎧 Audiobook Generator

**Audiobook Generator** is a robust and elegant conversion tool designed to transform your e-books and text documents (EPUB, PDF, MOBI, TXT) into audio files (.mp3) narrated by artificial intelligence, promoting greater reading accessibility.

Featuring a modern interface inspired by "Glassmorphism", the program processes, translates, and narrates texts in an optimized manner, returning audio files that are either unified or separated by chapters, containing all metadata (cover, title, author, and table of contents).

---

## ✨ Main Features

- 📚 **Smart Extraction:** Natively reads popular formats such as `.epub`, `.pdf`, `.mobi`, `.azw`, and `.txt`.
- 🗣️ **Text-to-Speech (TTS):** Uses Microsoft's neural voices (Edge TTS) to generate an incredibly fluid and natural reading.
- 🌍 **Automatic Translation:** Built-in support to detect and translate e-books in foreign languages to your preferred language.
- 🌐 **Supported Languages:** The application currently supports text processing, interface, and translation for **English, Portuguese, Spanish, and Arabic**.
- ⚙️ **NLP Processing:** Optimizes text pronunciation and spacing to avoid common reading errors.
- 📂 **Organization:** Choose between exporting your audiobook as a **single .mp3 file** (with embedded chapters via ID3 metadata) or separating **one .mp3 file per chapter** in a dedicated folder.
- 🎨 **Native Interface (Electron):** Runs locally as a standalone, fully independent desktop application (no browser tabs required) with Dark/Light Mode, pop-ups, snippet player, history, and file manager.

---

## ☁️ Cloud Processing

The interface, text extraction, chapter organization, and file persistence **occur 100% locally on your computer**. 
However, the **Voice Synthesis (Narration)** uses Microsoft's Artificial Intelligence services (Edge TTS), and the **Translation** uses Google Translate. Therefore, **an active internet connection is required** for the text-to-audio processing to take place.

---

## 🔄 Automatic Updates

The application includes an integrated **auto-update system**. It actively queries the official GitHub repository for new releases and gives you the option to download and install the updates seamlessly from within the user interface, without requiring manual redownloads.

---

## ⚖️ Copyright and Terms of Use

- The application was created strictly with the objective of **facilitating the consumption of literary content and promoting accessibility** (such as for people with visual impairments or dyslexia).
- 🛑 **You must not use this application to infringe copyrights, pirate protected content, or process criminal material.**
- The creator and developers of this project **are not responsible** for the misuse of the tool or the activities of its users.

---

## 🚀 How to Download and Install

The program features facilitated installation routines that automatically download and configure Node.js and Python behind the scenes if you do not have them installed.

### 🪟 Windows
**Option A: Using the compiled installer (Recommended)**
1. Download the **`Installer.exe`** file from the **Releases** tab on GitHub.
2. Simply run it! It will silently verify, download, and install Node.js and Python (if missing), install the app's dependencies, and create a shortcut on your Desktop.

**Option B: Using the source code**
1. If you downloaded the source code instead of the Release, you can compile the installer yourself. Open the Command Prompt in the project folder and run: `C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /target:winexe /out:Installer.exe Installer.cs`
2. Alternatively, run the `instalar_e_rodar.bat` script directly from the project folder.

A shortcut will be created on your Desktop. Just open and use!

### 🍎 macOS and 🐧 Linux
On Unix systems, installation is via a terminal script, but **the final execution will open an independent application window** without browser tabs:
1. Clone the repository or download the source code (ZIP).
   ```bash
   git clone https://github.com/thenauan/audiobook-generator.git
   cd audiobook-generator
   ```
2. Grant execution permission to the installation script:
   ```bash
   chmod +x install_and_run.sh
   ```
3. Run the script:
   ```bash
   ./install_and_run.sh
   ```