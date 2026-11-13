fn main() {
    // `cargo check/test` must also work in a clean checkout before resource preparation.
    // Running or packaging the app still requires the complete resources from prepare.mjs.
    let resources = std::path::Path::new(env!("CARGO_MANIFEST_DIR")).join("../build/resources");
    std::fs::create_dir_all(resources).expect("The desktop build directory could not be created");
    tauri_build::build();
}
