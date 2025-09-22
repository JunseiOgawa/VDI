use tauri::Manager;
use image::ImageFormat;
use std::path::Path;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// 画像ファイルのバックアップを作成するコマンド
#[tauri::command]
async fn create_image_backup(image_path: String) -> Result<String, String> {
    let path = std::path::Path::new(&image_path);
    
    if !path.exists() {
        return Err("指定されたファイルが存在しません".to_string());
    }
    
    // バックアップファイル名を生成
    let backup_path = format!("{}.backup", image_path);
    
    // ファイルをコピーしてバックアップ作成
    std::fs::copy(&image_path, &backup_path)
        .map_err(|e| format!("バックアップ作成に失敗しました: {}", e))?;
    
    Ok(backup_path)
}

// バックアップから画像を復元するコマンド
#[tauri::command]
async fn restore_image_from_backup(image_path: String) -> Result<String, String> {
    let backup_path = format!("{}.backup", image_path);
    let backup = std::path::Path::new(&backup_path);
    
    if !backup.exists() {
        return Err("バックアップファイルが存在しません".to_string());
    }
    
    // バックアップから元ファイルを復元
    std::fs::copy(&backup_path, &image_path)
        .map_err(|e| format!("画像復元に失敗しました: {}", e))?;
    
    // バックアップファイルを削除
    std::fs::remove_file(&backup_path)
        .map_err(|e| format!("バックアップファイル削除に失敗しました: {}", e))?;
    
    Ok(image_path)
}

// バックアップファイルを削除するコマンド
#[tauri::command]
async fn cleanup_image_backup(image_path: String) -> Result<(), String> {
    let backup_path = format!("{}.backup", image_path);
    let backup = std::path::Path::new(&backup_path);
    
    if backup.exists() {
        std::fs::remove_file(&backup_path)
            .map_err(|e| format!("バックアップファイル削除に失敗しました: {}", e))?;
    }
    
    Ok(())
}

// 画像を回転させるコマンド（元ファイルを置き換え）
#[tauri::command]
async fn rotate_image(image_path: String, rotation_angle: f32) -> Result<String, String> {
    let path = Path::new(&image_path);
    
    // パスの検証
    if !path.exists() {
        return Err("指定されたファイルが存在しません".to_string());
    }
    
    // 画像を読み込み
    let img = image::open(path)
        .map_err(|e| format!("画像の読み込みに失敗しました: {}", e))?;
    
    // 回転処理（90度単位での回転を想定）
    let rotated_img = match rotation_angle as i32 % 360 {
        90 => img.rotate90(),
        180 => img.rotate180(),
        270 => img.rotate270(),
        _ => img, // 0度または無効な角度の場合はそのまま
    };
    
    // 元の画像形式を推測
    let format = image::ImageFormat::from_path(path)
        .unwrap_or(ImageFormat::Png);
    
    // 元のファイルを直接上書き
    rotated_img.save_with_format(&image_path, format)
        .map_err(|e| format!("回転した画像の保存に失敗しました: {}", e))?;
    
    // 元のパスをそのまま返す
    Ok(image_path)
}


//起動引数から１つ目を返すコマンド

#[tauri::command]
fn get_launch_image_path() -> Option<String> {
    if let Some(path) = std::env::args().nth(1) {
        // パスの検証：実際にファイルが存在するかチェック
        if std::path::Path::new(&path).exists() {
            Some(path)
        } else {
            println!("指定されたファイルが存在しません: {}", path);
            None
        }
    } else {
        None
    }
}

//起動引数から２つ目（ウィンドウサイズ指定）を返すコマンド
#[tauri::command]
fn get_launch_window_mode() -> Option<String> {
    std::env::args().nth(2)
}

// フォルダ内画像ファイル一覧を作成日付順で取得
#[tauri::command]
fn get_folder_images(folder_path: String) -> Option<Vec<String>> {
    use std::fs;
    use std::path::Path;
    
    let folder = Path::new(&folder_path);
    if !folder.is_dir() {
        return None;
    }
    
    let mut images: Vec<(String, std::time::SystemTime)> = Vec::new();
    
    // 画像拡張子フィルター
    let image_extensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif"];
    
    if let Ok(entries) = fs::read_dir(folder) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(extension) = path.extension() {
                    let ext_str = extension.to_string_lossy().to_lowercase();
                    if image_extensions.contains(&ext_str.as_str()) {
                        if let Ok(metadata) = entry.metadata() {
                            if let Ok(created) = metadata.created() {
                                images.push((path.to_string_lossy().to_string(), created));
                            }
                        }
                    }
                }
            }
        }
    }
    
    // 作成日付順でソート（古い順）
    images.sort_by(|a, b| a.1.cmp(&b.1));
    
    let sorted_paths: Vec<String> = images.into_iter().map(|(path, _)| path).collect();
    
    if sorted_paths.is_empty() {
        None
    } else {
        Some(sorted_paths)
    }
}

// 指定された画像の次の画像パスを取得
#[tauri::command]
fn get_next_image(current_path: String, folder_navigation_enabled: bool) -> Option<String> {
    if !folder_navigation_enabled {
        return None;
    }
    
    let current = std::path::Path::new(&current_path);
    if let Some(parent) = current.parent() {
        if let Some(folder_images) = get_folder_images(parent.to_string_lossy().to_string()) {
            if let Some(current_index) = folder_images.iter().position(|path| path == &current_path) {
                let next_index = (current_index + 1) % folder_images.len();
                return Some(folder_images[next_index].clone());
            }
        }
    }
    None
}

// 指定された画像の前の画像パスを取得
#[tauri::command]
fn get_previous_image(current_path: String, folder_navigation_enabled: bool) -> Option<String> {
    if !folder_navigation_enabled {
        return None;
    }
    
    let current = std::path::Path::new(&current_path);
    if let Some(parent) = current.parent() {
        if let Some(folder_images) = get_folder_images(parent.to_string_lossy().to_string()) {
            if let Some(current_index) = folder_images.iter().position(|path| path == &current_path) {
                let prev_index = if current_index == 0 {
                    folder_images.len() - 1
                } else {
                    current_index - 1
                };
                return Some(folder_images[prev_index].clone());
            }
        }
    }
    None
}

// OSのテーマ設定（ライト/ダークモード）を取得するコマンド
// Windows: レジストリのAppsUseLightTheme値を確認
// macOS: defaults read -g AppleInterfaceStyleでダークモード確認  
// Linux: gsettingsでGTKテーマ名を確認
#[tauri::command]
fn get_system_theme() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        
        // Windowsレジストリから現在のテーマ設定を読み取り
        // AppsUseLightTheme: 0x1 = ライト, 0x0 = ダーク
        let output = Command::new("reg")
            .args(&[
                "query", 
                "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", 
                "/v", 
                "AppsUseLightTheme"
            ])
            .output();
        
        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            // レジストリ値が0x0（ダークモード）か0x1（ライトモード）かを判定
            if output_str.contains("0x0") {
                return "dark".to_string();
            } else if output_str.contains("0x1") {
                return "light".to_string();
            }
        }
        // レジストリ読み取りに失敗した場合のフォールバック
        return "light".to_string();
    }
    
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        
        // macOSのグローバル設定からAppleInterfaceStyleを取得
        // "Dark"が返されればダークモード、それ以外はライトモード
        let output = Command::new("defaults")
            .args(&["read", "-g", "AppleInterfaceStyle"])
            .output();
        
        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            if output_str.trim() == "Dark" {
                return "dark".to_string();
            }
        }
        // AppleInterfaceStyleが設定されていない = ライトモード
        return "light".to_string();
    }
    
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;
        
        // GNOME環境のgsettingsからGTKテーマ名を取得
        // テーマ名に"dark"が含まれていればダークモードと判定
        let output = Command::new("gsettings")
            .args(&["get", "org.gnome.desktop.interface", "gtk-theme"])
            .output();
        
        if let Ok(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            if output_str.to_lowercase().contains("dark") {
                return "dark".to_string();
            }
        }
        // gsettingsが利用できない環境やダークテーマでない場合
        return "light".to_string();
    }
    
    // その他のプラットフォーム用フォールバック
    "light".to_string()
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 起動引数から画面サイズ設定を取得
    let window_mode = std::env::args().nth(2);
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_launch_image_path, get_launch_window_mode, get_folder_images, get_next_image, get_previous_image, get_system_theme, rotate_image, create_image_backup, restore_image_from_backup, cleanup_image_backup])
        .setup(move |app| {
            // ウィンドウサイズに応じて設定を変更
            if let Some(mode) = &window_mode {
                match mode.as_str() {
                    "FullScreen" => {
                        let windows = app.webview_windows();
                        if let Some((_, window)) = windows.iter().next() {
                            window.set_fullscreen(true).unwrap();
                        }
                    }
                    mode_str if mode_str.contains('x') => {
                        // 解像度指定 (例: "1920x1080")
                        if let Some((width_str, height_str)) = mode_str.split_once('x') {
                            if let (Ok(width), Ok(height)) = (width_str.parse::<u32>(), height_str.parse::<u32>()) {
                                let windows = app.webview_windows();
                                if let Some((_, window)) = windows.iter().next() {
                                    window.set_size(tauri::LogicalSize::new(width, height)).unwrap();
                                }
                            }
                        }
                    }
                    _ => {
                        // 不正な値の場合はデフォルトサイズ（何もしない）
                    }
                }
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
