use serde::Deserialize;
use serde_json::Value;
use std::{
    ffi::OsString,
    fs::{self, OpenOptions},
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    process::{Child, Command, Stdio},
    sync::{mpsc, Mutex},
    thread,
    time::{Duration, Instant},
};

#[derive(Debug, Deserialize)]
struct ReadyLine {
    port: u16,
}

pub struct Backend {
    child: Mutex<Option<Child>>,
    pub url: String,
    token: String,
    pub library_dir: PathBuf,
    pub resources: PathBuf,
}

pub fn ready_url(line: &str) -> Result<String, String> {
    let json = line
        .strip_prefix("HYPER_CHAMBER_READY ")
        .ok_or("The library server did not send a readiness message.")?;
    let ready: ReadyLine = serde_json::from_str(json)
        .map_err(|_| "The library server sent an invalid readiness message.")?;
    if ready.port == 0 {
        return Err("The library server returned an invalid port.".into());
    }
    Ok(format!("http://127.0.0.1:{}", ready.port))
}

fn secret() -> Result<String, String> {
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).map_err(|_| "A host-control token could not be created.")?;
    Ok(bytes.iter().map(|byte| format!("{byte:02x}")).collect())
}

fn server_arguments(
    resources: &Path,
    library_dir: &Path,
    version: &str,
    port: &str,
) -> Vec<OsString> {
    // Tauri resolves Windows resources to a verbatim path. Node's entrypoint loader
    // needs the ordinary drive path when it can safely represent the same location.
    let resources = dunce::simplified(resources);
    let library_dir = dunce::simplified(library_dir);
    vec![
        resources.join("server").join("cli.mjs").into_os_string(),
        "--library-dir".into(),
        library_dir.as_os_str().to_owned(),
        "--web-dir".into(),
        resources.join("web").into_os_string(),
        "--seed-dir".into(),
        resources.join("seed").into_os_string(),
        "--app-version".into(),
        version.into(),
        "--host".into(),
        "127.0.0.1".into(),
        "--port".into(),
        port.into(),
    ]
}

impl Backend {
    pub fn start(resources: &Path, library_dir: PathBuf, version: &str) -> Result<Self, String> {
        Self::start_on_port(
            resources,
            library_dir,
            version,
            &std::env::var("HYPER_CHAMBER_PORT").unwrap_or_else(|_| "5376".into()),
        )
    }

    pub fn start_on_port(
        resources: &Path,
        library_dir: PathBuf,
        version: &str,
        port: &str,
    ) -> Result<Self, String> {
        fs::create_dir_all(&library_dir)
            .map_err(|e| format!("The library folder could not be opened: {e}"))?;
        let node = resources.join(if cfg!(windows) { "node.exe" } else { "node" });
        let server = resources.join("server").join("cli.mjs");
        let web = resources.join("web");
        let seed = resources.join("seed");
        for path in [&node, &server, &web, &seed] {
            if !path.exists() {
                return Err(format!(
                    "An application resource is missing: {}. Reinstall Hyper Chamber.",
                    path.file_name().unwrap_or_default().to_string_lossy()
                ));
            }
        }
        let token = secret()?;
        let log = OpenOptions::new()
            .create(true)
            .append(true)
            .open(library_dir.join("server.log"))
            .map_err(|e| format!("The library log could not be opened: {e}"))?;
        let mut command = Command::new(node);
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            // The owned server is a console executable; it should not create a second window.
            command.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
        }
        command
            .args(server_arguments(resources, &library_dir, version, port))
            .env("HYPER_CHAMBER_ADMIN_TOKEN", &token)
            .env("HYPER_CHAMBER_PARENT_PID", std::process::id().to_string())
            .env_remove("NODE_OPTIONS")
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::from(log));
        let mut child = command
            .spawn()
            .map_err(|e| format!("The bundled library server could not start: {e}"))?;
        let stdout = child
            .stdout
            .take()
            .ok_or("The library server has no output stream.")?;
        let (sender, receiver) = mpsc::sync_channel(1);
        thread::spawn(move || {
            for line in BufReader::new(stdout).lines() {
                let Ok(line) = line else { break };
                if line.starts_with("HYPER_CHAMBER_READY ") {
                    let _ = sender.try_send(ready_url(&line));
                }
            }
        });
        let url = match receiver.recv_timeout(Duration::from_secs(45)) {
            Ok(Ok(url)) => url,
            Ok(Err(error)) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(error);
            }
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("The library server did not finish starting. Check the library server.log; another app may already use its port.".into());
            }
        };
        Ok(Self {
            child: Mutex::new(Some(child)),
            url,
            token,
            library_dir,
            resources: resources.to_path_buf(),
        })
    }

    pub fn runtime(&self) -> Result<Value, String> {
        self.request("GET", "/api/runtime", None, Duration::from_secs(10))
    }

    pub fn admin(&self, path: &str, body: Value, timeout: Duration) -> Result<Value, String> {
        self.request("POST", path, Some(body), timeout)
    }

    fn request(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
        timeout: Duration,
    ) -> Result<Value, String> {
        let agent: ureq::Agent = ureq::Agent::config_builder()
            .timeout_global(Some(timeout))
            .proxy(None)
            .max_redirects(0)
            .build()
            .into();
        let url = format!("{}{path}", self.url);
        let response = if method == "GET" {
            agent.get(&url).call()
        } else {
            agent
                .post(&url)
                .header("X-Hyper-Chamber-Host", &self.token)
                .send_json(body.unwrap_or(Value::Null))
        };
        response
            .map_err(|e| format!("The library request could not be completed: {e}"))?
            .body_mut()
            .read_json::<Value>()
            .map_err(|e| format!("The library server returned an unreadable response: {e}"))
    }

    pub fn stop(&self) {
        let Ok(mut slot) = self.child.lock() else {
            return;
        };
        let Some(mut child) = slot.take() else { return };
        let _ = self.admin(
            "/api/admin/shutdown",
            serde_json::json!({}),
            Duration::from_secs(3),
        );
        let deadline = Instant::now() + Duration::from_secs(3);
        loop {
            match child.try_wait() {
                Ok(Some(_)) => break,
                Ok(None) if Instant::now() < deadline => thread::sleep(Duration::from_millis(40)),
                _ => {
                    let _ = child.kill();
                    let _ = child.wait();
                    break;
                }
            }
        }
    }
}

impl Drop for Backend {
    fn drop(&mut self) {
        self.stop();
    }
}

pub fn is_app_origin(candidate: &tauri::Url, base: &str) -> bool {
    let Ok(expected) = tauri::Url::parse(base) else {
        return false;
    };
    candidate.scheme() == expected.scheme()
        && candidate.host_str() == expected.host_str()
        && candidate.port_or_known_default() == expected.port_or_known_default()
        && candidate.username().is_empty()
        && candidate.password().is_none()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn canonicalized_resource_paths_load_the_node_entrypoint() {
        let scratch =
            std::env::temp_dir().join(format!("hc-native-node-path-{}", secret().unwrap()));
        let resources = scratch.join("Hyper Chamber resources");
        let library = scratch.join("Library café");
        fs::create_dir_all(resources.join("server")).unwrap();
        fs::create_dir_all(resources.join("web")).unwrap();
        fs::create_dir_all(resources.join("seed")).unwrap();
        fs::create_dir_all(&library).unwrap();
        fs::write(
            resources.join("server").join("cli.mjs"),
            r#"import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {parseArgs} from 'node:util';
const {values} = parseArgs({options: Object.fromEntries(
    ['library-dir','web-dir','seed-dir','app-version','host','port'].map(key => [key, {type:'string'}])
)});
for (const key of ['library-dir','web-dir','seed-dir']) assert.ok(statSync(values[key]).isDirectory());
assert.equal(values['app-version'], '1.0.0-beta.1');
assert.equal(values.host, '127.0.0.1');
assert.equal(values.port, '5376');
console.log('HYPER_CHAMBER_NODE_PATH_PASSED');"#,
        )
        .unwrap();
        // On Windows these are the same verbatim paths supplied by Tauri.
        let resources = fs::canonicalize(&resources).unwrap();
        let library = fs::canonicalize(&library).unwrap();
        let output = Command::new("node")
            .args(server_arguments(
                &resources,
                &library,
                "1.0.0-beta.1",
                "5376",
            ))
            .env_remove("NODE_OPTIONS")
            .output()
            .unwrap();
        fs::remove_dir_all(scratch).unwrap();
        assert!(
            output.status.success(),
            "Node entrypoint failed: {}",
            String::from_utf8_lossy(&output.stderr)
        );
        assert_eq!(
            String::from_utf8_lossy(&output.stdout).trim(),
            "HYPER_CHAMBER_NODE_PATH_PASSED"
        );
    }

    #[test]
    fn readiness_is_restricted_to_loopback_and_valid_port() {
        assert_eq!(
            ready_url("HYPER_CHAMBER_READY {\"port\":5390,\"url\":\"https://other.test\"}")
                .unwrap(),
            "http://127.0.0.1:5390"
        );
        assert!(ready_url("HYPER_CHAMBER_READY {\"port\":0}").is_err());
        assert!(ready_url("HYPER_CHAMBER_READY {\"port\":65536}").is_err());
        assert!(ready_url("not-ready").is_err());
    }

    #[test]
    fn native_commands_only_trust_the_owned_server_origin() {
        let base = "http://127.0.0.1:5390";
        assert!(is_app_origin(
            &tauri::Url::parse("http://127.0.0.1:5390/?entry=abc").unwrap(),
            base
        ));
        for url in [
            "http://127.0.0.1:5391/",
            "http://localhost:5390/",
            "https://127.0.0.1:5390/",
            "http://user@127.0.0.1:5390/",
            "https://example.com/",
        ] {
            assert!(!is_app_origin(&tauri::Url::parse(url).unwrap(), base));
        }
    }

    #[test]
    fn generated_host_tokens_are_random_and_fixed_length() {
        let first = secret().unwrap();
        assert_eq!(first.len(), 64);
        assert!(first.bytes().all(|value| value.is_ascii_hexdigit()));
        assert_ne!(first, secret().unwrap());
    }
}
