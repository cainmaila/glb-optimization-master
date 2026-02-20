use std::path::PathBuf;
use std::process::Command;
use tauri::Manager;

/// Runs the Node.js sidecar optimization script.
///
/// The sidecar script (`optimize-glb.js`) is bundled as a Tauri resource.
/// It reads `input_path`, applies the optimization `config`, writes the
/// result to a temp file, and prints a JSON report to stdout.
///
/// Returns a JSON string: `{ "outputPath": "...", "originalReport": {...}, "optimizedReport": {...} }`
#[tauri::command]
fn optimize_glb(
    app: tauri::AppHandle,
    input_path: String,
    config: String,
) -> Result<String, String> {
    // Validate input path
    let input = std::path::Path::new(&input_path);
    if !input.exists() {
        return Err(format!("Input file does not exist: {input_path}"));
    }
    if input.extension().and_then(|e| e.to_str()) != Some("glb") {
        return Err("Input file must have a .glb extension".to_string());
    }

    // Validate that config is well-formed JSON (the sidecar also parses it, but
    // we catch obvious issues early here to give a cleaner error message).
    serde_json::from_str::<serde_json::Value>(&config)
        .map_err(|e| format!("Invalid config JSON: {e}"))?;

    // Locate the bundled sidecar script
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {e}"))?;
    let script_path: PathBuf = resource_dir.join("sidecar").join("optimize-glb.js");

    if !script_path.exists() {
        return Err(format!(
            "Optimization script not found at: {}",
            script_path.display()
        ));
    }

    // Choose a temp output path
    let temp_dir = std::env::temp_dir();
    let output_path = temp_dir.join("glb_optimized_output.glb");

    // Invoke Node.js with the sidecar script
    let output = Command::new("node")
        .arg(&script_path)
        .arg(&input_path)
        .arg(&config)
        .arg(&output_path)
        .output()
        .map_err(|e| format!("Failed to run node: {e}\nMake sure Node.js is installed and available in PATH."))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Optimization script failed:\n{stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(stdout)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![optimize_glb])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
