import { Box, Typography, LinearProgress, Stack, Tooltip, Fab, Zoom, Slider } from "@mui/material";
import { motion } from "framer-motion";
import { PlayArrow, Pause, Refresh, Timer, Coffee } from "@mui/icons-material";
import { WorkMode, WorkModeConfig, PomodoroPlan } from "../types";

interface TimerDisplayProps {
  time: number;
  currentMode: WorkMode;
  workModes: Record<WorkMode, WorkModeConfig>;
  isRunning: boolean;
  isDarkMode: boolean;
  focusDuration: number;
  shortBreakDuration: number;
  currentPlan: PomodoroPlan | null;
  currentStepIndex: number;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onDurationChange: (mode: 'focus' | 'short-break', value: number) => void;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  time,
  currentMode,
  workModes,
  isRunning,
  isDarkMode,
  focusDuration,
  shortBreakDuration,
  currentPlan,
  currentStepIndex,
  onStart,
  onStop,
  onReset,
  onDurationChange
}) => {
  const formatTime = (seconds: number): { minutes: string; seconds: string } => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: mins.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    };
  };

  const timeFormatted = formatTime(time);
  
  const progress = currentMode === 'stopwatch' 
    ? 0 
    : currentMode === 'pomodoro-plan' && currentPlan
    ? ((currentPlan.steps[currentStepIndex]?.duration - time) / currentPlan.steps[currentStepIndex]?.duration) * 100
    : ((workModes[currentMode].duration - time) / workModes[currentMode].duration) * 100;

  return (
    <Box>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Box sx={{ 
          display: 'inline-flex', 
          alignItems: 'baseline',
          gap: 1,
          fontSize: '8rem',
          fontWeight: 100,
          fontFamily: 'monospace',
          letterSpacing: '-0.05em',
          color: workModes[currentMode].color,
          textShadow: `0 0 60px ${workModes[currentMode].color}40`
        }}>
          <motion.span
            key={`minutes-${timeFormatted.minutes}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {timeFormatted.minutes}
          </motion.span>
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            :
          </motion.span>
          <motion.span
            key={`seconds-${timeFormatted.seconds}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {timeFormatted.seconds}
          </motion.span>
        </Box>
        <Typography 
          variant="h5" 
          sx={{ 
            opacity: 0.7,
            fontWeight: 500,
            mt: 2
          }}
        >
          {workModes[currentMode].label}
          {currentMode === 'stopwatch' && isRunning && '中...'}
        </Typography>
      </Box>

      {currentMode !== 'stopwatch' && currentMode !== 'pomodoro-plan' && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mb: 4, 
            height: 12, 
            borderRadius: 6,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
              background: workModes[currentMode].gradient,
              transition: 'transform 1s linear'
            }
          }} 
        />
      )}

      {currentMode === 'pomodoro-plan' && currentPlan && (
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            mb: 4, 
            height: 12, 
            borderRadius: 6,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 6,
              background: workModes[currentMode].gradient,
              transition: 'transform 1s linear'
            }
          }} 
        />
      )}

      <Stack direction="row" spacing={2} justifyContent="center">
        <Zoom in={!isRunning}>
          <Fab 
            variant="extended"
            onClick={onStart}
            disabled={isRunning}
            sx={{ 
              px: 3,
              py: 1.5,
              minWidth: '160px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: workModes[currentMode].gradient,
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: `0 8px 30px ${workModes[currentMode].color}40`
              },
              '& .MuiSvgIcon-root': {
                fontSize: '24px',
                mr: 1
              }
            }}
          >
            <PlayArrow />
            <Box component="span" sx={{ ml: 1 }}>スタート</Box>
          </Fab>
        </Zoom>
        <Zoom in={isRunning}>
          <Fab 
            variant="extended"
            onClick={onStop}
            disabled={!isRunning}
            sx={{ 
              px: 3,
              py: 1.5,
              minWidth: '160px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              background: 'linear-gradient(135deg, #ee5a24 0%, #f0932b 100%)',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: '0 8px 30px rgba(238, 90, 36, 0.4)'
              },
              '& .MuiSvgIcon-root': {
                fontSize: '24px',
                mr: 1
              }
            }}
          >
            <Pause />
            <Box component="span" sx={{ ml: 1 }}>一時停止</Box>
          </Fab>
        </Zoom>
        <Tooltip title="リセット">
          <Fab 
            onClick={onReset}
            size="medium"
            sx={{ 
              ml: 2,
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                transform: 'rotate(180deg)',
                transition: 'transform 0.3s ease'
              },
              '& .MuiSvgIcon-root': {
                fontSize: '24px'
              }
            }}
          >
            <Refresh />
          </Fab>
        </Tooltip>
      </Stack>

      {currentMode !== 'stopwatch' && currentMode !== 'pomodoro-plan' && (
        <Box sx={{ mt: 4, px: 2 }}>
          <Typography variant="body2" sx={{ mb: 2, opacity: 0.7 }}>
            時間設定（分）
          </Typography>
          {currentMode === 'focus' && (
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Timer fontSize="small" />
                <Slider
                  value={focusDuration}
                  onChange={(_, val) => onDurationChange('focus', val as number)}
                  min={1}
                  max={60}
                  marks={[
                    { value: 15, label: '15' },
                    { value: 25, label: '25' },
                    { value: 45, label: '45' }
                  ]}
                  disabled={isRunning}
                  sx={{ color: workModes.focus.color }}
                />
                <Typography>{focusDuration}分</Typography>
              </Stack>
            </Box>
          )}
          {currentMode === 'short-break' && (
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Coffee fontSize="small" />
                <Slider
                  value={shortBreakDuration}
                  onChange={(_, val) => onDurationChange('short-break', val as number)}
                  min={1}
                  max={15}
                  marks={[
                    { value: 5, label: '5' },
                    { value: 10, label: '10' }
                  ]}
                  disabled={isRunning}
                  sx={{ color: workModes['short-break'].color }}
                />
                <Typography>{shortBreakDuration}分</Typography>
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};