use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{TrayIconBuilder, TrayIconEvent, TrayIcon, MouseButton, MouseButtonState},
    Manager, Runtime, State, AppHandle,
};
use std::sync::{Arc, Mutex};

#[derive(Default)]
struct TrayState {
    tray_icon: Option<TrayIcon<tauri::Wry>>,
}

type TrayStateType = Arc<Mutex<TrayState>>;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn update_tray_title(app: AppHandle, title: String, tray_state: State<TrayStateType>) -> Result<(), String> {
    let mut state = tray_state.lock().map_err(|e| e.to_string())?;
    
    if let Some(tray) = &state.tray_icon {
        // まず既存のトレイでタイトルを更新してみる
        if let Err(_) = tray.set_title(Some(&title)) {
            
            // 失敗した場合は再作成
            let show_i = MenuItem::with_id(&app, "show", "Show", true, None::<&str>).unwrap();
            let hide_i = MenuItem::with_id(&app, "hide", "Hide", true, None::<&str>).unwrap();
            let quit_i = MenuItem::with_id(&app, "quit", "Quit", true, None::<&str>).unwrap();
            let separator = PredefinedMenuItem::separator(&app).unwrap();
            
            let menu = Menu::with_items(&app, &[&show_i, &hide_i, &separator, &quit_i]).unwrap();
            
            // 古いトレイを削除
            if let Some(old_tray) = state.tray_icon.take() {
                drop(old_tray);
            }
            
            // 新しいトレイを作成（アイコンなし）
            let new_tray = TrayIconBuilder::with_id("main-tray")
                .title(&title)  // タイトルを設定
                .tooltip(&title)
                .menu(&menu)
                .on_tray_icon_event(handle_tray_event)
                .build(&app)
                .map_err(|e| e.to_string())?;
                
            state.tray_icon = Some(new_tray);
        }
    }
    
    Ok(())
}

fn handle_tray_event<R: Runtime>(_tray: &TrayIcon<R>, event: TrayIconEvent) {
    match event {
        TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
            ..
        } => {
            if let Some(app) = _tray.app_handle().get_webview_window("main") {
                let _ = app.show();
                let _ = app.set_focus();
            }
        }
        TrayIconEvent::Click {
            button: MouseButton::Right,
            button_state: MouseButtonState::Up,
            ..
        } => {
            println!("Right click on tray");
        }
        _ => {}
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tray_state: TrayStateType = Arc::new(Mutex::new(TrayState::default()));
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .manage(tray_state.clone())
        .setup(move |app| {
            // macOSでDockアイコンを表示する（通常のアプリとして動作）
            // 本番ビルド時のみメニューバー専用にしたい場合は、以下のコメントを外す
            // #[cfg(target_os = "macos")]
            // app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &PredefinedMenuItem::separator(app)?, &quit_i])?;

            // macOSではタイトルのみでOK
            #[cfg(target_os = "macos")]
            let tray = TrayIconBuilder::with_id("main-tray")
                .title("● 25:00")  // 初期タイトル
                .tooltip("Popomomo Timer")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(handle_tray_event)
                .build(app)?;
                
            // macOS以外ではアイコンが必要
            #[cfg(not(target_os = "macos"))]
            let tray = TrayIconBuilder::with_id("main-tray")
                .title("● 25:00")
                .tooltip("Popomomo Timer")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_tray_icon_event(handle_tray_event)
                .build(app)?;

            // トレイアイコンを状態に保存
            let mut state = tray_state.lock().unwrap();
            state.tray_icon = Some(tray);

            Ok(())
        })
        .on_window_event(|window, event| {
            // ウィンドウを閉じてもアプリを終了しない（隠すだけ）
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .on_menu_event(|app, event| match event.id.as_ref() {
            "quit" => {
                app.exit(0);
            }
            "show" => {
                let window = app.get_webview_window("main").unwrap();
                let _ = window.show();
                let _ = window.set_focus();
            }
            "hide" => {
                let window = app.get_webview_window("main").unwrap();
                let _ = window.hide();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet, update_tray_title])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
