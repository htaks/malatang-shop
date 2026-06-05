# 🍲 malatang-shop

マーラータン（麻辣烫）屋さんを舞台にした、ブラウザで遊べるシミュレーションゲームです。
コンベアベルトを流れる具材を鍋に投入し、お客さんに最高の一杯を提供しよう！

---

## 📖 概要

`malatang-shop` は **Next.js + TypeScript + Tailwind CSS** で構築されたWebゲームプロジェクトです。
コンベアベルト、鍋、キャラクター、店主、パーティクルエフェクト、BGM など、
お店経営の臨場感を演出する各種コンポーネントで構成されています。

### 主な機能
- 🛒 **コンベアベルト**: 具材が流れてくるベルトシステム（`ConveyorBelt.tsx`）
- 🍲 **鍋（Pot）**: 具材を煮込むメインギミック（`Pot.tsx`）
- 🧑‍🍳 **店主（ShopOwner）**: お店を仕切るキャラクター（`ShopOwner.tsx`）
- 👥 **お客さん（Character）**: 来店するお客さんたち（`Character.tsx`）
- ✨ **パーティクル演出**: 視覚的な盛り上げ要素（`Particles.tsx`）
- 🎵 **BGM**: ゲームを彩るサウンド（`useBGM.ts`）

---

## 🛠 技術スタック

| 分類 | 使用技術 |
| --- | --- |
| フレームワーク | [Next.js](https://nextjs.org/) |
| 言語 | [TypeScript](https://www.typescriptlang.org/) |
| スタイリング | [Tailwind CSS](https://tailwindcss.com/) |
| E2Eテスト | [Playwright](https://playwright.dev/) |

---

## 🚀 セットアップ手順

### 前提条件
- Node.js 18 以上
- npm（または yarn / pnpm）

### 1. リポジトリをクローン
```bash
git clone https://github.com/htaks/malatang-shop.git
cd malatang-shop
```

### 2. 依存パッケージのインストール
```bash
npm install
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開くとゲームが起動します。

### 4. 本番ビルド
```bash
npm run build
npm start
```

---

## 🧪 テスト

E2Eテストには Playwright を使用しています。

```bash
# Playwright ブラウザのインストール（初回のみ）
npx playwright install

# テストの実行
npx playwright test
```

テストコードは `tests/game.spec.ts` に配置されています。

---

## 📁 ディレクトリ構成

```
malatang-shop/
├── app/
│   ├── components/        # ゲーム用UIコンポーネント
│   │   ├── Character.tsx
│   │   ├── ConveyorBelt.tsx
│   │   ├── Particles.tsx
│   │   ├── Pot.tsx
│   │   ├── RestaurantScene.tsx
│   │   └── ShopOwner.tsx
│   ├── hooks/
│   │   └── useBGM.ts       # BGM制御フック
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── types.ts
├── assets/
│   └── sprites/            # スプライト画像
├── tests/
│   └── game.spec.ts        # Playwrightテスト
├── game.js
├── index.html
├── next.config.js
├── tailwind.config.js
├── playwright.config.ts
└── package.json
```

---

## 👥 開発チーム

| 役割 | 担当 |
| --- | --- |
| 司令塔 | メイト |
| 実装 | サグル（チームA） |
| リポジトリオーナー | [@htaks](https://github.com/htaks) |

> 本プロジェクトは「チームA」によって開発・メンテナンスされています。

---

## 🤝 コントリビュート

1. このリポジトリをフォーク
2. フィーチャーブランチを作成（`git checkout -b feature/your-feature`）
3. 変更をコミット（`git commit -m 'Add some feature'`）
4. ブランチにプッシュ（`git push origin feature/your-feature`）
5. プルリクエストを作成

---

## 📄 ライセンス

このプロジェクトのライセンスについては、リポジトリオーナーにお問い合わせください。

---

🍜 *Enjoy your malatang!*