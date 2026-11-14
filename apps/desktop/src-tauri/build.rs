fn main() {
    // `cargo check/test` must also work in a clean checkout before resource preparation.
    // Running or packaging the app still requires the complete resources from prepare.mjs.
    let resources = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../build/resources");
    std::fs::create_dir_all(resources).expect("The desktop build directory could not be created");
    let target_os = std::env::var("CARGO_CFG_TARGET_OS");
    let target_env = std::env::var("CARGO_CFG_TARGET_ENV");
    if target_os.as_deref() == Ok("windows") && target_env.as_deref() == Ok("msvc") {
        // Include Common Controls v6 in test executables as well as the app.
        // https://github.com/tauri-apps/tauri/issues/13419
        let manifest =
            std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("windows-app-manifest.xml");
        println!("cargo:rerun-if-changed={}", manifest.display());
        println!("cargo:rustc-link-arg=/MANIFEST:EMBED");
        println!("cargo:rustc-link-arg=/MANIFESTINPUT:{}", manifest.display());
        let attributes = tauri_build::Attributes::new()
            .windows_attributes(tauri_build::WindowsAttributes::new_without_app_manifest());
        tauri_build::try_build(attributes).expect("The desktop build could not be prepared");
    } else {
        tauri_build::build();
    }
}
