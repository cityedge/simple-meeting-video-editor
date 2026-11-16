# Simple Meeting Video Editor

**v1.0.1 · Trim meeting recordings and make speech easier to hear.**

[日本語](README.md) · [User manual](USER_GUIDE.en.md) · [Changelog](CHANGELOG.md)

A browser application for removing unwanted openings, endings and breaks from meeting MP4s, balancing audio and exporting a shareable MP4.
**Video copy is the default: compressed video is preserved and only audio is processed.**
This avoids video re-encoding losses in low-bitrate recordings such as Zoom meetings.

Japanese and English dark UI. Selected recordings are processed on your device and are not uploaded.

## Get started

1. Download **Simple_Meeting_Video_Editor_v1.0.1.zip** from Releases.
2. **Extract the entire ZIP.**
3. Open `simple-meeting-video-editor/index.html` in desktop Chrome or Edge.

No installation, account, API key, Node.js or local server is needed.
Keep `lib/`, JavaScript and CSS alongside the HTML in their original layout.
The same files can be hosted on GitHub Pages. Once the application is loaded, processing does not require an internet connection.

## Typical workflow

1. **Open MP4** and wait for compatibility checking and the waveform.
2. Drag across the waveform to select an unwanted range, then **Add to removals**. You can also enter times.
3. **Review actual retained ranges**: video copy aligns cuts to keyframes.
4. Enable leveling, choose a loudness target, analyze, then listen to the corrected audio.
5. Move to a section you want to check and export a short sample.
6. Choose an audio bitrate and export the full MP4.

Read the complete **[English user manual](USER_GUIDE.en.md)** directly on GitHub.
In the app, use the Guide link; locally, open the bundled `USER_GUIDE.html` in a browser.
GitHub’s repository file view shows HTML source, so the repository links use the Markdown edition.

## Features

- Lossless video copy with audio processing, plus optional H.264 video re-encoding.
- Waveform click-to-seek, drag-to-select, zoom and start/end navigation.
- Multiple removals, joined output and requested-versus-actual retained range display.
- Slow leveling to reduce differences between quiet speech and loud inserted videos, followed by loudness correction toward −14, −13 or −12 LUFS.
- Before/after waveform overlays and short audio auditions. Mono/stereo audio stays mono/stereo.
- A roughly 30-second sample near the playhead, using the full export's audio correction.
- Save/resume edit settings as JSON, including older Meeting Cut projects.
- A persistent top progress/cancel/save area, with preview and settings scrolling together.
- Video encoding controls appear only in re-encode mode; switching modes preserves their values.

## Supported scope

| Item | Details |
|---|---|
| Browser | Desktop Chrome / Edge; codec support depends on the environment |
| Input | MP4 with one H.264 video track and up to one mono/stereo AAC track; up to two hours |
| Output | MP4 with copied or re-encoded H.264 video; AAC re-encoding when audio is present |
| Copy boundaries | Retained starts expand backward and ends forward to keyframe boundaries, so removals may shrink or disappear |
| Sample export | Copy samples can exceed 30 seconds after keyframe alignment; re-encoded samples start at the playhead and stay within 30 seconds |
| Audio monitoring | Video preview plays original audio; use the after audition or an exported sample to hear processing |
| Saving | Direct-to-file when supported; otherwise an in-memory download limited to 256 MiB |

“Lossless” refers to the **video**. Audio is re-encoded even when automatic loudness correction is off.
Size estimates are approximate. Leveling does not remove noise.
Displayed LUFS is measured before AAC encoding, and the limiter does not guarantee a certified true-peak ceiling.

## Documentation

- [USER_GUIDE.en.md](USER_GUIDE.en.md): complete English manual, readable on GitHub.
- [USER_GUIDE.md](USER_GUIDE.md): Japanese Markdown manual.
- `USER_GUIDE.html`: Japanese/English HTML manual for the app, local use and GitHub Pages.
- [PUBLISHING.md](PUBLISHING.md): manual GitHub upload, Pages and Release instructions (Japanese).
- [RELEASE_NOTES_v1.0.1.md](RELEASE_NOTES_v1.0.1.md): ready-to-use Japanese/English release description.
- [CHANGELOG.md](CHANGELOG.md): version history.
- [CODEX_HANDOFF.md](CODEX_HANDOFF.md): architecture and development handoff.
- [VALIDATION.md](VALIDATION.md): completed checks and their scope.

## Development

The application is distributed as static files and needs no build step to run or publish.
For development checks:

```sh
npm install
npm test
npm run test:dom
npm run test:integration
```

DOM checks use the jsdom development dependency; integration checks require FFmpeg/ffprobe.
Open [tests/browser-check.html](tests/browser-check.html) to check real browser encoding and saving with a bundled synthetic clip.

## Licenses and credits

Original application code: MIT License, copyright © 2026 cityedge; see [LICENSE](LICENSE).
The unmodified official [Browser Media I/O v0.7.0](https://github.com/cityedge/browser-media-i-o/releases/tag/v0.7.0) browser bundle is included.
Dependencies retain their respective licenses. Preserve [third-party notices](lib/THIRD_PARTY_NOTICES.md),
[source/rebuild information](lib/SOURCES.md) and `lib/licenses/` when redistributing.
Version and provenance hashes are recorded in [lib/VERSION.json](lib/VERSION.json).
The K-weighting coefficient formulas reference the public [libebur128](https://github.com/jiixyj/libebur128) implementation.
