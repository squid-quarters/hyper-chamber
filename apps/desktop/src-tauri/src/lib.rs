#[cfg(test)]
mod external_links_tests;

mod library;
mod runtime;

use runtime::{is_app_origin, Backend};
use serde::Serialize;
use serde_json::{json, Value};
use std::{path::PathBuf, time::Duration};
use tauri::{Manager, State, WebviewUrl, WebviewWindow};
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
use tauri_plugin_opener::OpenerExt;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HostInfo {
    desktop: bool,
    library_dir: String,
    runtime: Value,
}

fn authorize(window: &WebviewWindow, backend: &Backend) -> Result<(), String> {
    let url = window
        .url()
        .map_err(|_| "The app window could not be identified.")?;
    if window.label() != "main" || !is_app_origin(&url, &backend.url) {
        return Err("This operation is available only in the Hyper Chamber desktop window.".into());
    }
    Ok(())
}

#[tauri::command]
async fn get_host_info(
    window: WebviewWindow,
    backend: State<'_, Backend>,
) -> Result<HostInfo, String> {
    authorize(&window, &backend)?;
    Ok(HostInfo {
        desktop: true,
        library_dir: backend.library_dir.to_string_lossy().into_owned(),
        runtime: backend.runtime()?,
    })
}

#[tauri::command]
async fn set_sharing_enabled(
    enabled: bool,
    window: WebviewWindow,
    backend: State<'_, Backend>,
) -> Result<Value, String> {
    authorize(&window, &backend)?;
    backend.admin(
        "/api/admin/sharing",
        json!({"enabled": enabled}),
        Duration::from_secs(15),
    )
}

#[tauri::command]
async fn import_content_pack(
    app: tauri::AppHandle,
    window: WebviewWindow,
    backend: State<'_, Backend>,
) -> Result<Value, String> {
    authorize(&window, &backend)?;
    let Some(file) = app
        .dialog()
        .file()
        .add_filter("Hyper Chamber content pack", &["hcpack"])
        .blocking_pick_file()
    else {
        return Ok(json!({"cancelled": true}));
    };
    let path = file
        .into_path()
        .map_err(|_| "The selected pack is not a local file.")?;
    backend.admin(
        "/api/admin/content/import",
        json!({"path": path}),
        Duration::from_secs(300),
    )
}

#[tauri::command]
async fn create_backup(
    window: WebviewWindow,
    backend: State<'_, Backend>,
) -> Result<Value, String> {
    authorize(&window, &backend)?;
    backend.admin("/api/admin/backup", json!({}), Duration::from_secs(60))
}

#[tauri::command]
async fn reveal_library_folder(
    app: tauri::AppHandle,
    window: WebviewWindow,
    backend: State<'_, Backend>,
) -> Result<Value, String> {
    authorize(&window, &backend)?;
    app.opener()
        .open_path(
            backend.library_dir.to_string_lossy().into_owned(),
            None::<&str>,
        )
        .map_err(|error| format!("The library folder could not be opened: {error}"))?;
    Ok(json!({"opened": true}))
}

#[tauri::command]
async fn choose_library_folder(
    app: tauri::AppHandle,
    window: WebviewWindow,
    backend: State<'_, Backend>,
) -> Result<Value, String> {
    authorize(&window, &backend)?;
    if std::env::var_os("HYPER_CHAMBER_LIBRARY_DIR").is_some() {
        return Err("This launch uses HYPER_CHAMBER_LIBRARY_DIR. Remove that environment override before choosing another library.".into());
    }
    let Some(folder) = app
        .dialog()
        .file()
        .set_title("Choose a Hyper Chamber library folder")
        .blocking_pick_folder()
    else {
        return Ok(json!({"cancelled": true}));
    };
    let path = folder
        .into_path()
        .map_err(|_| "Choose a local library folder.")?;
    let path = std::fs::canonicalize(&path)
        .map_err(|error| format!("The chosen library folder could not be opened: {error}"))?;
    if !path.is_dir() {
        return Err("Choose a folder for the library.".into());
    }
    if std::fs::canonicalize(&backend.library_dir).ok().as_ref() == Some(&path) {
        return Ok(json!({"unchanged": true}));
    }
    // Validate the new library before interrupting the running one. No data is moved or deleted.
    let probe = Backend::start_on_port(
        &backend.resources,
        path.clone(),
        &app.package_info().version.to_string(),
        "0",
    )?;
    probe.runtime()?;
    probe.stop();
    library::save_library(
        &app.path()
            .app_config_dir()
            .map_err(|error| error.to_string())?,
        &path,
    )?;
    backend.stop();
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(250));
        app.restart();
    });
    Ok(json!({"restarting": true}))
}

// CI smoke keeps startup failures machine-readable instead of waiting on an unattended dialog.
// This records only bootstrap locations/status, never the host-control token.
fn startup_diagnostic(event: &str, detail: &str) -> bool {
    if std::env::var("CI").as_deref() != Ok("true") {
        return false;
    }
    let Some(path) = std::env::var_os("HYPER_CHAMBER_DIAGNOSTICS_PATH") else {
        return false;
    };
    use std::io::Write;
    if let Ok(mut file) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(path)
    {
        let _ = writeln!(file, "{}", json!({"event": event, "detail": detail}));
    }
    true
}

fn report_startup_error(app: &tauri::App, title: &str, error: &str) {
    if startup_diagnostic("error", error) {
        return;
    }
    app.dialog()
        .message(error)
        .title(title)
        .kind(MessageDialogKind::Error)
        .blocking_show();
}

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_host_info,
            set_sharing_enabled,
            import_content_pack,
            create_backup,
            choose_library_folder,
            reveal_library_folder
        ])
        .setup(|app| {
            let resource_dir = std::env::var_os("HYPER_CHAMBER_RESOURCES_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|| {
                    if cfg!(debug_assertions) {
                        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../build/resources")
                    } else {
                        app.path()
                            .resource_dir()
                            .expect("The application resource folder is unavailable")
                            .join("resources")
                    }
                });
            startup_diagnostic("resources", &resource_dir.to_string_lossy());
            let library_dir = library::selected_library(
                &app.path().app_config_dir()?,
                app.path().app_data_dir()?.join("library"),
                std::env::var_os("HYPER_CHAMBER_LIBRARY_DIR").map(PathBuf::from),
            )
            .inspect_err(|error| {
                report_startup_error(app, "Hyper Chamber could not open its library", error);
            })?;
            startup_diagnostic("library", &library_dir.to_string_lossy());
            let backend = match Backend::start(
                &resource_dir,
                library_dir,
                &app.package_info().version.to_string(),
            ) {
                Ok(backend) => backend,
                Err(error) => {
                    report_startup_error(app, "Hyper Chamber could not start", &error);
                    return Err(error.into());
                }
            };
            startup_diagnostic("backend-ready", &backend.url);
            let url = tauri::Url::parse(&backend.url)?;
            let allowed_origin = backend.url.clone();
            let opener = app.handle().clone();
            app.manage(backend);
            tauri::WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url))
                .title("Hyper Chamber")
                .inner_size(1280.0, 800.0)
                .min_inner_size(880.0, 600.0)
                .center()
                .initialization_script("window.__HYPER_CHAMBER_DESKTOP__ = true;")
                .on_navigation(move |url| is_app_origin(url, &allowed_origin))
                .on_new_window(move |url, _| {
                    if matches!(url.scheme(), "https" | "http") {
                        let _ = opener.opener().open_url(url.as_str(), None::<&str>);
                    }
                    tauri::webview::NewWindowResponse::Deny
                })
                .build()?;
            app.set_menu(tauri::menu::Menu::default(app.handle())?)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .unwrap_or_else(|error| {
            startup_diagnostic("desktop-error", &error.to_string());
            panic!("Hyper Chamber could not initialize its desktop shell: {error}");
        });
    app.run(|app, event| match event {
        tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit => {
            if let Some(backend) = app.try_state::<Backend>() {
                backend.stop();
            }
        }
        #[cfg(target_os = "macos")]
        tauri::RunEvent::Reopen { .. } => {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
        _ => {}
    });
}
