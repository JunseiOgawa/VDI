# ウィンドウモード指定機能

## 概要
VDIアプリケーションに第2引数によるウィンドウサイズ指定機能を追加実装。

## 実装内容

### コマンドライン引数仕様
- **第1引数**: 画像ファイルパス（既存）
- **第2引数**: ウィンドウモード（新規追加）
  - `"FullScreen"`: フルスクリーンで起動
  - `"[幅]x[高さ]"`: 指定解像度で起動（例: `"1920x1080"`）
  - 省略または不正値: デフォルトサイズ（800x600）で起動

### 実装ファイル
- `src-tauri/src/lib.rs`: メイン実装
  - `get_launch_window_mode()` コマンド追加
  - `run()` 関数内でのウィンドウサイズ設定ロジック

### 動作原理
1. `std::env::args().nth(2)` で第2引数を取得
2. Tauriの `setup()` フックで以下を実行:
   - `"FullScreen"`: `window.set_fullscreen(true)`
   - `"[幅]x[高さ]"`: `window.set_size(LogicalSize::new(width, height))`
   - その他: デフォルトサイズを維持

### 使用例
```bash
VDI.exe image.png FullScreen    # フルスクリーン
VDI.exe image.png 1280x720      # 1280x720ウィンドウ
VDI.exe image.png               # デフォルト（800x600）
```

## 技術詳細
- Tauri 2.0 の Manager トレイトを使用
- `webview_windows()` でウィンドウハンドルを取得
- 起動時の `setup` フックで動的にウィンドウサイズを調整