# カスタムタイトルバー実装

## 概要
ネイティブのタイトルバーを非表示にし、カスタムSVGボタン（最小化・最大化・閉じる）を実装。

## 実装内容

### 1. Tauri設定
- `src-tauri/tauri.conf.json`: `"decorations": false` を追加してネイティブタイトルバーを非表示

### 2. HTML構造
- カスタムタイトルバーをheaderの上に追加
- `data-tauri-drag-region` でドラッグ可能領域を指定
- SVGアイコンでウィンドウ制御ボタンを実装

### 3. CSS
- `.custom-titlebar`: ドラッグ領域、高さ32px
- `.window-btn`: ボタンスタイル、ホバー効果
- `-webkit-app-region: drag/no-drag` でドラッグ制御

### 4. TypeScript
- `@tauri-apps/api/window` を使用してウィンドウ操作を実装
- 最小化、最大化/復元、閉じる機能
- `getCurrentWindow()` でウィンドウハンドル取得

### 5. 設定更新
- `SELECTORS` に新しいボタンセレクタを追加
- `DOMHelper.querySelector` でDOM要素を取得

## SVGアイコン仕様
- 最小化: 水平線
- 最大化: 四角形の枠線
- 閉じる: × マーク
- サイズ: 12x12px、ボタンサイズ: 24x24px

## 動作
- タイトルバー領域でウィンドウドラッグ可能
- ボタンでウィンドウ制御（最小化、最大化、閉じる）
- ホバー効果でUX向上（閉じるボタンは赤色）