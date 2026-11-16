# Simple Meeting Video Editor — User manual

**v1.0.1**

[日本語](USER_GUIDE.md) · [English](USER_GUIDE.en.md) · [README](README.en.md)

This Markdown edition is readable on GitHub. The app’s Guide link and local browser use retain the bundled `USER_GUIDE.html`.

Remove unwanted openings, endings and breaks from meeting MP4s, balance quiet speech against louder inserts, and export a shareable MP4. The default Video copy mode preserves the original compressed video. Audio is processed and re-encoded to AAC.

## Contents

1. [Start and screen layout](#1-start-and-screen-layout)
2. [Open a recording](#2-open-a-recording)
3. [Remove sections](#3-remove-sections)
4. [Review keyframe alignment](#4-review-keyframe-alignment)
5. [Adjust and check audio](#5-adjust-and-check-audio)
6. [Export a sample](#6-export-a-sample)
7. [Export the full video or re-encode](#7-export-the-full-video-or-re-encode)
8. [Save and resume edits](#8-save-and-resume-edits)
9. [Keyboard shortcuts](#9-keyboard-shortcuts)
10. [Troubleshooting](#10-troubleshooting)

## 1. Start and screen layout

1. Extract the **entire ZIP**.
2. Open `simple-meeting-video-editor/index.html` in desktop Chrome or Edge.
3. Select Japanese or English at the top right.

Keep the HTML, JavaScript, CSS and `lib/` folder in their original layout. No installation, account or local server is required. A GitHub Pages copy works the same way. Selected recordings are not uploaded.

| Area | Purpose |
| --- | --- |
| Top | Open a file, view source details, progress, Cancel and the save link. The status area remains visible while scrolling. |
| Left | Video preview, playback controls, waveform and seek bar. |
| Right: 01 | Removal selection, removal list and actual retained ranges. |
| Right: 02 | Audio processing, analysis and before/after auditions. |
| Right: 03 | Output mode, audio bitrate, sample export and full export. |

The preview and settings scroll together. Narrow screens stack the panels vertically.

## 2. Open a recording

1. Click Open MP4, or drop the file onto the video preview.
2. Wait for copy validation and waveform loading; watch the top status.
3. Check the filename, dimensions and duration, then play the source.

Supported input is an MP4 up to two hours long, with one H.264 video track and up to one mono/stereo AAC track. The MP4 extension alone does not guarantee compatible codecs or structure. Videos without audio produce video-only output.

Keep the source file unchanged and available until processing finishes. Use Cancel at the top to stop an active operation.

## 3. Remove sections

1. **Click** the waveform to seek.
2. **Drag** across an unwanted section, in either direction.
3. Review the In/Out times and click **Add to removals**.
4. Repeat for other breaks or unwanted sections.

Dragging selects a range; it does not commit a removal. Add it to the list to confirm. Use +/− to zoom, the view-range slider to pan, and Fit to restore the full view.

You can also type times such as `00:01:23.500` or seconds into In/Out, or set either boundary from the current playhead.

- **Trim the opening**: go to Start and set In, move to the desired opening and set Out, then add the removal.
- **Trim the ending**: set In where unwanted content starts, go to End and set Out, then add the removal.
- **Restore a section**: click its × in the list. Undo restores the previous removal-list change.

Overlapping removals are merged. Output joins retained sections in their original order; the source is unchanged. Enable Skip removals to skip actual removed sections during preview. Preview may pause briefly at a boundary.

## 4. Review keyframe alignment

Video copy aligns cuts to keyframe boundaries. **Retained starts expand backward and ends forward**, preserving more content than requested. Short removals can disappear entirely.

For example, if you request removal of the first 70 seconds but the previous boundary is at 60 seconds, seconds 60–70 also remain.

1. Expand Review actual retained ranges.
2. Compare Requested and Retained times and the extra retained duration.
3. Choose Re-encode when cutting at the requested positions matters more than preserving the compressed video.

Waveform hatching, output duration, preview skipping, audio analysis and export follow the **confirmed ranges**. The removal list preserves your original requests, so its times can differ from the effective cuts.

## 5. Adjust and check audio

1. Enable automatic audio adjustment.
2. Leave **leveling ON** when quiet speech and loud inserted videos differ substantially. It is enabled by default.
3. Choose −14, −13 or −12 LUFS. Start with the default −14 LUFS if unsure.
4. Analyze to display the corrected waveform. It measures all retained audio, so long recordings take time.
5. Seek to a useful comparison point and use the before/after audition buttons.

| Control | Effect |
| --- | --- |
| Leveling | A slowly changing gain reduces differences over several seconds before global loudness correction. |
| Loudness target | Brings the leveled program toward the target, with a limiter controlling occasional peaks. |
| Automatic adjustment OFF | Disables leveling and automatic loudness processing. AAC re-encoding still occurs. |

**The video preview plays original audio**. Use the after audition or an exported sample to hear processing. Auditions cover up to ten seconds near the playhead. The monitor-volume slider controls video preview volume, not exported loudness.

Before/after waveforms use the same vertical scale. Only the waveform display combines channels; stereo audio remains stereo. Changing edits or audio settings invalidates analysis. Export analyzes first when necessary.

Leveling neither identifies speakers nor removes noise. Raising quiet speech also raises background noise; silence and extremely quiet material are gated. The target may not be reached. Displayed LUFS is measured before AAC encoding. The limiter controls PCM peaks but does not guarantee a certified true-peak ceiling.

## 6. Export a sample

1. Seek to the scene you want to check.
2. Choose output mode and audio bitrate.
3. Review the range and duration near the sample button, then export.
4. Play the saved MP4 to check quality, loudness and boundaries.

**Video copy**: selects up to 30 retained seconds from the playhead, then expands to surrounding keyframes. **The actual sample can exceed 30 seconds**. With boundaries at 0 and 60 seconds, a sample from 1 second exports 0–60 seconds. Expansion stays within the full export's retained ranges.

**Re-encode**: exports up to 30 seconds from the playhead. A playhead inside an actual removal advances to the next retained section; near the end, only the remaining content is selected.

Samples use the **full program's audio correction**; the excerpt is not independently normalized. First-time preparation may therefore analyze the entire recording. Short boundary fades and limiter restart can slightly change the opening compared with the full output. Sample filenames include `_trial_start-time`. The removal list is unchanged.

## 7. Export the full video or re-encode

### Video copy (default)

1. Select Video copy (recommended).
2. Choose audio bitrate: 80 kbps by default, with choices from 32 to 256 kbps. This control is disabled for silent videos.
3. Click Export MP4 and choose a filename and location if a save dialog appears.
4. Wait for completion at the top. When direct saving is unavailable, use the top save link after processing to download the MP4.

Resolution, quality, video bitrate and frame-rate controls are **hidden** in this mode because the original video is copied. Output size depends on retained content and audio settings; the estimate is approximate.

### Re-encode

Selecting Re-encode reveals these controls. Switching modes preserves their values.

| Setting | Options |
| --- | --- |
| Resolution | Original, 1080p or 720p. Aspect ratio is preserved and no upscaling occurs. |
| Quality | Custom bitrate, high, standard or small-file preset. |
| Video bitrate | 25–50,000 kbps in custom mode; default 250 kbps. Lower rates reduce size and quality. |
| Source-size helper | Estimates video bitrate from the source average total rate minus selected audio rate. Equal size or quality is not guaranteed. |
| Frame rate | 10, 15, 25 or 30 fps; default 25 fps. |

Re-encoding a low-bitrate Zoom recording at its original rate may substantially reduce quality. Use Video copy when preserving quality is the priority.

Direct saving streams output to disk. The alternative in-memory download is limited to 256 MiB. Keep the tab open until completion, then check the opening, cut boundaries and ending before distributing the result.

## 8. Save and resume edits

1. Use Save edit settings to save a `.smve.json` file.
2. To resume, open the **same source video** first.
3. Load its edit settings. The source filename and size are checked.
4. Review the restored removals and settings; analyze again as needed.

JSON stores removals and output settings, not the video, waveform or analyzed audio. Keep the source separately. Closing the page does not automatically save edits.

Older Meeting Cut projects remain readable. Schema 1/2 projects open in re-encode mode to preserve prior behavior; switch modes explicitly if desired. Schema 1 preserves leveling OFF. Acknowledgement of warning-based copying is never saved in JSON.

## 9. Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Play/pause |
| I / O | Set the removal's In/Out to the playhead |
| ← / → | Step backward/forward |
| Home / End | Go to the source start/end |
| Ctrl+Z (⌘Z on Mac) | Undo the previous removal-list change |

When editing a text field or selection, its normal keyboard behavior takes priority.

## 10. Troubleshooting

| Symptom | Action |
| --- | --- |
| App does not start / library missing | Extract the entire ZIP and check that `lib/browser-media-io.js` is present. Open in desktop Chrome/Edge. |
| Requested content remains | Review actual retained ranges. This is keyframe alignment; use re-encode for cuts at the requested positions. |
| Preview audio sounds unchanged | Video preview plays the original. Use the after audition or an exported sample. |
| AAC export fails | Check Chrome/Edge and the selected audio bitrate, then try a sample. The bundled `tests/browser-check.html` page (open it locally in your browser) tests a synthetic clip. |
| Output exceeds the save limit | Check the top save-mode indicator. In-memory saving is limited to 256 MiB; use an environment supporting direct-to-file saving. |
| Loading was cancelled | Wait for cancellation to finish. Analyze can reload an incomplete waveform. |
| Input is rejected | Check the two-hour limit, H.264/AAC codecs and supported track counts. |

### Copy validation rejects the structure

Open the detailed reason. Only when the official library marks the problem as recoverable can you acknowledge the warning and try copying. Cuts may show corruption, missing frames, freezes or audio drift, so inspect a sample first. The original file is unchanged.

Warning-based copying keeps a warning visible and adds `_forced` to output names. Return to strict validation to reset it; opening another file also resets it. Essential format/timestamp failures cannot be forced. Re-encoding is another option.

See the bundled `VALIDATION.md` for the completed test scope. Results depend on the input and browser environment.

[English contents](USER_GUIDE.en.md) · [Back to README](README.en.md)

