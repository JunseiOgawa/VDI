# nextphoto/backphoto機能実装

## 実装内容

### 1. Tauriバックエンド機能追加 (src-tauri/src/lib.rs)
- `get_folder_images()`: フォルダ内画像一覧を作成日付順で取得
- `get_next_image()`: 指定画像の次の画像パスを取得
- `get_previous_image()`: 指定画像の前の画像パスを取得
- すべてのコマンドでフォルダナビゲーション有効/無効制御をサポート

### 2. ImageLoader機能拡張 (src/features/imageViewer/ImageLoader.ts)
- フォルダナビゲーション機能のON/OFF制御
- 現在画像パスの追跡
- `nextImage()`/`previousImage()`: 画像ナビゲーション機能
- 既存メソッドでの現在パス更新

### 3. VDIApp統合 (src/main.ts)
- setupNavigationControlsでのnextphoto/backphoto機能実装
- フォルダナビゲーション制御API
- ステータス表示の自動更新

## 機能概要
- フォルダ内の作成日付順画像ナビゲーション
- デフォルトでフォルダナビゲーション機能ON
- 将来の第3引数によるオプション制御に対応
- 画像切り替え時の自動fitToScreenとステータス更新

## 注意事項
- 現在はデフォルトでフォルダナビゲーション有効
- 画像拡張子: jpg, jpeg, png, gif, bmp, webp, tiff, tif
- エラーハンドリング実装済み
- 既存機能との互換性保持