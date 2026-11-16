#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    if let Some(code) = hyper_chamber_desktop::run_pack_cli() {
        std::process::exit(code);
    }
    hyper_chamber_desktop::run();
}
