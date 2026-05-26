use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use serde::Serialize;
use std::{
    fs,
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Serialize)]
struct PfFileEntry {
    path: String,
    name: String,
    size: u64,
    modified: Option<u128>,
}

fn err_string<E: std::fmt::Display>(error: E) -> String {
    error.to_string()
}

fn modified_ms(time: SystemTime) -> Option<u128> {
    time.duration_since(UNIX_EPOCH)
        .ok()
        .map(|duration| duration.as_millis())
}

fn mime_for_path(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
        .as_str()
    {
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "gif" => "image/gif",
        "ttf" => "font/ttf",
        "otf" => "font/otf",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "csv" => "text/csv",
        "json" => "application/json",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        _ => "application/octet-stream",
    }
}

fn collect_files(root: &Path, current: &Path, files: &mut Vec<PfFileEntry>) -> Result<(), String> {
    if !current.exists() {
        return Ok(());
    }

    for entry in fs::read_dir(current).map_err(err_string)? {
        let entry = entry.map_err(err_string)?;
        let file_type = entry.file_type().map_err(err_string)?;
        let path = entry.path();

        if file_type.is_dir() {
            collect_files(root, &path, files)?;
            continue;
        }
        if !file_type.is_file() {
            continue;
        }

        let metadata = entry.metadata().map_err(err_string)?;
        let relative = path
            .strip_prefix(root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");

        files.push(PfFileEntry {
            path: relative,
            name: entry.file_name().to_string_lossy().to_string(),
            size: metadata.len(),
            modified: metadata.modified().ok().and_then(modified_ms),
        });
    }

    Ok(())
}

#[tauri::command]
fn pf_is_dir(path: String) -> Result<bool, String> {
    Ok(PathBuf::from(path).is_dir())
}

#[tauri::command]
fn pf_ensure_dir(path: String) -> Result<(), String> {
    fs::create_dir_all(path).map_err(err_string)
}

#[tauri::command]
fn pf_read_text(path: String) -> Result<Option<String>, String> {
    let path = PathBuf::from(path);
    if !path.exists() {
        return Ok(None);
    }
    fs::read_to_string(path).map(Some).map_err(err_string)
}

#[tauri::command]
fn pf_write_text_atomic(path: String, contents: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(err_string)?;
    }

    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("plateforge.tmp");
    let mut temp_path = path.clone();
    temp_path.set_file_name(format!(".{file_name}.{stamp}.tmp"));

    fs::write(&temp_path, contents).map_err(err_string)?;
    fs::rename(&temp_path, &path).map_err(|error| {
        let _ = fs::remove_file(&temp_path);
        error.to_string()
    })
}

#[tauri::command]
fn pf_read_dir_recursive(path: String) -> Result<Vec<PfFileEntry>, String> {
    let root = PathBuf::from(path);
    let mut files = Vec::new();
    collect_files(&root, &root, &mut files)?;
    files.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(files)
}

#[tauri::command]
fn pf_read_file_data_url(path: String) -> Result<String, String> {
    let path = PathBuf::from(path);
    let bytes = fs::read(&path).map_err(err_string)?;
    Ok(format!(
        "data:{};base64,{}",
        mime_for_path(&path),
        BASE64.encode(bytes)
    ))
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            pf_is_dir,
            pf_ensure_dir,
            pf_read_text,
            pf_write_text_atomic,
            pf_read_dir_recursive,
            pf_read_file_data_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running PlateForge");
}
