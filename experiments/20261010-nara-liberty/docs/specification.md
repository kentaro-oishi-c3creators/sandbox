# 仕様・環境

## 採用技術

| 技術 | 用途 |
| --- | --- |
| JavaScript (ES modules) | アプリ全体の処理 |
| Three.js 0.180.0 | WebGL2で3D空間を描画 |
| OrbitControls | ドラッグ・スクロール・タッチで視点操作 |
| Vite 7.1.9 | 開発サーバーと公開ファイル生成 |
| Playwright Core 1.56.0 + Chromium | 本物のブラウザで受け入れ条件を確認 |
| Node.js 24.19.0 / npm 11.9.0 | ビルド・依存管理の確認環境 |

React・サーバー・DBは不要な構成。環境変数、認証情報、APIキーは不要。外部画像・フォント・モデル・地理APIの読み込みもない。テスト時のみ `BASE_URL` と `CHROMIUM_PATH` で対象を指定できる。

## ファイル

```text
index.html                 日本語の操作画面・説明
src/main.js                3Dモデル生成、描画、操作とアニメーション
src/style.css              PC・スマホのレイアウト
tests/browser.mjs          Chromiumの表示・操作検証
package.json               部品と実行コマンド
package-lock.json          インストールする版を固定した記録
docs/                      企画・要件・仕様・結果
dist/                      npm run buildの生成物（Gitに追加しない）
test-results/              検証画像・結果（Gitに追加しない）
```

## 空間と動き

奈良公園・春日大社をモチーフにしたオリジナルの簡略配置。座標の単位はこの世界内の仮の長さであり、緯度経度ではない。広場・参道、2つの鳥居、灯籠、社殿3棟、木立、18頭の鹿、橋と水路を配置。

女神は円錐・円柱・箱・多面体を組み合わせた簡略モデル。冠、松明、銘板、衣、足を持つ。7列の群れで参道を進み、z=-42付近からz=30へループ。個体の位置・大きさ・速さは固定シードで再現可能。1フレームの経過時間を最大0.05秒に制限し、タブ復帰時の大幅ジャンプを防ぐ。

静的な背景は素材ごとに形を結合。女神の各部品は100体をInstancedMeshでまとめて描く。脚の角度を個体別に更新。高精度な人体歩行や衝突はない。

## 表示と操作

透視カメラ、半球光・太陽光、影、遠景の霧。画面内の設定と3つの視点ボタンを固定表示。PCは横並びの設定、スマホ幅は折り返した設定。WebGLを利用できない場合は日本語のエラーを表示する。

`window.naraDebug()` はブラウザ検証のため、現在の数・速度・停止状態・視点・描画命令数などだけを返す。個人情報や秘密情報は含まない。

## モデルと出典

全モデルをこのプロジェクト内のコードで生成。外部の3Dモデル・地図・写真の転載はしていない。Three.js / OrbitControls / BufferGeometryUtils と Vite は各パッケージのライセンスに従う（MIT）。将来、外部モデルや実地理データを追加する際は、その素材の利用条件・必要な出典表示を別途確認する。

## 公開・再公開

公開先: 接続済みVercelの専用プロジェクト `nara-liberty-100`（プロジェクトID: `prj_0DxEfWuenU4pZw2ysZ8z2LQZiV1w`、アカウントID: `team_RjkBJkw68x5zyxwXdS4LDZWt`）。既存の別プロジェクトは変更しない。Sitesの補助スクリプトがこの実行環境にないため、Vercel接続ツールを使用する。

1. `npm ci` → `npm run build`。
2. `npm run preview -- --port 4173` と `BASE_URL=http://127.0.0.1:4173/ npm run test:browser` で公開ファイルを確認。
3. 変更を専用ブランチでGitHubへ送る。
4. 検証済みコミットのアプリソースとロックファイルをVercel create_deploymentに渡す。Vercelでも `npm ci` と `npm run build` を実行し、`dist/` を静的サイトとして公開する。参照文書やテスト画像は公開ファイルに含めない。
5. VercelのREADY状態とURLを確認。閲覧保護を維持し、必要ならVercelの認証付き共有URLを使う。

GitHubとVercelの自動連携は今回設定しない。GitHubへの保存だけでは次の版は自動公開されない。再公開時もビルドと確認が必要。公開URLと今回の検証結果は validation.md に残す。
