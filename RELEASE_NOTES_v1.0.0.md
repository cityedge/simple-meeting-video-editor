# Simple Meeting Video Editor v1.0.0

会議録画の不要な部分をカットし、音量を整えてMP4として書き出すブラウザアプリです。
初回正式版を公開します。

## ダウンロード・起動

添付の **Simple_Meeting_Video_Editor_v1.0.0.zip** をすべて展開し、
`simple-meeting-video-editor/index.html` をデスクトップ版ChromeまたはEdgeで開いてください。
インストール・アカウント・ローカルサーバーは不要です。
画面下の「使い方」から日本語・英語の操作マニュアルを開けます。

## 主な機能

- **映像無劣化を標準搭載**。元の圧縮映像を保持し、音声のみ処理します。
- 波形のドラッグで削除範囲を選択。冒頭・末尾・休憩などをまとめてカットできます。
- レベリングと−14／−13／−12 LUFSへの音量補正。補正前後の波形・音声試聴。
- 現在位置付近の約30秒お試し出力と、全体出力。
- 編集設定の保存・再開。旧Meeting Cutの編集設定も読み込み可能。
- 日本語・英語、ダークテーマ。端末内処理で動画をアップロードしません。
- 映像設定は再圧縮を選んだときだけ表示。進捗は画面上部に表示します。

## カット位置について

映像無劣化では、残す部分を長くする方向にキーフレームへ合わせます。
削除範囲が短くなる場合があり、お試し出力も30秒を超える場合があります。
指定位置でのカットを優先する場合は再圧縮を選んでください。
「無劣化」は映像についての機能で、音声はAACへ再圧縮します。

入力は最長2時間のH.264/AAC MP4を対象とします。対応状況と保存方法はブラウザ環境に依存します。
Browser Media I/O v0.7.0の公式バンドルを使用しています。

---

## English

The first stable release of Simple Meeting Video Editor: trim meeting recordings, balance their audio and export MP4 entirely on your device.

Download **Simple_Meeting_Video_Editor_v1.0.0.zip**, extract everything, and open
`simple-meeting-video-editor/index.html` in desktop Chrome or Edge. No installation, account or local server is required.
Use the Guide link for the complete Japanese/English manual.

- Lossless video copy by default, with audio processing and optional video re-encoding.
- Waveform drag selection, multiple removals, start/end navigation and requested/actual range display.
- Audio leveling, −14/−13/−12 LUFS targets, before/after waveforms and auditions.
- A roughly 30-second sample near the playhead, plus full export.
- Save and resume edit settings, including older Meeting Cut projects.
- Japanese/English dark UI; recordings are not uploaded.
- Video encoding controls appear only in re-encode mode; progress stays at the top.

Video copy expands retained ranges to surrounding keyframes. Removals may shrink and samples may exceed 30 seconds.
Use re-encode mode for cuts at the requested positions. Lossless refers to video; audio is re-encoded to AAC.
Designed for H.264/AAC MP4 recordings up to two hours. Browser codec and saving support vary.
Includes the official Browser Media I/O v0.7.0 bundle.
