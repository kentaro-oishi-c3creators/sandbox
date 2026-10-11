# Ver2.2 — 東大寺へ歩く

大仏前交差点から南大門・鏡池を経て、西側の拝観入口、大仏殿前庭までを人の目線で散策する Three.js の初期試作です。

![東大寺の散策画面](assets/site-preview.jpg)

[Ver2.2を開く](https://todaiji-nara-v2-2.vercel.app/)（閲覧保護あり。チャットの期限付きリンクでも開けます）。

V1・V2は兄弟フォルダに保存してあり、この版だけ独立して起動・公開します。今回の状態は「配置と外観の初期実装」。写真のような再現にはまだ追加調整が必要です。

## 実行

Node.js 24 でこのフォルダに入り、`npm ci` → `npm run dev`。公開用の生成は `npm run build`、確認は `npm run preview`。APIキーや環境変数は不要です。

散策ボタンで進み、ドラッグで見回します。地点ボタンとスライダーで移動、俯瞰で配置を確認。W/S・矢印キーとスマートフォンの上下ボタンも使えます。早送りは距離を縮めず移動速度を上げます。

## 尺度と限界

1単位＝1m、目線1.65m。大仏殿は公式の57.012×50.480×48.742m、南大門の高さは25.46m。屋根、柱、扉などはBlenderで生成した外観モデル（GLB＝ブラウザで読める3Dファイル）です。

地点情報と公式の案内図から配置した推定モデルです。案内図は測量図ではなく、道路幅・標高・座標・細部は未確定。現地案内や測量用途には使わないでください。周辺建物は簡略化、仁王像・大仏殿内部・鹿・人・自由の女神は未制作です。

## 資料

- [仕様・実装方法](docs/specification.md)
- [参照元・確度](docs/references.md)
- [検証結果](docs/validation.md)
- [企画・実施計画](../docs/ver2.2-plan.md)
- [テスト計画とユーザーの範囲画像](../docs/ver2.2-test-plan.md)
- [範囲画像の原本](../assets/references/ver2.2/todaiji-ver2.2-reproduction-area.png)

## モデルの再生成・テスト

Blender4.3で `blender -b --python scripts/build-landmarks.py`。生成済みの2つのGLBを同梱しています。毎回の起動にBlenderは不要です。

`npm run dev -- --port 4175` の起動後、`npm run test:browser`。Chromiumは既定で `/usr/bin/chromium`、変更は `CHROMIUM_PATH`、接続先変更は `BASE_URL`。結果とスクリーンショットはGit対象外の `test-results/` に保存します。

次は地理資料を追加取得し、交差点・南大門・中門の位置と参道断面を現地写真で照合。屋根の形・柱間・店舗の配置を実際の景色へ近づけます。
