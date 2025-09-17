# Tauriファイルパス処理エラー修正

## 問題
- コマンドライン引数で日本語パスを指定すると404/500エラーが発生
- `convertFileSrc()`でWindowsパスが適切に処理されない
- URLエンコードされたパスがViteサーバーに送信される

## 解決策

### 1. ImageLoader.ts修正
- バックスラッシュをスラッシュに正規化: `path.replace(/\\/g, '/')`
- デバッグログ追加でパス変換過程を可視化
- `loadLaunchImage()`と`loadImageFromPath()`両方を修正

### 2. lib.rs修正  
- `get_launch_image_path()`でファイル存在チェック追加
- 存在しないファイルパスはNoneを返すように安全化

## 実装コード

```typescript
// ImageLoader.ts
const normalizedPath = path.replace(/\\/g, '/');
const url = convertFileSrc(normalizedPath);
```

```rust
// lib.rs  
if std::path::Path::new(&path).exists() {
    Some(path)
} else {
    None
}
```

## 検証済み
- コマンド: `npm run tauri:dev -- 'D:\!VRCスクショ\VRChat_2025-06-01_23-48-00.172_3840x2160re.png' '700x400'`
- 結果: 404/500エラー解消、正常起動確認

## 影響範囲
- 日本語を含むファイルパス
- Windowsバックスラッシュパス
- スペースを含むパス