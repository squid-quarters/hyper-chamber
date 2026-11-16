use crate::{authorize, Backend};
use serde::Deserialize;
use serde_json::{json, Map, Value};
use std::{
    fs,
    io::{Read, Write},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::{Duration, Instant},
};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

const MAX_REQUEST: usize = 16 * 1024 * 1024;
const MAX_OUTPUT: usize = 32 * 1024 * 1024;

struct Session {
    directory: PathBuf,
    preview_token: String,
}
#[derive(Default)]
pub struct AuthoringState(Mutex<Option<Session>>);

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OpenMode {
    New,
    Open,
    Fork,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct OpenOptions {
    mode: OpenMode,
    title: Option<String>,
    author: Option<String>,
    games: Option<Value>,
}

fn normalized_path(path: &Path) -> Result<String, String> {
    dunce::simplified(path)
        .to_str()
        .map(str::to_owned)
        .ok_or_else(|| "Choose a workspace path with supported Unicode characters.".into())
}
fn bounded_reader<R: Read + Send + 'static>(
    reader: R,
    limit: usize,
    overflow: Arc<AtomicBool>,
) -> thread::JoinHandle<Result<Vec<u8>, String>> {
    thread::spawn(move || {
        let mut bytes = Vec::new();
        reader
            .take(limit as u64 + 1)
            .read_to_end(&mut bytes)
            .map_err(|error| format!("Pack-tool output could not be read: {error}"))?;
        if bytes.len() > limit {
            overflow.store(true, Ordering::Release);
            return Err("The pack tool returned too much output.".into());
        }
        Ok(bytes)
    })
}
fn pack_tool(resources: &Path, request: &Value) -> Result<Value, String> {
    let input = serde_json::to_vec(request).map_err(|error| error.to_string())?;
    if input.len() > MAX_REQUEST {
        return Err("The authoring request exceeds 16 MiB.".into());
    }
    let node = resources.join(if cfg!(windows) { "node.exe" } else { "node" });
    let script = resources.join("authoring").join("cli.mjs");
    if !node.is_file() || !script.is_file() {
        return Err(
            "Pack tools are missing. Reinstall Hyper Chamber or rebuild its desktop resources."
                .into(),
        );
    }
    let mut command = Command::new(node);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    command
        .arg(dunce::simplified(&script))
        .arg("--json")
        .env_remove("NODE_OPTIONS");
    let (status, stdout, stderr) = run_tool_child(command, input, Duration::from_secs(600))?;
    let value: Value = serde_json::from_slice(&stdout).map_err(|_| {
        if stderr.is_empty() {
            "The pack tool returned an invalid response.".to_string()
        } else {
            format!("The pack tool failed: {}", String::from_utf8_lossy(&stderr))
        }
    })?;
    if !status.success() || value.get("ok") != Some(&Value::Bool(true)) {
        return Err(value
            .pointer("/error/message")
            .and_then(Value::as_str)
            .unwrap_or("The authoring command failed.")
            .to_string());
    }
    value
        .get("result")
        .cloned()
        .ok_or_else(|| "The pack tool returned no result.".into())
}

// Kill and reap only the process this invocation created, including error paths.
struct OwnedChild(std::process::Child);
impl Drop for OwnedChild {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}
fn run_tool_child(
    mut command: Command,
    input: Vec<u8>,
    timeout: Duration,
) -> Result<(std::process::ExitStatus, Vec<u8>, Vec<u8>), String> {
    let started = Instant::now();
    let mut child = OwnedChild(
        command
            .env("HYPER_CHAMBER_PARENT_PID", std::process::id().to_string())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|error| format!("Pack tools could not start: {error}"))?,
    );
    let stdin = child
        .0
        .stdin
        .take()
        .ok_or("Pack-tool input is unavailable.")?;
    let stdout = child
        .0
        .stdout
        .take()
        .ok_or("Pack-tool output is unavailable.")?;
    let stderr = child
        .0
        .stderr
        .take()
        .ok_or("Pack-tool diagnostics are unavailable.")?;
    let overflow = Arc::new(AtomicBool::new(false));
    let output = bounded_reader(stdout, MAX_OUTPUT, overflow.clone());
    let errors = bounded_reader(stderr, 64 * 1024, overflow.clone());
    let write_failed = Arc::new(AtomicBool::new(false));
    let write_signal = write_failed.clone();
    // A pipe can fill before the child consumes it. Never block the deadline
    // polling thread on write_all; killing this child closes the writer's pipe.
    let writer = thread::spawn(move || {
        let mut stdin = stdin;
        stdin.write_all(&input).map_err(|error| {
            write_signal.store(true, Ordering::Release);
            format!("Pack-tool input could not be sent: {error}")
        })
    });
    let status = loop {
        if write_failed.load(Ordering::Acquire)
            || overflow.load(Ordering::Acquire)
            || started.elapsed() > timeout
        {
            let _ = child.0.kill();
            let _ = child.0.wait();
            break None;
        }
        match child.0.try_wait() {
            Ok(Some(status)) => break Some(status),
            Ok(None) => thread::sleep(Duration::from_millis(20)),
            Err(_) => {
                let _ = child.0.kill();
                let _ = child.0.wait();
                break None;
            }
        }
    };
    // Join every owned thread before propagating any error.
    let written = writer
        .join()
        .map_err(|_| "Pack-tool input writer stopped unexpectedly.");
    let stdout_result = output
        .join()
        .map_err(|_| "Pack-tool output reader stopped unexpectedly.");
    let stderr_result = errors
        .join()
        .map_err(|_| "Pack-tool diagnostic reader stopped unexpectedly.");
    let status = status.ok_or(
        "The pack tool did not finish. Your workspace was kept; reopen it before retrying.",
    )?;
    written??;
    Ok((status, stdout_result??, stderr_result??))
}

fn scoped_request(request: &Value, directory: &Path) -> Result<Map<String, Value>, String> {
    let source = request.as_object().ok_or("Choose an authoring action.")?;
    let command = source
        .get("command")
        .and_then(Value::as_str)
        .ok_or("Choose an authoring action.")?;
    let fields: &[&str] = match command {
        "read" | "validate" | "export" => &["command"],
        "save" => &["command", "workspace"],
        "write-asset" => &["command", "path", "base64"],
        "add-media" => &["command", "referenceId"],
        _ => return Err("That action is not available in the open workspace.".into()),
    };
    if source.keys().any(|key| !fields.contains(&key.as_str())) {
        return Err("The authoring action contains unsupported fields.".into());
    }
    let mut result = source.clone();
    result.insert(
        "directory".into(),
        Value::String(normalized_path(directory)?),
    );
    Ok(result)
}

#[tauri::command]
pub async fn open_authoring_workspace(
    app: tauri::AppHandle,
    window: WebviewWindow,
    options: OpenOptions,
) -> Result<Value, String> {
    authorize(&window, &app.state::<Backend>())?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AuthoringState>();
        let mut session = state.0.try_lock().map_err(|_| "Another workspace action is running. Wait for it to finish.")?;
        let archive = if matches!(options.mode, OpenMode::Fork) {
            let Some(file) = app.dialog().file().set_title("Choose a pack to fork").add_filter("Hyper Chamber pack", &["hcpack"]).blocking_pick_file() else {return Ok(json!({"cancelled":true}));};
            Some(file.into_path().map_err(|_| "Choose a local content pack.")?)
        } else {None};
        let title = match options.mode {OpenMode::Open => "Open a pack workspace", _ => "Choose an empty folder for the workspace"};
        let Some(folder) = app.dialog().file().set_title(title).blocking_pick_folder() else {return Ok(json!({"cancelled":true}));};
        let directory = fs::canonicalize(folder.into_path().map_err(|_| "Choose a local workspace folder.")?).map_err(|error| format!("The workspace folder could not be opened: {error}"))?;
        let request = match options.mode {
            OpenMode::Open => json!({"command":"read","directory":normalized_path(&directory)?}),
            OpenMode::New => json!({"command":"create","directory":normalized_path(&directory)?,"title":options.title.ok_or("Enter a pack title.")?,"author":options.author.ok_or("Enter its creator's name.")?,"games":options.games.ok_or("Choose a game profile.")?}),
            OpenMode::Fork => {
                let mut request=json!({"command":"fork","directory":normalized_path(&directory)?,"archive":normalized_path(archive.as_ref().ok_or("Choose a pack to fork.")?)?,"author":options.author.ok_or("Enter its creator's name.")?});
                if let Some(title)=options.title {request["title"]=Value::String(title);}
                request
            },
        };
        let backend = app.state::<Backend>();
        let mut result = pack_tool(&backend.resources, &request)?;
        let preview = backend.admin("/api/admin/authoring/preview",json!({"directory":normalized_path(&directory)?}),Duration::from_secs(15))?;
        let token = preview.get("token").and_then(Value::as_str).ok_or("The workspace preview could not be registered.")?.to_string();
        let base_url = preview.get("baseUrl").and_then(Value::as_str).ok_or("The workspace preview has no address.")?.to_string();
        if let Some(previous) = session.as_ref() {
            if let Err(error) = backend.admin("/api/admin/authoring/release",json!({"token":previous.preview_token}),Duration::from_secs(10)) {
                let _ = backend.admin("/api/admin/authoring/release",json!({"token":token}),Duration::from_secs(10));
                return Err(format!("The previous workspace preview could not be closed: {error}"));
            }
        }
        *session = Some(Session{directory,preview_token:token});
        result.as_object_mut().ok_or("The pack tool returned an invalid workspace.")?.insert("previewBaseUrl".into(),Value::String(base_url));
        Ok(result)
    }).await.map_err(|error| format!("The workspace action stopped: {error}"))?
}

#[tauri::command]
pub async fn authoring_action(
    app: tauri::AppHandle,
    window: WebviewWindow,
    request: Value,
) -> Result<Value, String> {
    authorize(&window, &app.state::<Backend>())?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AuthoringState>();
        let session = state
            .0
            .try_lock()
            .map_err(|_| "Another workspace action is running. Wait for it to finish.")?;
        let session = session.as_ref().ok_or("Open a workspace first.")?;
        let mut request = scoped_request(&request, &session.directory)?;
        let command = request
            .get("command")
            .and_then(Value::as_str)
            .ok_or("Choose an authoring action.")?;
        if command == "add-media" {
            let Some(file) = app
                .dialog()
                .file()
                .set_title("Choose a short MP4 or WebM recording")
                .add_filter("Replay video", &["mp4", "webm"])
                .blocking_pick_file()
            else {
                return Ok(json!({"cancelled":true}));
            };
            let path = file.into_path().map_err(|_| "Choose a local recording.")?;
            request.insert("sourcePath".into(), Value::String(normalized_path(&path)?));
        } else if command == "export" {
            let Some(file) = app
                .dialog()
                .file()
                .set_title("Export reference pack")
                .add_filter("Hyper Chamber pack", &["hcpack"])
                .set_file_name("references.hcpack")
                .blocking_save_file()
            else {
                return Ok(json!({"cancelled":true}));
            };
            let path = file
                .into_path()
                .map_err(|_| "Choose a local export destination.")?;
            request.insert("output".into(), Value::String(normalized_path(&path)?));
        }
        pack_tool(&app.state::<Backend>().resources, &Value::Object(request))
    })
    .await
    .map_err(|error| format!("The workspace action stopped: {error}"))?
}

#[tauri::command]
pub async fn close_authoring_workspace(
    app: tauri::AppHandle,
    window: WebviewWindow,
) -> Result<Value, String> {
    authorize(&window, &app.state::<Backend>())?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<AuthoringState>();
        let mut session = state
            .0
            .try_lock()
            .map_err(|_| "Another workspace action is running. Wait for it to finish.")?;
        if let Some(current) = session.as_ref() {
            app.state::<Backend>().admin(
                "/api/admin/authoring/release",
                json!({"token":current.preview_token}),
                Duration::from_secs(10),
            )?;
        }
        *session = None;
        Ok(json!({"closed":true}))
    })
    .await
    .map_err(|error| format!("The workspace could not be closed: {error}"))?
}

fn installed_resources(executable: &Path) -> Result<PathBuf, String> {
    if let Some(path) = std::env::var_os("HYPER_CHAMBER_RESOURCES_DIR") {
        return Ok(PathBuf::from(path));
    }
    if cfg!(debug_assertions) {
        return Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../build/resources"));
    }
    resources_beside_executable(executable, cfg!(target_os = "macos"))
}
fn resources_beside_executable(executable: &Path, mac: bool) -> Result<PathBuf, String> {
    let parent = executable
        .parent()
        .ok_or("The application location is unavailable.")?;
    if mac {
        Ok(parent
            .parent()
            .ok_or("The app bundle location is unavailable.")?
            .join("Resources/resources"))
    } else {
        Ok(parent.join("resources"))
    }
}
/// CLI mode runs the same packaged tool without opening a window or library.
pub fn run_pack_cli() -> Option<i32> {
    let arguments: Vec<_> = std::env::args_os().skip(1).collect();
    if arguments.first().is_none_or(|value| value != "--pack") {
        return None;
    }
    if arguments
        .iter()
        .skip(1)
        .any(|value| value != "--json" && value != "--help")
    {
        eprintln!("Use --pack --json, or --pack --help.");
        return Some(2);
    }
    let run = || -> Result<i32, String> {
        let resources =
            installed_resources(&std::env::current_exe().map_err(|error| error.to_string())?)?;
        let node = resources.join(if cfg!(windows) { "node.exe" } else { "node" });
        let script = resources.join("authoring/cli.mjs");
        if !script.is_file() || !node.is_file() {
            return Err(
                "Pack tools are missing. Reinstall Hyper Chamber or rebuild desktop resources."
                    .into(),
            );
        }
        let mut child = OwnedChild(
            Command::new(node)
                .arg(dunce::simplified(&script))
                .args(arguments.iter().skip(1))
                .env_remove("NODE_OPTIONS")
                .env("HYPER_CHAMBER_PARENT_PID", std::process::id().to_string())
                .stdin(Stdio::inherit())
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .spawn()
                .map_err(|error| format!("Pack tools could not start: {error}"))?,
        );
        let status = child
            .0
            .wait()
            .map_err(|error| format!("Pack tools could not finish: {error}"))?;
        Ok(status.code().unwrap_or(1))
    };
    Some(match run() {
        Ok(code) => code,
        Err(error) => {
            eprintln!("{error}");
            1
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn workspace_actions_cannot_supply_directories_or_arbitrary_file_paths() {
        let directory = Path::new("workspace");
        for request in [
            json!({"command":"read","directory":"outside"}),
            json!({"command":"export","output":"outside"}),
            json!({"command":"add-media","sourcePath":"outside","referenceId":"ref"}),
            json!({"command":"fork"}),
            json!({"command":"create"}),
        ] {
            assert!(scoped_request(&request, directory).is_err());
        }
        let request = scoped_request(
            &json!({"command":"save","workspace":{"id":"test"}}),
            directory,
        )
        .unwrap();
        assert_eq!(request.get("directory"), Some(&json!("workspace")));
    }
    #[test]
    fn oversized_tool_output_is_bounded_and_reported() {
        let overflow = Arc::new(AtomicBool::new(false));
        let reader = bounded_reader(std::io::Cursor::new(vec![0u8; 65]), 64, overflow.clone());
        assert!(reader.join().unwrap().is_err());
        assert!(overflow.load(Ordering::Acquire));
        let request = json!({"payload":"x".repeat(MAX_REQUEST)});
        assert!(pack_tool(Path::new("missing-resources"), &request)
            .unwrap_err()
            .contains("16 MiB"));
    }

    #[test]
    fn blocked_tool_stdin_obeys_the_spawn_deadline() {
        let mut command = Command::new("node");
        // Deliberately never consume the pipe; enough input fills the OS buffer.
        command.args(["-e", "setTimeout(() => {}, 2000)"]);
        let started = Instant::now();
        let result = run_tool_child(command, vec![b'x'; 1024 * 1024], Duration::from_millis(80));
        assert!(result.is_err());
        assert!(
            started.elapsed() < Duration::from_millis(1200),
            "stdin blocked beyond the child deadline: {:?}",
            started.elapsed()
        );
    }

    #[test]
    fn packaged_cli_resources_follow_native_bundle_layouts() {
        assert_eq!(
            resources_beside_executable(
                Path::new("/Applications/Hyper Chamber.app/Contents/MacOS/hyper-chamber-desktop"),
                true
            )
            .unwrap(),
            PathBuf::from("/Applications/Hyper Chamber.app/Contents/Resources/resources")
        );
        assert_eq!(
            resources_beside_executable(Path::new("install/hyper-chamber-desktop.exe"), false)
                .unwrap(),
            PathBuf::from("install/resources")
        );
    }
}
