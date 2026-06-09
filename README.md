# 🍲 Malatang Shop（マーラータン屋さんゲーム）

回転レーンに流れる具材を選び、鍋でマーラータンを調理してお客さんに提供する、ブラウザ向けの調理・接客シミュレーションゲームです。`framer-motion` によるアニメーションと、店主・お客さん・鍋・コンベアベルトといったコンポーネントで賑やかなお店を演出します。

## 📦 技術スタック

| 分類 | 使用技術 |
| --- | --- |
| フレームワーク | [Next.js](https://nextjs.org/) 14.2.5（App Router） |
| UIライブラリ | React 18 / React DOM 18 |
| 言語 | TypeScript 5 |
| アニメーション | framer-motion 12 |
| スタイリング | Tailwind CSS 3 / PostCSS 8 / autoprefixer 10 |
| E2Eテスト | Playwright 1.60 |
| パッケージマネージャ | npm |

### 主なディレクトリ構成

```
app/
├── components/
│   ├── Character.tsx        # お客さんキャラクター
│   ├── ConveyorBelt.tsx     # 具材が流れる回転レーン
│   ├── Particles.tsx        # 演出用パーティクル
│   ├── Pot.tsx              # 調理用の鍋
│   ├── RestaurantScene.tsx  # お店全体のシーン構成
│   └── ShopOwner.tsx        # 店主キャラクター
├── hooks/
│   └── useBGM.ts            # BGM再生制御フック
├── globals.css             # グローバルスタイル
├── layout.tsx              # ルートレイアウト
├── page.tsx                # トップページ
└── types.ts                # 型定義
assets/sprites/             # スプライト画像
tests/game.spec.ts          # Playwrightテスト
```

> ℹ️ ルート直下の `game.js` / `index.html` は初期プロトタイプ（バニラJS版）の名残です。現在のゲーム本体は `app/` 配下の Next.js アプリです。

## 🚀 起動方法

### 1. 前提環境
- Node.js 18 以上を推奨
- npm（リポジトリには `package-lock.json` が含まれています）

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

起動後、ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

### 4. その他のコマンド

```bash
# 本番ビルド
npm run build

# 本番サーバー起動（build 後に実行）
npm run start

# Lint チェック
npm run lint

# Playwright による E2E テスト
npm run test

# Playwright を UIモードで実行
npm run test:ui
```

## 🧪 テスト

E2E テストは Playwright を使用しています。初回はブラウザのインストールが必要な場合があります。

```bash
npx playwright install
npm run test
```

---

楽しいマーラータンライフを！🌶️