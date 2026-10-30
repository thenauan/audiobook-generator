# Changelog

All notable changes to **Audiobook Generator** — the free ebook to audiobook converter (EPUB, PDF, MOBI, AZW3, TXT → M4B, MP3).

[⬇️ Download the latest version](https://github.com/thenauan/audiobook-generator/releases/latest)

---

## [1.2.0] — 2026-10-30

### Supported formats
- **Input:** EPUB, PDF (with selectable text), MOBI, **AZW / AZW3 / PRC (Kindle, without DRM)** and TXT — Kindle files can now be chosen in the file picker and dropped in the Converter.
- **Output:** **M4B is now the default format** (one file with chapters and cover). MP3 (single file or one per chapter), Opus, FLAC and WAV are still available, with Standard, High or Maximum quality.
- **Synced text:** .lrc, .srt and .sync.json, now split **by sentence, word by word, or both**.

### Voices and languages
- **313 Microsoft neural voices in 73 languages** (was 39 voices): books can be narrated in any language that has a voice, even if the interface is not in that language — French, German, Italian, Japanese, Chinese, Korean, Greek, Swedish, Polish, Turkish, Hindi and many more.
- **Voice samples for every voice** in Portuguese, English, Spanish, Arabic and Russian (131 voices), with a play button that appears when you hover a voice.
- Voice lists show the book's language first; "Voices in other languages" opens all the others, grouped by language.
- Language detection by code or name in any language ("el", "Greek", "Grego", "Ελληνικά"); generic chapter titles are written in the book's language (about 25 languages) or as plain numbers.
- Voices that Microsoft lists but no longer serves are left out, so a conversion never starts with a broken voice.

### Translation
- New language tag on each book: **Fix language** (choose or type the right one) and **Translate to** (Portuguese, English, Spanish, Arabic or Russian).
- More reliable translation through Google's public translation endpoint, with cache and automatic retries.

### Conversion
- All books in a batch now advance **at the same time** (the voice connections are shared evenly).
- **Real download speed** on each card, and progress until the very end: chapters narrated, chapter volume adjustment and final file assembly with FFmpeg's real percentage.
- Conversions run at low priority, in the background and **without opening console windows**; Ctrl+C or closing a console no longer interrupts them.
- The same book can't be converted twice at once (a lock prevents two app windows from competing for the same files).
- Ebooks load faster: cover, title and author appear first, then the chapters; several books are read in a queue, with automatic retries.
- Large books with big covers no longer fail when sent to the converter.

### Errors
- Error messages are complete and **selectable**, with **"View details"** (step, error type, technical log) and **"Copy error"**.
- **"Retry all"** button when one or more conversions fail.
- Clear message when the app's local service is not running.

### First launch
- New **welcome screen** and **initial setup in pages**: Interface, Conversion, Text and Storage & folders — everything fits on screen, no scrolling.
- If no save folder is chosen, the app creates **Documents/Audiobook Generator** automatically. "View folder" opens it from Settings.

### Library and interface
- Deleting an audiobook or text in **Converted** sends its files to the **Recycle Bin** (recoverable).
- 42 cover and highlight colors (was 24), grouped by hue.
- Captions in Settings options, larger pop-up titles, cleaner highlights without outlines, settings names in sentence case.
- Developer mode only appears in search (//dev) and turns on when an option is chosen.
- New app icon and new Audiobook Player icon.
- Help: new **Voices and languages** topic and updated guides.
- The app no longer reloads by itself when left in the background.

---

## [1.1.0] — 2026-10-26

- New interface: side menu, pop-ups that grow from their buttons, light and dark themes, interface in Portuguese, English, Spanish, Arabic and Russian.
- Audio formats M4B, MP3, Opus, FLAC and WAV (single file with chapters and cover, or one MP3 per chapter) with Standard, High or Maximum quality.
- Synced text during conversion or later, from the book + audio or from the audio alone, saved in the audio metadata, in the library folder, or both.
- Converted library with multi-select delete, confirmations with covers, and sorting.
- First launch with welcome and initial setup; Help with step-by-step guides, features and FAQ; Other Apps with Audiobook Player.
- Chapter detection rewritten (table of contents, headings, PDF bookmarks), text cleanup for narration and resumable conversions.

## [1.0.0] — 2026-09-02

- Standardized executables and new installer for Windows, macOS and Linux.

[1.2.0]: https://github.com/thenauan/audiobook-generator/releases/tag/1.2.0
[1.1.0]: https://github.com/thenauan/audiobook-generator/releases/tag/1.1.0
[1.0.0]: https://github.com/thenauan/audiobook-generator/releases/tag/1.0.0
