# Simple Meeting Video Editor 1.0.0 — Codex引き継ぎ

## 合意済みの用途と優先事項

Zoom等の1〜2時間の会議MP4から、冒頭・末尾・休憩を削除して参加者に配布する。
低ビットレートの元映像の品質を保つため、映像コピーを標準とする。任意位置で切れる再圧縮モードも残す。
時々大きいピークがある小音量の録音を、−12〜−14 LUFS程度へ整える。

- **HTMLのダブルクリック起動は必須**。localhost必須へ仕様変更しない。
- 同一の静的ファイル構成をGitHub Pagesでも使用する。
- 動画をアップロードしない。サーバー、CDN、Node.jsを利用者に要求しない。
- 日本語・英語のUI、ダークテーマ。
- 波形はシークバー直上。表示のみモノラル、音声自体のチャンネル数は保持。
- 補正前／後は同じ縦目盛りに重ねる。自動スケーリングで音量差を消さない。
- 頭出しや削除区間操作を簡単にする。高度な音声パラメーターをUIへ増やさない。

## ファイル構成

| ファイル | 役割 |
|---|---|
| index.html / style.css | 画面とダークテーマ。通常script、相対URL |
| app.js | 日英辞書、UI状態、削除区間、波形描画、プレビュー、保存、設定JSON |
| core.js | ブラウザに依存しない区間計算、LUFS、ローカル音量レベラー、先読みリミッター、波形集計 |
| engine.js | Browser Media I/Oの区間デコード／出力をつなぐ処理 |
| lib/browser-media-io.js | 未変更の公式0.7.0同梱版 |
| tests/*.test.cjs | DSP・時刻・後始末のNodeテスト |
| tests/browser-check.html | 実ブラウザ／実MP4の確認用。4秒の合成動画を同梱 |

基盤ライブラリ: cityedge/browser-media-i-o v0.7.0。公式ブラウザZIPをそのまま使用する。
ZIP SHA-256: `725e59534fd6b68a7fa007a408c86dcfef42d50107a330c62372a423156f57a4`。
バンドル SHA-256: `e963dde26d83b4beae2420a41f7824939f6ec9b3cd0ca7c656d1cbba7db52eec`。
Mediabunny／AAC拡張は1.61.0。バンドル改造、旧互換版やパッチへの依存はない。

## 0.4.0の移行設計

公式APIはsnap:'outside'を提供しない。core.expandCopyRangesで公式info.boundariesを参照し、
開始を前・終了を後へ広げ、重なる／接する範囲をsource tickで統合する。
engine.planCopyが統合後の範囲をsession.plan({snap:'strict',audioSampleRate})へ渡す。
映像packet・音声累積サンプル数の計算と出力はすべて公式に委任する。

要求範囲と表示の対応はengine内のWeakMapで保持し、copyRequestedRanges(plan,index)から読む。
公式planへフィールドを追加したりcloneしたりしない。同一planオブジェクトを解析・出力へ渡す。
短い保持区間も残す。補正で消える削除指定はそのまま保持し、映像や音声を二重出力しない。

通常のvalidation:'strict'が既定。エラーのrecoverableInContainer===trueだけを強行選択の条件とする。
理由コードの広い分類や英語message比較では判定しない。強行も公式validation:'container'を使う。
診断はdiagnosticCode、warnings[].code/message/countを表示し、plan/resultの境界処理警告も表示対象。
処理選択は現在の動画だけで保持し、新規動画で解除。JSONには保存しない。強行時は_forced出力名。
SPS gap許可フラグだけの素材は公式0.7.0の通常検査を通り、通常モードでは警告なしになる。

アプリ名はSimple Meeting Video Editor。JSONはapp:'SimpleMeetingVideoEditor'、schema3、拡張子.smve.json。
読み込みは旧app:'MeetingCut'も受理。言語のlocalStorageキーとMeetingCore/MeetingEngineは互換性のため維持。
開発用window.SimpleMeetingVideoEditorと旧window.MeetingCutは同じフックを指す。

ステータスsection#activityは#source-bar内の右列。source-bar自体をposition:sticky;top:0で固定し、
狭い画面ではファイル名の下の行へ移す。0.4.1で左プレビューのstickyを廃止し、左右を通常のページスクロールへ統一。
プレビュー固定用の高さ監視も削除。波形自体のResizeObserverは維持する。
.file-button input:disabledにopacity:0を明示し、共通の無効化表示で標準入力が透けないようにする。

## 1.0.0の公開構成

README.md / README.en.mdが利用者向け入口。USER_GUIDE.htmlはローカルでも読める日英マニュアル。
PUBLISHING.mdは手動アップロード・Pages・Release作成の手順。RELEASE_NOTES_v1.0.0.mdはRelease本文用。
バージョンは画面・package.json・文書で1.0.0。編集JSONのschemaは3を維持（アプリ版とは別）。

## 処理の実装

### 入力と編集タイムライン

`inspect()`はmetadata probeでH.264映像1本＋AAC音声最大1本を選ぶ。
動画トラックの終端を全体長とする。metadataで長さが得られなければscanへ切り替える。
`makePlan()`は削除区間を統合し、音声サンプル単位の保持区間と出力位置を作る。
元動画の時刻と出力時刻を混同しない。

`editedAudio()`は元のPCM timestampを使って配置する。空白は無音で埋め、重複は切る。
区間ごとの開始サンプル数をroundで決め、整数サンプル位置で連結する。
カット境界の3msフェードは長さを変えない。

### 音量

K-weighting、400ms窓、100msホップ、−70 LUFS絶対ゲートと−10 LU相対ゲート。
モノラルにはdual-mono補正を加えず、BS.1770のmono測定として扱う。
リミッターは5ms先読み、0.5msアタック平滑、80msリリース、左右連動。
PCMサンプルピーク上限−1.5dBFS。先読み遅延を除き、末尾をflushする。
真のオーバーサンプリングTrue Peakリミッターではない。

解析は保持音声の測定→ローカル音量カーブ生成→レベリング／リミッター込み試算。
`makeLevelCurve()`は400ms K-weighted energyの100ms刻み配列を利用し、±1.5秒の近傍から
−55 LUFS絶対／局所最大−15 LUのゲートで有効音を集計する。全体相対ゲートで小さい会話を落とさない。
中間基準−23 LUFSとの差の90%を補正し、局所ゲインを−18〜+24 dBに制限。
1秒までの短い休止は直前ゲインを保持し、長い無音／極小音量は0 dBへ戻す。
前後方向に時定数350msで平滑化し、100ms間隔の振幅ゲインを線形補間する。
`Leveler`は全体の編集後サンプル位置でカーブを参照する。A/B試聴の部分planは元区間の整数サンプル位置から
全体planへ写像するため、抜粋を独立解析して違うレベルにしない。全PCMをメモリ保持しない。
初回の全体ゲインはカーブ適用後の窓エネルギーから推定し、実PCMの再測定で確認する。
全体LUFSが−55未満、無音、400ms未満は自動の持ち上げを行わない。
レベリングのGUIは初期ONで、`analyze`の第8引数に渡す。API単体の省略時は互換性のためOFF。
`processedAudio`の最後の引数がカーブ。解析・試聴・書き出しすべて同じ経路を通る。

目標との差が0.35LU以上なら
補正量を一度だけ再計算し、2回目の試算で終了する。
補正範囲−40〜+36dB、再計算の増減は最大12dB。
表示する補正後LUFSと波形は実際にリミッターを通したPCMの測定・集計結果。
AAC圧縮後の数値とは区別する。

### 映像無劣化コピー（0.3.0）

`openCopy`→`session.inspect`でIDR/EOF境界を取得し、元ファイルにつき1つのsessionを保持する。
入力変更時は旧sessionをawait close。検査失敗時は新sessionをcloseし、再圧縮へ切替可能な表示を行う。
コピー非対応を理由に入力自体を拒否せず、自動で再圧縮へも切り替えない。

ユーザーの`state.cuts`は要求値のまま保存。`copyKeepRanges`でその補集合を作り、
`expandCopyRanges`で外側へ補正・統合し、`planCopy`が`session.plan({snap:'strict',audioSampleRate})`へ渡す。
`state.copyPlan`はsessionに結び付いた不変のライブラリオブジェクト。clone/JSON化したものをexportに渡してはいけない。
削除・モード変更時にplanと解析を失効し、確定planができるまでは解析／出力を無効にする。
短い保持区間も外側へ広げて保持。全削除はEMPTY_OUTPUTとして停止する。

`copyAudioPlan`がライブラリplanを従来のDSP用planへ写像する。
start/end/first/lastは元ソース位置、length/offset/totalはライブラリの累積丸め後の音声サンプル数。
**lengthをlast-firstで再計算しない**。非整数フレーム間隔では1sampleの差が生じる。
`analyze`の第9引数にこの確定planを渡し、実出力と同じPCM列を測る。
`exportCopy`はplanの区間・長さ一致を検証し、`processedAudio`をaudio.blocks(signal)として供給する。
映像はlibraryのpacket copyへ委任し、Canvas/VideoEncoderを使用しない。
`prepareExport`ではcopyモードにh264Encodeを要求せず、AACは選択した正確なbitrateで事前確認する。
保存streamのバックプレッシャー、AACと映像の交互追加、moov確定はlibrary側が担当。

波形の削除網掛け、プレビューのskip、完成時間表示は確定planの補集合に合わせる。
削除リストは元の要求値を表示し、別の折りたたみ欄に指定→実保持区間と指定より多く残す秒数を表示する。
コピー中は#video-settingsをhiddenにして映像bitrate/解像度/画質/fpsと容量調整の補助を非表示にする。
再圧縮へ戻すと同じDOMの設定値を再表示。無効化も保持し、非表示の設定をコピー出力へ適用しない。音声bitrateは常に表示。
コピーの容量表示は元ファイル平均×出力時間＋新AAC＋1MiBの粗い目安（元音声を含み多めの場合あり）。

コピーのお試し出力は`copyExcerptRanges`で、現在位置から保持30秒を選び、前後のIDR（強行はsync）へ広げる。
30秒を超えても現在位置付近を含める。終端はEOFも利用でき、全体の保持区間を越えない。
同じsessionで`plan({snap:'strict'})`を呼び、試験用の新しいbound planを作る。
全体のlevelCurveとgainDbは再利用し、全体plan/解析/削除リストを変更しない。
A/B音声試聴はキーフレーム制限不要で、従来のサンプル単位excerptPlanを使用する。

### 再圧縮の映像・出力

30/25/15/10fpsの固定出力時計から`sourceAt()`で元時刻へ写像し、`videoFramesAt()`で読む。
Canvasへ描画して`createMp4Writer.addVideoFrame()`へ送る。
音声は同じ出力時計に追従して`addPcm()`する。映像と音声を交互に追加するため、
片方の全パケットをmuxer内で待たせない。
最後の映像はceilにより音声より最大1フレーム長くなる。
中止・失敗時はwriter.cancelとreader.returnを待ち、入力を閉じる。

明示ビットレートは25〜50,000 kbps（整数）。解像度に比例させず、その値をそのままwriterへ渡す。
従来の3プリセットだけは従来の画素数／fpsスケーリング。音声は32〜256 kbpsの選択値をwriter.audio.bitrateへ渡す。
初期250 kbps＋80 kbps＋25fps。推定容量・ダウンロード制限判定も同じ値を使用。
元容量ボタンはfile.size×8/duration−audioBitrateを映像へ割り当てる概算で、上限サイズ保証ではない。

### AACの修正（0.2.1）

v0.2.0はenableAacFallbackにsampleRateとchannelsのみを渡していた。ライブラリの既定audioBitrateは192000。
ネイティブ192 kbpsが対応しているとnative判定で終了し、実出力80 kbpsが非対応でも代替エンコーダーが登録されない。
writerは80 kbpsで別途判定するため「AAC encoding is unavailable」で停止する。
`prepareExport()`は明示audioBitrate（省略時80000）を含む同じ設定でenableAacFallback→getCapabilitiesを呼び、
映像と音声の両方を確認する。UIは長い解析／createWritableより前に実行し、exportMp4も単体呼び出しを守るため再確認する。
exportMp4のtry/finallyに事前確認を含め、既に渡されたstreamも失敗時にabortする。
同梱ライブラリ自体は変更していない。`aac-fallback.test.cjs`は実バンドルと模擬ネイティブ対応表を使って
旧呼び出しで80 kbpsが非対応、新呼び出しでwasm登録後に対応となることを確認する。実ブラウザエンコードの試験ではない。

### 再圧縮の30秒お試し出力

`excerptPlan(fullPlan, sourceSeconds, seconds)`は元動画の時刻から最大N秒の保持区間を切り出す。
削除区間内の開始は次の保持区間へ進み、末尾では短縮する。offsetは抜粋内で0にリセットするがfirst/lastは元サンプル位置のまま。
10秒A/B試聴も同じ関数を使用する。`doExport(true)`が30秒出力、`doExport(false)`が全体出力。
時刻・設定・planをクリック時に取得し、再生停止後に保存ダイアログを表示する。ダイアログで再生位置が動いても開始位置は変えない。
解析は全体を使い、`{...wholeAnalysis, plan:excerptPlan}`だけを書き出しへ渡す。全体解析を抜粋の測定結果で上書きしない。
levelCurve.planは全体のままなのでLevelerが元サンプル位置から正しいゲインへ写像する。試聴と同様に抜粋先頭ではリミッターが再初期化される。
Blob容量判定も抜粋の長さを使う。試験用ファイル名は_trial_HH-MM-SS-mmm.mp4。

### 保存

`showSaveFilePicker()`はクリック直後に呼ぶ。解析後ではuser activationを失う。
解析完了後にcreateWritableして、位置指定streamをライブラリへ渡す。
ライブラリが正常時close、失敗・中止時abortを行う。
元ファイル名・サイズ・mtimeが一致する保存先は拒否する。
APIなしの場合のみ、推定200MiB以下／実上限256MiBのBlob保存を使う。
長尺でBlob全保持を基本経路にしない。

編集JSONはapp:SimpleMeetingVideoEditor、schemaはversion 3（旧MeetingCutも読み込み可）。settings.mode（copy/encode）を追加。ライブラリplanを保存せず、元の削除要求だけを保存して再planする。
version 1/2はencodeへ移行する。
version 1は従来値（レベリングOFF、音声mono96／stereo160 kbps）で移行する。未知の版や範囲外の値は拒否。

### UI・プレビュー

通常動画プレビューは`<video>`＋Object URL。補正音声は10秒の独立WAV試聴。
出力音量とモニター音量は分離する。
波形は10msごとのmin/maxで、2時間・元/補正後の2本でも約11.5MB。
背景の波形描画をキャッシュし、再生ヘッド移動時は再集計しない。
波形はpointer capture付きのドラッグで選択範囲を更新。水平4px未満はクリックとしてシークする。
逆方向／表示範囲外のドラッグをclampし、キャンセル時は前の選択へ戻す。ドラッグ完了では削除を実行しない。
先頭／末尾ボタンとHome/Endは一時停止して元タイムラインの端点へ移動する。
元波形の読み込みをキャンセルした場合は、その旨を表示し、解析時に全体を読み直す。

## 検証済み／未検証を混同しない

VALIDATION.md参照。37件のNode試験と2系統のDOM操作試験、公式バンドルを使った実MP4の独立照合が成功。
通常・強行それぞれの60秒GOP、短区間統合、約30秒試験、PCM計画、旧JSON移行を検証。
ユーザーの問題素材は開発元が警告なしで確認したとの利用者報告あり。
開発元は0.7.0で実録画と加工音声付き出力を検証済み。アプリ自身の試験結果と混同しない。
この環境のChromiumはsocket()権限エラーで起動できず、今回の視覚確認・実ブラウザAAC出力は未実施。

## 次に実施する受け入れ確認

1. Windows Chrome / Edgeでindex.htmlを直接開く。追加の設定変更なしで動くか確認。
2. tests/browser-check.htmlで映像無劣化／再圧縮それぞれの生成と直接保存を実行。結果ログと出力を保存。
3. そのファイル一式をGitHub Pagesへ置き、同じ試験を行う。
4. 実Zoom録画で冒頭・休憩・末尾をカット。カット位置、文字の判読、音ズレを確認。
5. 出力をFFprobe/FFmpegで全フレーム走査、AAC独立デコード、LUFS/True Peak測定。
6. 2時間素材、複数GB出力でメモリ推移、ディスク直接保存、完了後の先頭・中間・末尾を確認。
7. 解析・エンコード・確定の各段階でキャンセルし、再試行と元動画の無変更を確認。
8. 新規タブで音声80 kbpsのAAC代替切替、現在位置からの30秒／末尾3秒／削除区間開始のお試し出力を実操作。
9. 映像無劣化＋音声80 kbpsで元Zoomとの容量・画質・同期を確認。必要なら再圧縮と比較。既にマスタリング済み動画を含む実録音でレベリングON/OFFを比較。
10. 日本語／英語、設定保存と再読込、逆相ステレオ、44.1kHz、無音、音声なし、可変fpsを確認。

ブラウザ確認ページの同梱素材は320×180・4秒だけであり、長尺性能の試験ではない。
この版ではノイズ除去、話者別の音量均一化、複数ファイル結合、HDR色管理を追加していない。
