export type WorkMode = 'focus' | 'short-break' | 'stopwatch' | 'pomodoro-plan';

export interface PomodoroStep {
  id: string;
  type: 'focus' | 'short-break' | 'long-break';
  duration: number;
  label: string;
}

export interface PomodoroPlan {
  id: string;
  name: string;
  steps: PomodoroStep[];
}

export interface WorkModeConfig {
  label: string;
  duration: number;
  emoji: string;
  icon: JSX.Element;
  color: string;
  gradient?: string;
}

export interface WorkLog {
  id: string;
  category: string;
  task: string;
  mode: WorkMode;
  duration: number;
  completed: boolean;
  timestamp: Date;
}

export interface Category {
  id: number;
  name: string;
  created_at?: string;
}