# v1.0.1 手動公開ガイド

この手順は、GitHubのWeb画面から手動でアップロードする場合のものです。
Git・Node.js・ビルド環境は不要です。公開するファイルと、利用者へ配るファイルは同じです。
手順の確認日：2026年11月13日。

## 1. 公開するファイルを準備する

`Simple_Meeting_Video_Editor_v1.0.1.zip` をすべて展開します。
中の `simple-meeting-video-editor` フォルダーを開き、`index.html` があることを確認します。

**リポジトリ直下へ置くのは、このフォルダーの「中身」です。**
ZIPそのものや外側のフォルダーだけを置くと、直下にアプリの入口ができません。

| 配置 | 内容 |
|---|---|
| `index.html` | アプリの入口 |
| `app.js`・`core.js`・`engine.js`・`style.css` | アプリ本体 |
| `lib/` | Browser Media I/O本体、ライセンス、対応ソース案内。フォルダーごと保持 |
| `USER_GUIDE.md`・`USER_GUIDE.en.md` | GitHub上で読める日英の操作マニュアル |
| `USER_GUIDE.html` | アプリ内・ローカル・Pagesで読む日英HTML版 |
| `README.md`・`README.en.md` | GitHubに表示する紹介 |
| `LICENSE`・`CHANGELOG.md`・その他のMD | ライセンス・履歴・公開／開発資料 |
| `tests/`・`package.json` | 開発・検証用。配布に含めて構わない。テスト動画は合成素材 |
| `.nojekyll` | 静的ファイルをそのまま配信するためのファイル |
| `SHA256SUMS` | パッケージ内ファイルの整合性確認用 |

## ガイドの開き方

GitHubのファイル一覧やREADMEからは、Markdown版 `USER_GUIDE.md` / `USER_GUIDE.en.md` を開きます。
GitHubのHTMLファイル閲覧画面はソース表示なので、通常のガイドリンクに `USER_GUIDE.html` を使わないでください。
アプリ内の「使い方」はHTML版を開きます。ダウンロード後のローカル利用でもHTML版を使えます。
Pagesを有効にした場合は、アプリの公開URL末尾に `USER_GUIDE.html#ja` または `USER_GUIDE.html#en` を付けても開けます。
これはGitHubの `blob/main/USER_GUIDE.html` 画面とは別のURLです。

## 2. リポジトリへ手動アップロードする

1. 新規公開リポジトリを作成します。名前の例は `simple-meeting-video-editor`。READMEとLICENSEは同梱済みなので、初期生成は不要です。
2. 空のリポジトリなら **uploading an existing file**、既存リポジトリなら **Add file → Upload files** を開きます。
3. 展開したフォルダーの中身をまとめてドラッグします。`lib` と `tests` はフォルダー構造ごとアップロードします。
4. `index.html` が直下、ライブラリが `lib/browser-media-io.js` になることを確認します。
5. コミットメッセージ例を `Release v1.0.1` とし、`main` へコミットします。

GitHubのブラウザアップロードは1ファイル25 MiBまで、同時に100ファイルまでです。本パッケージはその範囲に収まります。
画面の表記は更新される場合があります。[公式アップロード手順](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

`.nojekyll` がアップロード一覧に入らなかった場合は、リポジトリ直下で **Add file → Create new file** を使って作成します。
ファイル名を正確に `.nojekyll` とし、空の内容（画面で保存できない場合は改行だけ）でコミットします。

## 3. GitHub Pagesを有効にする

1. リポジトリの **Settings → Pages** を開きます。
2. **Build and deployment → Source** を **Deploy from a branch** にします。
3. **Branch** を `main`、フォルダーを **/(root)** にして **Save** します。
4. 配信が完了したら、Pages画面に表示されたURLを開きます。エラー時はリポジトリのActions画面でPagesの実行結果を確認します。

[公式の公開元設定手順](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
／[静的サイトと.nojekyll](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

`cityedge` アカウントで上のリポジトリ名を採用した場合のURL例は、
`https://cityedge.github.io/simple-meeting-video-editor/` です。
これは命名例であり、公開済みURLではありません。実際のPages画面のURLを確認し、GitHubのAbout欄のWebsiteやREADMEへ掲載してください。

### 既存のユーザーサイトへ置く場合

すでに `cityedge.github.io` リポジトリを運用している場合は、既存の `index.html` を置き換えず、
その公開フォルダー内に `simple-meeting-video-editor/` を作って一式を配置できます。
既存サイトのPages設定を維持し、アプリ内の相対配置も維持してください。
既存サイトが独自のビルド手順を持つ場合は、その配信対象にこのフォルダーを含めます。

## 4. ダウンロード用Releaseを作る

1. リポジトリの **Releases → Draft a new release** を開きます。
2. タグを **v1.0.1**、対象をアップロード済みの `main` にします。
3. タイトルを **Simple Meeting Video Editor v1.0.1** にします。
4. 同梱の [RELEASE_NOTES_v1.0.1.md](RELEASE_NOTES_v1.0.1.md) の本文を説明欄へ貼り付けます。
5. **Simple_Meeting_Video_Editor_v1.0.1.zip** を添付します。
6. 正式版なのでPre-releaseにはせず、添付完了を確認して公開します。

[公式Release作成手順](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)

利用者には、Releasesに添付した上記ZIPを案内します。GitHubが自動生成するSource codeのZIPとは別に、
名前と内容を確定した配布ZIPを置いておくと案内が分かりやすくなります。
リポジトリへのソース配置とReleaseへのZIP添付は、それぞれ実施してください。

## 5. 配布ZIPを作り直す場合

本版をそのまま公開する場合は、今回の配布ZIPをそのまま添付できます。
同じ内容を圧縮し直すだけなら、展開後の `simple-meeting-video-editor` フォルダー自体をWindowsの「ZIPファイルに圧縮」で圧縮し、
ファイル名を `Simple_Meeting_Video_Editor_v1.0.1.zip` としてください。
ZIPを開いたとき、一段目が `simple-meeting-video-editor/`、その中に `index.html` がある形です。

ファイルを修正して新しい版を作る場合は、画面・package.json・README・マニュアル・変更履歴の版を揃え、
`SHA256SUMS` も更新してから圧縮します。開発用の `node_modules` や個人の録画・編集JSON・書き出した動画を含めないようにしてください。
`lib/` の通知・ライセンス・対応ソース案内は保持します。

## 公開後の確認

- 公開URLと、Releaseからダウンロード・全体展開したローカル版の両方で起動する。
- 画面の版がv1.0.1になっており、日本語／英語を切り替えられる。
- 映像無劣化では映像設定が隠れ、再圧縮では再表示される。
- 波形での削除指定、補正後の試聴、お試し出力、全体出力、設定JSONの保存・再開を確認する。
- READMEからMarkdown版のガイドが表示される。画面下の「使い方」はHTML版を開く。上部ステータスが見え、左右が一緒にスクロールする。
- 実際に配布するMP4の先頭・カット境界・末尾を再生して確認する。

公開側の設定に迷ったら、まずリポジトリ直下の `index.html` と `lib/browser-media-io.js`、Pagesのブランチ／フォルダーを確認します。
古い表示が残る場合は、Pagesの配信完了を確認してからブラウザを強制再読み込みしてください。
