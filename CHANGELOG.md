# Changelog

All notable changes to **Audiobook Generator** — the free ebook to audiobook converter (EPUB, PDF, MOBI, AZW3, TXT → M4B, MP3).

[⬇️ Download the latest version](https://github.com/thenauan/audiobook-generator/releases/latest)

---

## [1.5.0] — 2026-11-11

### Changed
- **Easier-to-read synced text:** words now show the punctuation of the book (`Hi!`, `so:`, `—Come`, `“Yes?”`), sentences that clearly ended without a period are split (a pause before a capital letter, or a period left in the middle of a line), and very long sentences are split at `;`, `:`, dashes or commas instead of filling a whole paragraph. Dialogue stays together ("—Are you coming? —she asked."), and names and abbreviations (Mr., Dr.) are not split. This applies to conversions and to "Generate text" in Converted.
- **Priority while the app is in front:** with the app window in front, the conversion runs at normal priority and with up to 32 voice connections; minimized or behind other windows, it goes back to below-normal priority and up to 20 connections, so you can keep using the computer. The app says this when a conversion starts. Lite mode is not affected.
- **Synced text now defaults to sentences and words together.** Settings saved under the old default move to the new one once.
- WAV no longer keeps the synced text inside the audio, where almost no player could read it: WAV and "One MP3 per chapter" always save it to the library folder, and the app says so.
- **Adaptive conversion by default, much faster:** voice connections tune themselves between 3 and 32 to what Microsoft's service handles at the moment (up while it keeps up, down on errors or slowness; retries no longer hold a connection while waiting, and the timeout follows the real time of each block). Audio steps use all CPU cores but one, at below-normal priority.
- **M4B assembled in parallel by chapter** (a 2 h 16 min book: 92 s → 16 s).
- Lite mode stays as the option for slower computers (one book at a time, 4 connections, lowest priority).
- **Lite mode moved to Settings › System and about**, and it now also removes the glow effects (halos behind the header title, glows around buttons and icons, the blurred entrance of cards and pop-ups), which looked like hard-edged color patches without the blur.

### Removed
- **Turbo mode:** the adaptive conversion already goes beyond it. Anyone who had it on moves to adaptive.

### Fixed
- **A book with Roman numerals in lowercase ("século xix") no longer fails** while preparing the text. Only valid numerals are converted ("século mil" stays as it is), and from now on a reading rule that fails leaves only that piece of text unchanged instead of stopping the conversion.
- On Windows, the conversion's lower priority (and the lowest one in Lite mode) was never applied because of a 64-bit call error. It works now.
- **Every audiobook now gets a narrator and a cover in the file:** the narrator falls back to the voice's name, and books without a cover get the generic cover shown in the app.
- The app now reads the finished file back and warns if a title, author, narrator, genre, year, cover or chapters could not be written.
- **Failures now say why in plain words:** a full disk, a file open in another program, no permission, no internet, not enough memory or an FFmpeg problem each get their own message.
- **A failed book offers clear choices:** Try again, Cancel and, when the translation failed, Continue without translating (the book is narrated in its own language, with a voice of that language).
- If the synced text fails, the audio is kept and the book offers Try again and Continue without the text: neither narrates the book again, and the file is replaced instead of creating a "(2)" copy.
- The WAV description no longer says it has no cover, and the help explains what each format can hold.
- Blocks with the same text no longer compete for the same temporary file, and a failed block write is retried.

### Added
- **The narrator no longer reads things literally, on any subject:** "Brasil x Noruega" is read as "contra" instead of "multiplicação", "3 x 1" as a score, "10 x 20 cm" as a size and "2 x 3 = 6" as math. The same goes for law (art. 5º, § 2º, inc. II, Lei nº 8.666/93), medicine and units with singular and plural (500 mg/dia, 1 ml, mmHg), recipes (1/2 xícara, ½), science (CO₂, 10⁶, x², ≥, π), Bible citations (Jo 3:16), academic references (p. 12, pp. 12-15, et al., op. cit.), finance (R$ 5 mi, p.p., US$), technology (C++, 16 GB), full dates, ordinals (1º, 2ª), times, Roman numerals, @names, #tags and links. Footnote marks, asterisks, dividers, invisible ebook characters and PDF ligatures no longer break the reading, and paragraphs in all capitals are read as normal text, keeping the acronyms. These rules cover Portuguese, English and Spanish, live in tables in `texto_falado.py`, and your pronunciation dictionary comes first.
- **Emojis are read by name** in the voice's language (⚽ → "bola de futebol"), in 13 languages; repeated emojis are read once, and in other languages they are skipped.
- **The whole interface in English, Spanish, Arabic and Russian:** texts written in Portuguese throughout the app are now translated on screen, including Help. English was translated by hand; Spanish, Arabic and Russian were translated automatically and may contain errors, which the app says in Settings and in a header notification.
- **Generate text in Converted** now follows the sentences/words choice from the settings.
- **Lite mode suggestion for weaker computers:** the app reads the processor (model and cores) and memory and, with 4 cores or fewer, less than 8 GB of RAM or an entry-level processor (Celeron, Pentium, Atom, Athlon…), recommends Lite mode: pre-selected in the initial setup, a "Recommended for this computer" badge with the computer's specs in Settings › System and about (where Lite mode now lives), and a one-time header notification for existing users. Developer mode: *Simulate weak computer*.
- **Automatic updates** (Settings › System and about): the app checks GitHub Releases when it opens and every 6 hours, downloads the zip for your system, installs it over the app folder (and runs `npm install` when dependencies change) and asks you to restart. It can be turned off.
- **Updates button**: check now, see the new version and its release notes, download and install, and restart — with progress.
- Every update notice (new version, downloading, installing, ready, error) appears in the header notifications; clicking it opens the updates panel.
- Developer mode: **Simulate update available** (version 9.9.9 with release notes; download, install and restart are simulated).
- Development folders (with `.git`) are never overwritten: they are told to use `git pull`.

## [1.4.0] — 2026-10-31

### Added
- **"Voice" audio quality, now the default:** MP3 96k and AAC 64k at 24 kHz (the voices' own sample rate) and Opus 40k. Same sound as "High" in files about half the size, and a faster final step. Users who never changed the quality move to "Voice" once.
- **MP3 without FFmpeg:** the chapters are concatenated in Python and chapters and cover go in the ID3 tags; without FFmpeg, other formats are converted to MP3 with a warning (no volume levelling or 1.5 s chapter pause).
- **Settings saved on disk** (`~/.audiobook-generator/settings.json`), loaded before the app opens: they no longer reset after closing the app or opening it in another window or port.
- Engine events and errors carry stable codes (`code`, `args`, `unitCode`) next to the Portuguese text, for other interfaces to translate.

### Fixed
- A missing FFmpeg no longer crashes the chapter step: it is skipped and the voice is kept as it came.

## [1.3.0] — 2026-10-31

### Fixed
- Voice sample buttons are white/gray (not the accent color), also while playing, and playing a sample no longer makes pop-ups and cards shake.
- Conversion progress updates are grouped and only the card that changed is redrawn.
- Converted audiobooks no longer appear twice in **Converted** (existing duplicates are removed when the app opens).
- Audiobook preview play/pause: only one preview plays at a time, the button turns into pause right away and a second click stops it — no more double playback or previews that can't be paused.
- The edit screen now shows when an audiobook has synchronized text (checked in the file itself: metadata and .lrc/.srt/.sync.json next to it).

### Added
- **Lite mode** (Settings › Interface and initial setup), for slower computers. It changes the interface **and** the conversion:
  - Interface: no background blur, opaque cards and pop-ups, still color backgrounds.
  - Conversion: one book at a time (the others wait "In queue"), 4 voice connections instead of 10, one FFmpeg at a time, one translation part at a time and the lowest CPU priority. Slower, same audio quality, and the computer stays free. Applies to conversions started after it is turned on.
  - Explained in Settings and in a new **Lite mode and Turbo mode** Help topic.
- **Turbo mode** (Settings › Conversion), for powerful computers: 12 voice connections instead of 10, one FFmpeg per CPU core (up to 8), 6 translation parts at a time and normal CPU priority. Faster, especially with several or long books, using more CPU and memory. Lite and Turbo are mutually exclusive.
- **Converted is saved on disk** (`~/.audiobook-generator/library.json`), the same for every window and port: converted audiobooks no longer disappear after closing and reopening the app.
- Audiobooks found in the save folder are **recovered in Converted with their embedded cover and metadata**: title, author, narrator, genre, subgenre, year, language, description, duration, chapters and synced text. Books recovered earlier with the generic cover are completed automatically.
- On first launch only the welcome screen and initial setup load; the rest of the app loads afterwards.
- Animations pause when the window is minimized, hidden or out of focus, and only cards visible on screen animate.
- The app opens in **optimized (production) mode**: the interface is compiled once (and again only after an update) instead of running in development mode; secondary screens load on demand with a loading icon.
- **More genres and subgenres** (38 genres, 42 subgenres), including **LGBTQIA+**, Sapphic and MLM romance, Queer fiction, LGBTQIA+ memoirs, Diversity & inclusion, Romantasy, Dark romance, Cozy mystery and more.
- **Several genres and subgenres per book**, separated by commas: pick as many as you want in the book card (the pop-up stays open) or tap them on the edit screen.
- **Cards follow the real cover:** the book color (animated background, border, progress bar and highlights) now comes from the cover image itself instead of a palette color.

### Changed
- **One progress percentage** for the whole book (reading, translation, narration, volume, final file and text), always moving forward; the step text no longer shows its own percentage.
- Next to the time remaining, the count of the current step: parts narrated, chapters with volume adjusted, chapters in the M4B, chapter files generated or text chunks translated.
- **Time remaining** follows the real pace of the conversion and keeps adjusting (recent pace + average pace, smoothed).
- Publication **year** is read from the ebook and written to the audiobook (MP3, M4B, FLAC, Opus).
- **Round desktop icon** (Windows, macOS and app window).

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
