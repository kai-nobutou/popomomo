// 音声ファイルのパス
const SOUND_URLS = {
  timerComplete: '/sounds/timer-complete.mp3',
  breakComplete: '/sounds/break-complete.mp3'
};

export class SoundService {
  private static instance: SoundService;
  private audio: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  private constructor() {
    // 設定から音声の有効/無効を読み込み
    const savedEnabled = localStorage.getItem('popomomo-sound-enabled');
    this.enabled = savedEnabled !== 'false';
  }

  static getInstance(): SoundService {
    if (!SoundService.instance) {
      SoundService.instance = new SoundService();
    }
    return SoundService.instance;
  }

  async playSound(type: 'focus' | 'short-break' | 'pomodoro-plan' | 'stopwatch') {
    if (!this.enabled) return;

    try {
      // モードによって異なる音を再生
      const soundUrl = type === 'short-break' ? SOUND_URLS.breakComplete : SOUND_URLS.timerComplete;
      
      // Web Audio APIを使用
      this.audio = new Audio(soundUrl);
      this.audio.volume = 0.7;
      await this.audio.play();
    } catch (error) {
      console.error('音声再生エラー:', error);
      // 代替案：システム音を使用
      this.playSystemSound();
    }
  }

  private playSystemSound() {
    // macOSのシステム音を再生（ブラウザAPIの制限により、実際の音は出ない場合がある）
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // ビープ音の設定
    oscillator.frequency.value = 800; // 周波数
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('popomomo-sound-enabled', enabled.toString());
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // ボリューム調整
  setVolume(volume: number) {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }
}