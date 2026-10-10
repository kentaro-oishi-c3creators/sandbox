# Nara Liberty 100 — いつもと違う、奈良散歩。

目的: Three.jsで奈良らしい3D空間を作り、100体の自由の女神の数・動きを変えて体験する。
状態: 作業中（MVP初版をVercelに公開済み）
作成日: 2026-10-10 日本時間

奈良公園・春日大社をイメージしたブラウザの3D散歩です。鳥居、参道、石灯籠、朱色の社殿、木立、鹿を簡略モデルで表し、女神が淡々と歩きます。PC・スマホのブラウザで動きます。

これは実測地図や現地建築の正確な再現ではありません。観光ナビゲーションには使えません。まず操作できる世界を作り、奈良らしさ・面白さ・データ可視化の可能性を確かめます。

## 資料

- [企画の参照元と第一案](docs/project.md): Google Driveの元資料リンク、目的、MVP、次の段階
- [要件定義](docs/requirements.md): 今回できることと完成の判定
- [仕様・環境](docs/specification.md): 技術、データ、フォルダ、起動・公開方法
- [検証結果](docs/validation.md): 実際に確かめたことと限界

## 起動

Node.js 24系、npm 11系を使用。必要な環境変数・APIキー・Google Drive接続はありません。

```sh
cd /workspace/sandbox/experiments/20261010-nara-liberty
npm ci --cache /workspace/scratch/npm-cache
npm run dev -- --port 5173
```

ブラウザで http://localhost:5173/ を開く。遠隔クラウド環境では、実行ホストのlocalhostは手元PCとは異なります。公開URLまたは環境のポート転送を利用してください。

```sh
npm run build
npm run preview -- --port 4173
```

`dist/` が公開する静的ファイルです（HTML・CSS・JavaScriptだけで動く形式）。生成物・部品のインストール先はGitHubに保存しません。

## 操作・確認

- 背景をドラッグ: 視点を回す。スクロール・ピンチ: 拡大縮小。
- 「奈良公園」「春日の参道」「朱色の社殿」: 視点切替。
- 女神の数: 0 / 1 / 10 / 100体。0なら奈良の風景だけ眺められる。
- 歩く速さ: 0.2〜2.0倍。一時停止・再開が可能。
- ↺: 選んだ場所の標準視点に戻す。
- 「この実験について」: 説明と企画元リンク。

ブラウザ検証（起動済みサーバーとChromiumが必要）:

```sh
CHROMIUM_PATH=/usr/bin/chromium BASE_URL=http://127.0.0.1:5173/ npm run test:browser
```

検証用画像と結果は `test-results/` に出力されます。公開ビルドの検証では `BASE_URL=http://127.0.0.1:4173/` に変更。

## 結果と次の一手

手作りの3D空間と100体の女神、視点切替・停止・速度変更まで実装。ブラウザの検証記録は [検証結果](docs/validation.md) にまとめる。

公開先: https://nara-liberty-100.vercel.app/ （Vercelの閲覧保護あり。チャットで渡した7日間の共有リンク、または権限のあるVercelアカウントで閲覧）。

GitHubでの変更一覧: https://github.com/kentaro-oishi-c3creators/sandbox/pull/1 。mainへの取り込みはまだ行っていない。

次は本人が触って「奈良らしいか」「動くと面白いか」を確認し、その反応で形・配置・演出を調整する。現地写真・正確な地理データ、高精度モデル、Snowflake連携は、その後に検討する。
