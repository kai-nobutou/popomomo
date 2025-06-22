export async function updateTrayTitle(title: string): Promise<void> {
  try {
    // Tauriが利用可能かチェック
    if (typeof window !== 'undefined' && (window as any).__TAURI__) {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('update_tray_title', { title });
    } else {
      // ブラウザ環境ではタイトルに表示
      document.title = `Popomomo - ${title}`;
    }
  } catch (error) {
    console.warn('Tray update not available:', error);
    // フォールバック: ブラウザタイトルに表示
    if (typeof document !== 'undefined') {
      document.title = `Popomomo - ${title}`;
    }
  }
}

export function formatTimerForTray(
  time: number, 
  mode: string, 
  isRunning: boolean,
  _currentTask?: string,
  planInfo?: { name: string; step: number; total: number }
): string {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // メニューバー用のシンプルな表示
  // モードのアイコンのみ（文字を省略してスペース節約）
  const modeIcons: Record<string, string> = {
    'focus': '●',
    'short-break': '⏸',
    'stopwatch': '⏱',
    'pomodoro-plan': '📋'
  };
  
  const modeIcon = modeIcons[mode] || '⏱';
  const statusIcon = isRunning ? '▶' : '⏸';
  
  // 基本フォーマット: アイコン + 時間
  let result = `${modeIcon} ${timeStr}`;
  
  // 実行中のみステータスアイコンを追加
  if (isRunning) {
    result = `${statusIcon} ${result}`;
  }
  
  // ポロモードの場合のみステップ情報を追加
  if (planInfo && mode === 'pomodoro-plan') {
    result += ` ${planInfo.step}/${planInfo.total}`;
  }
  
  return result;
}