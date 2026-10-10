# Sandbox

自由に探索したり、小さなアプリや道具を試したりするための場所です。
実験ごとにフォルダを分け、後から再開できる短いメモを残します。

## 初めて読むとき

- [やさしい解説と用語集](docs/plain-language-guide.md)：専門知識が少なくても読める、運用方針の説明。
- [運用ガイド](docs/sandbox-guide.md)：フォルダの使い分けと具体的なルール。
- [Codex 向けの作業ルール](AGENTS.md)：作業時に守ること。

## 実験を始める

Codex に「○○を試したい。専用フォルダに分けて、動かし方と次にやることを残して」と依頼してください。
`experiments/YYYYMMDD-short-name/` に必要なファイルを作ります。
説明メモは [実験 README のひな形](docs/experiment-readme-template.md)を使えます。

- [実験一覧](experiments/README.md)
- 一時作業の場所：`/workspace/scratch/sandbox/`（必要になったら作成）

部品やツールは実験ごとに必要なものを選びます。全実験共通のインストールや常駐アプリはありません。

ファイルを作るだけでは GitHub には保存されません。変更を Git に記録し、GitHub に送る操作が必要です。
