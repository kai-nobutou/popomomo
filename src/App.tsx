import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { 
  Box, 
  Container, 
  Typography, 
  IconButton, 
  Card,
  Stack,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip
} from "@mui/material";
import { motion } from "framer-motion";
import {
  DarkMode,
  LightMode,
  Speed,
  PlaylistPlay,
  Keyboard,
  Settings,
  Circle,
  Pause,
  Analytics
} from "@mui/icons-material";
import { TimerDisplay } from "./components/TimerDisplay";
import { PomodoroPlans } from "./components/PomodoroPlans";
import { WorkLogs } from "./components/WorkLogs";
import { PlanEditorDialog } from "./components/PlanEditorDialog";
import { CategoryManager } from "./components/CategoryManager";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { usePomodoroTimer } from "./hooks/usePomodoroTimer";
import { WorkMode, WorkModeConfig } from "./types";
import "./App.css";

const WORK_MODES: Record<WorkMode, WorkModeConfig> = {
  focus: { 
    label: '集中', 
    duration: 25 * 60, 
    emoji: '●', 
    icon: <Circle />,
    color: '#ff6b6b',
    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%)'
  },
  'short-break': { 
    label: '休憩', 
    duration: 5 * 60, 
    emoji: '⏸', 
    icon: <Pause />,
    color: '#4ecdc4',
    gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a3aa 100%)'
  },
  'stopwatch': {
    label: 'タイマー',
    duration: 0,
    emoji: '⏱️',
    icon: <Speed />,
    color: '#9c88ff',
    gradient: 'linear-gradient(135deg, #9c88ff 0%, #c7a3ff 100%)'
  },
  'pomodoro-plan': {
    label: 'ポロモード',
    duration: 0,
    emoji: '📋',
    icon: <PlaylistPlay />,
    color: '#48cae4',
    gradient: 'linear-gradient(135deg, #48cae4 0%, #0077b6 100%)'
  }
};

function App() {
  const {
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
  } = usePomodoroTimer();

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#646cff',
      },
      secondary: {
        main: '#ff6b6b',
      },
      background: {
        default: isDarkMode ? '#0a0a0a' : '#f0f0f0',
        paper: isDarkMode ? '#141414' : '#ffffff',
      }
    },
    typography: {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
              : '0 8px 32px rgba(0, 0, 0, 0.08)',
          },
        },
      },
    },
  });


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh', 
        background: isDarkMode 
          ? 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 100%)' 
          : 'radial-gradient(ellipse at top, #f0f0f0 0%, #d0d0d0 100%)',
        py: 3 
      }}>
        <Container maxWidth="xl">
          {/* ヘッダー */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 900,
                  fontSize: { xs: '2rem', md: '3rem' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.03em'
                }}
              >
                Popomomo
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="分析・統計">
                  <IconButton onClick={() => setShowAnalytics(true)} size="large">
                    <Analytics />
                  </IconButton>
                </Tooltip>
                <Tooltip title="カテゴリ管理">
                  <IconButton onClick={() => setShowCategoryManager(true)} size="large">
                    <Settings />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isDarkMode ? "ライトモード" : "ダークモード"}>
                  <IconButton onClick={toggleTheme} size="large">
                    {isDarkMode ? <LightMode /> : <DarkMode />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          </motion.div>

          <Grid container spacing={3} justifyContent="center">
            {/* メインタイマーエリア */}
            <Grid item xs={12} md={9}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card
                  sx={{ 
                    p: 4, 
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)' 
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                    position: 'relative',
                    maxWidth: '700px',
                    mx: 'auto'
                  }}
                >
                  {/* モード切り替えバー */}
                  <Box sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: WORK_MODES[currentMode].gradient
                  }} />

                  {/* モード選択 */}
                  <ToggleButtonGroup
                    value={currentMode}
                    exclusive
                    onChange={(_, mode) => mode && handleModeChange(mode)}
                    sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}
                  >
                    {(Object.keys(WORK_MODES) as WorkMode[]).map(mode => (
                      <ToggleButton 
                        key={mode} 
                        value={mode}
                        sx={{
                          px: 3,
                          py: 1.5,
                          borderRadius: 2,
                          mx: 0.5,
                          border: 'none',
                          background: currentMode === mode ? WORK_MODES[mode].gradient : 'transparent',
                          color: currentMode === mode ? 'white' : 'inherit',
                          '&:hover': {
                            background: currentMode === mode 
                              ? WORK_MODES[mode].gradient
                              : isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                          }
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          {WORK_MODES[mode].icon}
                          <Typography fontWeight={600}>{WORK_MODES[mode].label}</Typography>
                        </Stack>
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>

                  {/* タイマー表示 */}
                  <TimerDisplay
                    time={time}
                    currentMode={currentMode}
                    workModes={WORK_MODES}
                    isRunning={isRunning}
                    isDarkMode={isDarkMode}
                    focusDuration={focusDuration}
                    shortBreakDuration={shortBreakDuration}
                    currentPlan={currentPlan}
                    currentStepIndex={currentStepIndex}
                    onStart={handleStart}
                    onStop={handleStop}
                    onReset={handleReset}
                    onDurationChange={handleDurationChange}
                  />

                  {/* ポモドーロプラン */}
                  {currentMode === 'pomodoro-plan' && (
                    <Box sx={{ mt: 4, px: 2 }}>
                      <PomodoroPlans
                        currentPlan={currentPlan}
                        currentStepIndex={currentStepIndex}
                        pomodoroPlans={pomodoroPlans}
                        workModes={WORK_MODES}
                        isDarkMode={isDarkMode}
                        onStartPlan={startPlan}
                        onDeletePlan={deletePlan}
                        onCreateDefaultPlan={createDefaultPlan}
                        onShowPlanEditor={() => {
                          setShowPlanEditor(true);
                          if (newPlanSteps.length === 0) {
                            addNewStep();
                          }
                        }}
                      />
                    </Box>
                  )}
                </Card>
              </motion.div>

              {/* 作業入力エリア */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card
                  sx={{ 
                    mt: 3,
                    p: 3,
                    background: isDarkMode 
                      ? 'rgba(255, 255, 255, 0.03)' 
                      : 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    maxWidth: '700px',
                    mx: 'auto'
                  }}
                >
                  <Stack spacing={3}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>カテゴリ</InputLabel>
                      <Select
                        value={categories.find(cat => cat.name === category) ? category : ''}
                        onChange={(e) => setCategory(e.target.value)}
                        label="カテゴリ"
                      >
                        {categories.map(cat => (
                          <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      variant="outlined"
                      label="作業内容"
                      value={currentTask}
                      onChange={(e) => setCurrentTask(e.target.value)}
                      placeholder="今やっている作業を入力..."
                      multiline
                      rows={2}
                      slotProps={{
                        input: {
                          sx: {
                            borderRadius: 2
                          }
                        }
                      }}
                    />
                  </Stack>
                </Card>
              </motion.div>
            </Grid>

            {/* 作業ログエリア */}
            <Grid item xs={12} md={3}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <WorkLogs
                  workLogs={workLogs}
                  showLogs={showLogs}
                  workModes={WORK_MODES}
                  isDarkMode={isDarkMode}
                  onToggleLogs={() => setShowLogs(!showLogs)}
                  onExportCSV={exportToCSV}
                  onDeleteLog={deleteLog}
                  formatDuration={formatDuration}
                  getTotalTime={getTotalTime}
                />
              </motion.div>

              {/* キーボードショートカット */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Chip 
                    icon={<Keyboard />}
                    label="⌘+Enter (開始) / Esc (停止)" 
                    variant="outlined"
                    sx={{ 
                      borderRadius: 2,
                      px: 2,
                      py: 2.5,
                      fontSize: '0.875rem',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>

        {/* プラン作成ダイアログ */}
        <PlanEditorDialog
          open={showPlanEditor}
          planName={newPlanName}
          planSteps={newPlanSteps}
          onClose={() => setShowPlanEditor(false)}
          onPlanNameChange={setNewPlanName}
          onAddStep={addNewStep}
          onUpdateStep={updateStep}
          onRemoveStep={removeStep}
          onSave={savePlan}
        />

        {/* カテゴリ管理ダイアログ */}
        <CategoryManager
          open={showCategoryManager}
          categories={categories}
          onClose={() => setShowCategoryManager(false)}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
        />

        {/* 分析ダッシュボード */}
        <AnalyticsDashboard
          open={showAnalytics}
          workLogs={workLogs}
          workModes={WORK_MODES}
          isDarkMode={isDarkMode}
          onClose={() => setShowAnalytics(false)}
          formatDuration={formatDuration}
        />
      </Box>
    </ThemeProvider>
  );
}

export default App;