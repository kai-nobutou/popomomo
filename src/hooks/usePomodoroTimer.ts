import { useState, useEffect } from 'react';
import { WorkMode, WorkLog, PomodoroPlan, PomodoroStep, Category } from '../types';
import { 
  initDatabase, 
  getCategories, 
  addCategory as dbAddCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  getWorkLogs,
  addWorkLog as dbAddWorkLog,
  deleteWorkLog as dbDeleteWorkLog,
  getPomodoroPlan,
  addPomodoroPlan as dbAddPomodoroPlan,
  deletePomodoroPlan as dbDeletePomodoroPlan,
  getSetting,
  setSetting,
  migrateFromLocalStorage
} from '../services/database';
import { updateTrayTitle, formatTimerForTray } from '../services/tray';
import { SoundService } from '../services/sound';

export const usePomodoroTimer = () => {
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentMode, setCurrentMode] = useState<WorkMode>('focus');
  const [currentTask, setCurrentTask] = useState('');
  const [category, setCategory] = useState('');
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [focusDuration, setFocusDuration] = useState(25);
  const [shortBreakDuration, setShortBreakDuration] = useState(5);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pomodoroPlans, setPomodoroPlans] = useState<PomodoroPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PomodoroPlan | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanSteps, setNewPlanSteps] = useState<PomodoroStep[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const soundService = SoundService.getInstance();

  // データベースからデータを読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        // データベース初期化
        await initDatabase();
        
        // LocalStorageからの移行
        await migrateFromLocalStorage();
        
        // カテゴリ読み込み
        const dbCategories = await getCategories();
        setCategories(dbCategories);
        
        // 初回読み込み時にデフォルトカテゴリを設定
        if (dbCategories.length > 0 && !category) {
          const defaultCategory = dbCategories.find(cat => cat.name === '実装') || dbCategories[0];
          setCategory(defaultCategory.name);
        }
        
        // 作業ログ読み込み
        const dbLogs = await getWorkLogs();
        const logs = dbLogs.map(log => ({
          id: log.id,
          category: dbCategories.find(c => c.id === log.category_id)?.name || 'その他',
          task: log.task,
          mode: log.mode as WorkMode,
          duration: log.duration,
          completed: log.completed,
          timestamp: new Date(log.timestamp)
        }));
        setWorkLogs(logs);
        
        // ポモドーロプラン読み込み
        const dbPlans = await getPomodoroPlan();
        const plans = dbPlans.map(plan => ({
          id: plan.id,
          name: plan.name,
          steps: JSON.parse(plan.steps)
        }));
        setPomodoroPlans(plans);
        
        // テーマ設定読み込み
        const theme = await getSetting('theme');
        setIsDarkMode(theme !== 'light');
      } catch (error) {
        console.error('データベース読み込みエラー:', error);
        // フォールバック: LocalStorageから読み込み
        const savedLogs = localStorage.getItem('popomomo-logs');
        if (savedLogs) {
          const logs = JSON.parse(savedLogs);
          setWorkLogs(logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          })));
        }
        
        const savedTheme = localStorage.getItem('popomomo-theme');
        setIsDarkMode(savedTheme !== 'light');

        const savedPlans = localStorage.getItem('popomomo-plans');
        if (savedPlans) {
          setPomodoroPlans(JSON.parse(savedPlans));
        }
      }
    };
    
    loadData();
  }, []);

  // トレイタイトルの更新
  useEffect(() => {
    const planInfo = currentPlan ? {
      name: currentPlan.name,
      step: currentStepIndex + 1,
      total: currentPlan.steps.length
    } : undefined;
    
    const trayTitle = formatTimerForTray(
      time, 
      currentMode, 
      isRunning, 
      currentTask,
      planInfo
    );
    updateTrayTitle(trayTitle);
  }, [time, currentMode, isRunning, currentTask, currentPlan, currentStepIndex]);

  // テーマ切り替え
  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await setSetting('theme', newMode ? 'dark' : 'light');
    } catch (error) {
      // フォールバック: LocalStorageに保存
      localStorage.setItem('popomomo-theme', newMode ? 'dark' : 'light');
    }
  };

  // タイマーロジック
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        if (currentMode === 'stopwatch') {
          setElapsedTime(prev => prev + 1);
          setTime(prev => prev + 1);
        } else {
          setTime(time => {
            if (time <= 0) {
              setIsRunning(false);
              handleTimerComplete();
              return 0;
            }
            return time - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentMode]);

  // タイマー完了処理
  const handleTimerComplete = async () => {
    if (startTime && currentMode !== 'stopwatch') {
      const duration = currentMode === 'pomodoro-plan' && currentPlan
        ? currentPlan.steps[currentStepIndex].duration
        : getDurationForMode(currentMode);
        
      const log: WorkLog = {
        id: Date.now().toString(),
        category,
        task: currentTask || '無題のタスク',
        mode: currentMode,
        duration: duration,
        completed: true,
        timestamp: startTime
      };
      
      const newLogs = [...workLogs, log];
      setWorkLogs(newLogs);
      try {
        await dbAddWorkLog(log);
      } catch (error) {
        // フォールバック: LocalStorageに保存
        localStorage.setItem('popomomo-logs', JSON.stringify(newLogs));
      }
      
      if (currentMode === 'pomodoro-plan' && currentPlan) {
        const currentStep = currentPlan.steps[currentStepIndex];
        showNotification(`${currentStep.label}が終了しました！`);
        soundService.playSound(currentStep.type === 'long-break' ? 'short-break' : currentStep.type);
        
        setTimeout(() => {
          nextStep();
        }, 1000);
      } else {
        showNotification(`${getModeLabel(currentMode)}時間が終了しました！`);
        soundService.playSound(currentMode);
      }
      
      setStartTime(null);
    }
  };

  // 通知表示
  const showNotification = (message: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Popomomo Timer', {
          body: message,
          icon: '/icon.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Popomomo Timer', {
              body: message,
              icon: '/icon.png'
            });
          }
        });
      }
    }
  };

  // ヘルパー関数
  const getDurationForMode = (mode: WorkMode): number => {
    switch (mode) {
      case 'focus': return focusDuration * 60;
      case 'short-break': return shortBreakDuration * 60;
      default: return 0;
    }
  };

  const getModeLabel = (mode: WorkMode): string => {
    switch (mode) {
      case 'focus': return '集中';
      case 'short-break': return '休憩';
      case 'stopwatch': return 'タイマー';
      case 'pomodoro-plan': return 'ポロモード';
      default: return '';
    }
  };

  // タイマー操作
  const handleStart = () => {
    setIsRunning(true);
    setStartTime(new Date());
  };

  const handleStop = async () => {
    setIsRunning(false);
    
    if (startTime) {
      const duration = currentMode === 'stopwatch' 
        ? elapsedTime 
        : getDurationForMode(currentMode) - time;
      
      const log: WorkLog = {
        id: Date.now().toString(),
        category,
        task: currentTask || '無題のタスク',
        mode: currentMode,
        duration: duration,
        completed: false,
        timestamp: startTime
      };
      
      const newLogs = [...workLogs, log];
      setWorkLogs(newLogs);
      try {
        await dbAddWorkLog(log);
      } catch (error) {
        // フォールバック: LocalStorageに保存
        localStorage.setItem('popomomo-logs', JSON.stringify(newLogs));
      }
      setStartTime(null);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    if (currentMode === 'stopwatch') {
      setTime(0);
      setElapsedTime(0);
    } else if (currentMode === 'pomodoro-plan' && currentPlan) {
      setTime(currentPlan.steps[currentStepIndex].duration);
    } else {
      setTime(getDurationForMode(currentMode));
    }
    setStartTime(null);
  };

  // モード変更
  const handleModeChange = (mode: WorkMode) => {
    setCurrentMode(mode);
    setIsRunning(false);
    
    if (mode === 'stopwatch') {
      setTime(0);
      setElapsedTime(0);
    } else if (mode === 'pomodoro-plan') {
      setTime(0);
      setCurrentPlan(null);
      setCurrentStepIndex(0);
    } else {
      setTime(getDurationForMode(mode));
    }
  };

  // 時間設定変更
  const handleDurationChange = (mode: 'focus' | 'short-break', value: number) => {
    if (mode === 'focus') {
      setFocusDuration(value);
      if (currentMode === 'focus' && !isRunning) {
        setTime(value * 60);
      }
    } else {
      setShortBreakDuration(value);
      if (currentMode === 'short-break' && !isRunning) {
        setTime(value * 60);
      }
    }
  };

  // ポモドーロプラン機能
  const createDefaultPlan = (): PomodoroPlan => {
    return {
      id: Date.now().toString(),
      name: 'クラシックポモドーロ',
      steps: [
        { id: '1', type: 'focus', duration: 25 * 60, label: '集中1' },
        { id: '2', type: 'short-break', duration: 5 * 60, label: '休憩1' },
        { id: '3', type: 'focus', duration: 25 * 60, label: '集中2' },
        { id: '4', type: 'short-break', duration: 5 * 60, label: '休憩2' },
        { id: '5', type: 'focus', duration: 25 * 60, label: '集中3' },
        { id: '6', type: 'short-break', duration: 5 * 60, label: '休憩3' },
        { id: '7', type: 'focus', duration: 25 * 60, label: '集中4' },
        { id: '8', type: 'short-break', duration: 15 * 60, label: '長い休憩' }
      ]
    };
  };

  const startPlan = (plan: PomodoroPlan) => {
    setCurrentPlan(plan);
    setCurrentStepIndex(0);
    setTime(plan.steps[0].duration);
    setCurrentMode('pomodoro-plan');
  };

  const nextStep = () => {
    if (!currentPlan) return;
    
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < currentPlan.steps.length) {
      setCurrentStepIndex(nextIndex);
      setTime(currentPlan.steps[nextIndex].duration);
    } else {
      setCurrentPlan(null);
      setCurrentStepIndex(0);
      setCurrentMode('focus');
      setTime(focusDuration * 60);
      showNotification('ポモドーロプランが完了しました！');
    }
  };

  // プラン編集機能
  const addNewStep = () => {
    const newStep: PomodoroStep = {
      id: Date.now().toString(),
      type: 'focus',
      duration: 25 * 60,
      label: `ステップ ${newPlanSteps.length + 1}`
    };
    setNewPlanSteps([...newPlanSteps, newStep]);
  };

  const updateStep = (stepId: string, field: keyof PomodoroStep, value: any) => {
    setNewPlanSteps(steps => 
      steps.map(step => 
        step.id === stepId ? { ...step, [field]: value } : step
      )
    );
  };

  const removeStep = (stepId: string) => {
    setNewPlanSteps(steps => steps.filter(step => step.id !== stepId));
  };

  const savePlan = async () => {
    if (!newPlanName.trim() || newPlanSteps.length === 0) return;
    
    const plan: PomodoroPlan = {
      id: Date.now().toString(),
      name: newPlanName,
      steps: newPlanSteps
    };
    
    const updatedPlans = [...pomodoroPlans, plan];
    setPomodoroPlans(updatedPlans);
    
    try {
      await dbAddPomodoroPlan(plan);
    } catch (error) {
      // フォールバック: LocalStorageに保存
      localStorage.setItem('popomodo-plans', JSON.stringify(updatedPlans));
    }
    
    setNewPlanName('');
    setNewPlanSteps([]);
    setShowPlanEditor(false);
  };

  const deletePlan = async (planId: string) => {
    const updatedPlans = pomodoroPlans.filter(p => p.id !== planId);
    setPomodoroPlans(updatedPlans);
    
    try {
      await dbDeletePomodoroPlan(planId);
    } catch (error) {
      // フォールバック: LocalStorageに保存
      localStorage.setItem('popomomo-plans', JSON.stringify(updatedPlans));
    }
  };

  // ログ機能
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else if (mins > 0) {
      return `${mins}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTotalTime = () => {
    return workLogs.reduce((total, log) => total + log.duration, 0);
  };

  const exportToCSV = () => {
    if (workLogs.length === 0) return;

    const headers = ['日時', 'カテゴリ', '作業内容', 'モード', '時間(秒)', '時間(フォーマット)', 'ステータス'];
    const csvData = workLogs.map(log => [
      log.timestamp.toLocaleString('ja-JP'),
      log.category,
      log.task,
      getModeLabel(log.mode),
      log.duration,
      formatDuration(log.duration),
      log.completed ? '完了' : '中断'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `popomomo-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // カテゴリ管理
  const addCategory = async (name: string) => {
    try {
      await dbAddCategory(name);
      
      // 少し待ってからカテゴリを再読み込み
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
      
      // 現在のカテゴリが有効でない場合、新しく追加されたカテゴリを選択
      if (!updatedCategories.find(cat => cat.name === category)) {
        const newCategory = updatedCategories.find(cat => cat.name === name);
        if (newCategory) {
          setCategory(newCategory.name);
        } else if (updatedCategories.length > 0) {
          setCategory(updatedCategories[0].name);
        }
      }
    } catch (error) {
      console.error('カテゴリ追加エラー:', error);
    }
  };

  const updateCategory = async (id: number, name: string) => {
    try {
      await dbUpdateCategory(id, name);
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
      
      // 作業ログの表示も更新
      const dbLogs = await getWorkLogs();
      const logs = dbLogs.map(log => ({
        id: log.id,
        category: updatedCategories.find(c => c.id === log.category_id)?.name || 'その他',
        task: log.task,
        mode: log.mode as WorkMode,
        duration: log.duration,
        completed: log.completed,
        timestamp: new Date(log.timestamp)
      }));
      setWorkLogs(logs);
    } catch (error) {
      console.error('カテゴリ更新エラー:', error);
    }
  };

  const deleteCategory = async (id: number) => {
    try {
      await dbDeleteCategory(id);
      const updatedCategories = await getCategories();
      setCategories(updatedCategories);
      
      // 作業ログの表示も更新
      const dbLogs = await getWorkLogs();
      const logs = dbLogs.map(log => ({
        id: log.id,
        category: updatedCategories.find(c => c.id === log.category_id)?.name || 'その他',
        task: log.task,
        mode: log.mode as WorkMode,
        duration: log.duration,
        completed: log.completed,
        timestamp: new Date(log.timestamp)
      }));
      setWorkLogs(logs);
    } catch (error) {
      console.error('カテゴリ削除エラー:', error);
    }
  };

  // ログ削除
  const deleteLog = async (id: string) => {
    try {
      await dbDeleteWorkLog(id);
      setWorkLogs(prev => prev.filter(log => log.id !== id));
    } catch (error) {
      console.error('ログ削除エラー:', error);
    }
  };

  return {
    // State
    time,
    isRunning,
    currentMode,
    currentTask,
    category,
    workLogs,
    showLogs,
    isDarkMode,
    focusDuration,
    shortBreakDuration,
    elapsedTime,
    pomodoroPlans,
    currentPlan,
    currentStepIndex,
    showPlanEditor,
    newPlanName,
    newPlanSteps,
    categories,
    showCategoryManager,
    showAnalytics,

    // Setters
    setCurrentTask,
    setCategory,
    setShowLogs,
    setShowPlanEditor,
    setNewPlanName,
    setNewPlanSteps,
    setShowCategoryManager,
    setShowAnalytics,

    // Actions
    toggleTheme,
    handleStart,
    handleStop,
    handleReset,
    handleModeChange,
    handleDurationChange,
    createDefaultPlan,
    startPlan,
    addNewStep,
    updateStep,
    removeStep,
    savePlan,
    deletePlan,
    formatDuration,
    getTotalTime,
    exportToCSV,
    addCategory,
    updateCategory,
    deleteCategory,
    deleteLog
  };
};