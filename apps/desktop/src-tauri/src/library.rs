use serde::{Deserialize, Serialize};
use std::{
    fs::{self, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Settings {
    library_dir: PathBuf,
}

pub fn selected_library(
    config_dir: &Path,
    default_dir: PathBuf,
    environment_override: Option<PathBuf>,
) -> Result<PathBuf, String> {
    if let Some(path) = environment_override {
        return Ok(path);
    }
    let path = config_dir.join("settings.json");
    let bytes = match fs::read(&path) {
        Ok(bytes) => bytes,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(default_dir),
        Err(error) => {
            return Err(format!(
                "The saved library choice could not be read: {error}"
            ))
        }
    };
    let settings: Settings = serde_json::from_slice(&bytes)
        .map_err(|_| format!("The library setting in {} is invalid. Restore or remove this settings file to use the default library.", path.display()))?;
    if !settings.library_dir.is_absolute() {
        return Err("The saved library folder must be an absolute path.".into());
    }
    Ok(settings.library_dir)
}

pub fn save_library(config_dir: &Path, library_dir: &Path) -> Result<(), String> {
    if !library_dir.is_absolute() || library_dir.to_str().is_none() {
        return Err("Choose a local folder with a supported absolute path.".into());
    }
    fs::create_dir_all(config_dir)
        .map_err(|error| format!("The application settings folder could not be opened: {error}"))?;
    let mut random = [0u8; 12];
    getrandom::fill(&mut random)
        .map_err(|_| "A temporary settings filename could not be created.")?;
    let suffix: String = random.iter().map(|byte| format!("{byte:02x}")).collect();
    let temporary = config_dir.join(format!("settings-{suffix}.tmp"));
    let result = (|| {
        let mut file = OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&temporary)
            .map_err(|error| format!("The library choice could not be saved: {error}"))?;
        let bytes = serde_json::to_vec_pretty(&Settings {
            library_dir: library_dir.to_path_buf(),
        })
        .map_err(|error| error.to_string())?;
        file.write_all(&bytes)
            .and_then(|()| file.sync_all())
            .map_err(|error| format!("The library choice could not be saved: {error}"))?;
        fs::rename(&temporary, config_dir.join("settings.json"))
            .map_err(|error| format!("The saved library choice could not be replaced: {error}"))?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(temporary);
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    fn scratch() -> PathBuf {
        let mut random = [0u8; 8];
        getrandom::fill(&mut random).unwrap();
        let id: String = random.iter().map(|byte| format!("{byte:02x}")).collect();
        let path = std::env::temp_dir().join(format!("hc-native-settings-{id}"));
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn choice_survives_restart_and_environment_override_wins() {
        let config = scratch();
        let default = config.join("default-library");
        let choice = config.join("portable-library");
        assert_eq!(
            selected_library(&config, default.clone(), None).unwrap(),
            default
        );
        save_library(&config, &choice).unwrap();
        assert_eq!(
            selected_library(&config, default.clone(), None).unwrap(),
            choice
        );
        assert_eq!(
            selected_library(&config, default, Some(config.join("override"))).unwrap(),
            config.join("override")
        );
        fs::remove_dir_all(config).unwrap();
    }

    #[test]
    fn corrupt_and_relative_settings_are_reported_without_overwriting_them() {
        let config = scratch();
        fs::write(config.join("settings.json"), "broken").unwrap();
        assert!(selected_library(&config, config.join("default"), None).is_err());
        fs::write(
            config.join("settings.json"),
            r#"{"libraryDir":"../outside"}"#,
        )
        .unwrap();
        assert!(selected_library(&config, config.join("default"), None).is_err());
        assert!(save_library(&config, Path::new("relative")).is_err());
        fs::remove_dir_all(config).unwrap();
    }
}
