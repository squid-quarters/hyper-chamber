use crate::{authorize, Backend};
use serde_json::{json, Map, Value};
use std::{sync::Mutex, time::Duration};
use tauri::{Manager, WebviewWindow};
use tauri_plugin_dialog::DialogExt;

#[derive(Default)]
pub struct ContentManagementState(Mutex<()>);

fn content_request(request: &Value) -> Result<(&'static str, Map<String, Value>), String> {
    if serde_json::to_vec(request)
        .map_err(|error| error.to_string())?
        .len()
        > 8192
    {
        return Err("The content-management request is too large.".into());
    }
    let source = request
        .as_object()
        .ok_or("Choose a content-management action.")?;
    let command = source
        .get("command")
        .and_then(Value::as_str)
        .ok_or("Choose a content-management action.")?;
    let (endpoint, fields): (&str, &[&str]) = match command {
        "list" => ("/api/admin/content/list", &["command"]),
        "preview" => ("/api/admin/content/preview", &["command"]),
        "remove-preview" => ("/api/admin/content/remove-preview", &["command", "packId"]),
        "commit" => (
            "/api/admin/content/commit",
            &[
                "command",
                "token",
                "expectedGeneration",
                "allowConflicts",
                "allowDowngrade",
            ],
        ),
        "discard" => ("/api/admin/content/discard", &["command", "token"]),
        "remove" => (
            "/api/admin/content/remove",
            &["command", "packId", "expectedGeneration", "allowFallback"],
        ),
        "backups" => ("/api/admin/backup/list", &["command"]),
        "restore" => (
            "/api/admin/backup/restore",
            &["command", "file", "expectedMaintenanceRevision"],
        ),
        _ => return Err("That content-management action is unavailable.".into()),
    };
    if source.keys().any(|key| !fields.contains(&key.as_str())) {
        return Err("The content-management action contains unsupported fields.".into());
    }
    let mut body = source.clone();
    body.remove("command");
    Ok((endpoint, body))
}

#[tauri::command]
pub async fn manage_content(
    app: tauri::AppHandle,
    window: WebviewWindow,
    request: Value,
) -> Result<Value, String> {
    authorize(&window, &app.state::<Backend>())?;
    let (endpoint, mut body) = content_request(&request)?;
    tauri::async_runtime::spawn_blocking(move || {
        let state = app.state::<ContentManagementState>();
        let _busy = state
            .0
            .try_lock()
            .map_err(|_| "Another library action is running. Wait for it to finish.")?;
        if endpoint == "/api/admin/content/preview" {
            let Some(file) = app
                .dialog()
                .file()
                .set_title("Choose a reference pack")
                .add_filter("Hyper Chamber pack", &["hcpack"])
                .blocking_pick_file()
            else {
                return Ok(json!({"cancelled":true}));
            };
            let path = file
                .into_path()
                .map_err(|_| "Choose a local content pack.")?;
            body.insert(
                "path".into(),
                Value::String(
                    dunce::simplified(&path)
                        .to_str()
                        .ok_or("Choose a pack path with supported Unicode characters.")?
                        .to_string(),
                ),
            );
        }
        app.state::<Backend>()
            .admin(endpoint, Value::Object(body), Duration::from_secs(600))
    })
    .await
    .map_err(|error| format!("The library action stopped: {error}"))?
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn content_actions_use_fixed_endpoints_and_native_selected_paths() {
        for request in [
            json!({"command":"preview","path":"/outside"}),
            json!({"command":"list","endpoint":"/api/admin/shutdown"}),
            json!({"command":"shutdown"}),
            json!({"command":"restore","path":"/outside","file":"backup.sqlite"}),
        ] {
            assert!(content_request(&request).is_err());
        }
        let (endpoint, body) = content_request(&json!({"command":"commit","token":"candidate","expectedGeneration":3,"allowConflicts":true})).unwrap();
        assert_eq!(endpoint, "/api/admin/content/commit");
        assert_eq!(
            Value::Object(body),
            json!({"token":"candidate","expectedGeneration":3,"allowConflicts":true})
        );
        assert_eq!(content_request(&json!({"command":"restore","file":"snapshot.sqlite","expectedMaintenanceRevision":2})).unwrap().0,"/api/admin/backup/restore");
    }
}
