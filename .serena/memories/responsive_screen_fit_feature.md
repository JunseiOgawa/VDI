# レスポンシブ対応と画面フィット機能の実装

## 実装内容

### 1. 画像表示のレスポンシブ対応
- `index.html`の`#viewer`要素に`w-full`クラスを追加
- 画像が横幅画面最大まで表示されるように調整

### 2. screenFitButtonの追加
- HTMLに「画面フィット」ボタンを追加
- `src/config/index.ts`のSELECTORSに`screenFitBtn: '#screenFitBtn'`を追加

### 3. 画面フィット機能の実装
- `ZoomController.ts`に`fitToScreen()`メソッドを追加
  - コンテナサイズに合わせて画像スケールを計算
  - 画像を中央配置するための移動量を計算
  - ズーム状態を更新
- `ZoomEventHandler.ts`のボタンイベントに画面フィットボタンのリスナーを追加

### 4. スクロール制御
- `styles.css`でbodyのスクロールを禁止（`overflow: hidden`）
- `#viewerContainer`では`overflow: auto`でズーム操作用のスクロールは許可

## 変更ファイル
1. `index.html` - 画像要素とボタンの修正
2. `src/styles.css` - スクロール制御の追加
3. `src/config/index.ts` - セレクター追加
4. `src/features/zoom/ZoomController.ts` - 画面フィット機能追加
5. `src/features/zoom/ZoomEventHandler.ts` - イベントリスナー追加

## 機能仕様
- 画像は横幅最大で表示
- 「画面フィット」ボタンで画像がコンテナに収まるよう自動調整
- ページスクロールは禁止、ビューワー内でのスクロール（ズーム操作）は維持
- 全ての機能が1つの画面で完結