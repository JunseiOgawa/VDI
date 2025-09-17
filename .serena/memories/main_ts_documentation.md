# main.tsファイルの構造と機能解説

## 実装内容
main.tsファイルに各インポートと機能呼び出しの詳細コメントを追加しました。

## 追加されたコメント内容

### インポートコメント
- DOMHelper: DOM操作のヘルパー関数 (src/features/utils/DOMHelper.ts)
- ZoomController/ZoomEventHandler: ズーム機能 (src/features/zoom/index.ts)
- ImageLoader/StatusDisplay: 画像表示機能 (src/features/imageViewer/index.ts)
- SELECTORS: CSSセレクター定数 (src/config/index.ts)

### クラス内コメント
- 各プロパティの役割と対応するファイル
- メソッドの処理フローと呼び出し先メソッドの詳細
- 依存関係の注入パターンの説明

### 特に重要な機能フロー
1. initialize(): DOM要素設定 → イベントリスナー設定 → 初期画像読み込み
2. setupElements(): DOMHelperによる要素取得とコンポーネント設定
3. loadInitialImage(): ステータス表示更新と画像読み込み処理

## アプリケーション構造
VDIAppクラスが各機能モジュールのコーディネーター役を担い、依存注入パターンでコンポーネント間を連携させています。