# VDI開発用コマンド集

## ビルド・実行関連
```bash
# 開発モード起動（フロントエンド + バックエンド同時起動）
npm run dev

# Tauriのみ開発モード起動
npm run tauri:dev

# 本番ビルド
npm run build

# プレビューモード
npm run preview
```

## 引数付き起動（開発時）
```bash
# 画像ファイル指定起動
npm run tauri:dev -- '[画像ファイルパス]'

# フルスクリーン起動
npm run tauri:dev -- '[画像ファイルパス]' FullScreen

# 解像度指定起動
npm run tauri:dev -- '[画像ファイルパス]' 1920x1080

# 例: 実際のファイルパス使用
npm run tauri:dev -- 'D:\画像\test.png' FullScreen
```

## Rustコンパイル（Tauri部分）
```bash
cd src-tauri
cargo check          # コンパイルチェック
cargo build          # デバッグビルド
cargo build --release # リリースビルド
```

## 依存関係管理
```bash
# フロントエンド依存関係インストール
npm install

# Rust依存関係更新
cd src-tauri && cargo update
```

## 開発用ツール
- **Vite**: フロントエンド開発サーバー（ポート1420）
- **Tauri**: Rustバックエンド + ウィンドウ管理
- **TypeScript**: 型チェック
- **TailwindCSS**: スタイリング