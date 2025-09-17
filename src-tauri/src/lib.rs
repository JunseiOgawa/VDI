use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
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


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 起動引数から画面サイズ設定を取得
    let window_mode = std::env::args().nth(2);
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_launch_image_path, get_launch_window_mode, get_folder_images, get_next_image, get_previous_image])
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
