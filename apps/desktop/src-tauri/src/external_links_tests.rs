use serde::Deserialize;
use serde_json::Value;
use tauri::{test::mock_builder, WebviewUrl, WebviewWindowBuilder};

#[derive(Debug, Deserialize)]
struct UrlRule {
    url: String,
    app: Option<Value>,
}

impl UrlRule {
    // Opener scopes use glob URLs; omitting `app` permits only the default OS app.
    fn matches(&self, url: &str, app: Option<&str>) -> bool {
        let app_allowed = match self.app.as_ref() {
            None | Some(Value::Null) => app.is_none(),
            Some(Value::Bool(enabled)) => *enabled,
            Some(Value::String(program)) => app == Some(program.as_str()),
            _ => false,
        };
        app_allowed && glob::Pattern::new(&self.url).unwrap().matches(url)
    }
}

#[test]
fn compiled_acl_opens_only_web_urls_in_the_default_app() {
    // Use the production generated context, including build-resolved capabilities,
    // without starting the backend, a native window, or an external application.
    let app = mock_builder()
        .build(tauri::generate_context!(test = true))
        .unwrap();
    let webview = WebviewWindowBuilder::new(
        &app,
        "main",
        WebviewUrl::External("http://127.0.0.1:48239/guides".parse().unwrap()),
    )
    .build()
    .unwrap();
    let scope = webview
        .resolve_command_scope::<UrlRule>("opener", "open_url")
        .unwrap()
        .expect("the app-owned native window must be permitted to open web links");
    let allows = |url, app| {
        let command = scope.command_scope();
        let global = scope.global_scope();
        !command
            .denies()
            .iter()
            .chain(global.denies())
            .any(|rule| rule.matches(url, app))
            && command
                .allows()
                .iter()
                .chain(global.allows())
                .any(|rule| rule.matches(url, app))
    };

    for url in [
        "https://example.com/guides?character=juri#setup",
        "http://192.168.1.20:48239/",
    ] {
        assert!(allows(url, None), "web link should open: {url}");
        assert!(
            !allows(url, Some("arbitrary-program")),
            "must use the default app: {url}"
        );
    }
    for url in [
        "file:///tmp/private.txt",
        "javascript:alert(1)",
        "data:text/html,example",
        "mailto:person@example.com",
        "tel:+15555555555",
        "custom-protocol:example",
    ] {
        assert!(!allows(url, None), "non-web URL must be denied: {url}");
    }
    for command in ["open_path", "reveal_item_in_dir"] {
        assert!(
            webview
                .resolve_command_scope::<Value>("opener", command)
                .unwrap()
                .is_none(),
            "external links must not grant filesystem command {command}"
        );
    }
}
