// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}


//起動引数から１つ目を返すコマンド

#[tauri::command]
fn get_launch_image_path() -> Option<String> {
    std::env::args().nth(1)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_launch_image_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
