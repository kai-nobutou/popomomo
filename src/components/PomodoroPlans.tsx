import { Box, Typography, Stack, IconButton, Paper, Fab, LinearProgress } from "@mui/material";
import { Add, Delete, PlaylistPlay } from "@mui/icons-material";
import { PomodoroPlan, WorkModeConfig } from "../types";

interface PomodoroPlanProps {
  currentPlan: PomodoroPlan | null;
  currentStepIndex: number;
  pomodoroPlans: PomodoroPlan[];
  workModes: Record<string, WorkModeConfig>;
  isDarkMode: boolean;
  onStartPlan: (plan: PomodoroPlan) => void;
  onDeletePlan: (planId: string) => void;
  onCreateDefaultPlan: () => PomodoroPlan;
  onShowPlanEditor: () => void;
}

export const PomodoroPlans: React.FC<PomodoroPlanProps> = ({
  currentPlan,
  currentStepIndex,
  pomodoroPlans,
  workModes,
  isDarkMode,
  onStartPlan,
  onDeletePlan,
  onCreateDefaultPlan,
  onShowPlanEditor
}) => {
  if (currentPlan) {
    return (
      <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            textAlign: 'center',
            fontSize: { xs: '1rem', sm: '1.25rem' },
            wordBreak: 'break-word'
          }}
        >
          {currentPlan.name}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 2, 
            textAlign: 'center', 
            opacity: 0.7,
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        >
          ステップ {currentStepIndex + 1} / {currentPlan.steps.length}
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 3, 
            textAlign: 'center',
            fontSize: { xs: '0.875rem', sm: '1rem' },
            wordBreak: 'break-word',
            px: 1
          }}
        >
          {currentPlan.steps[currentStepIndex]?.label}
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={(currentStepIndex / currentPlan.steps.length) * 100} 
          sx={{ 
            mb: 2, 
            height: 8, 
            borderRadius: 4,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: workModes['pomodoro-plan'].gradient
            }
          }} 
        />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: '100%', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography 
          variant="h6"
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            flexGrow: 1,
            minWidth: 0
          }}
        >
          ポロモード
        </Typography>
        <IconButton 
          onClick={onShowPlanEditor} 
          color="primary"
          sx={{ flexShrink: 0 }}
        >
          <Add />
        </IconButton>
      </Stack>
      
      {pomodoroPlans.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mb: 2, 
              opacity: 0.7,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            プランがありません
          </Typography>
          <Fab 
            variant="extended" 
            size="small"
            onClick={() => onStartPlan(onCreateDefaultPlan())}
            sx={{ 
              background: workModes['pomodoro-plan'].gradient,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            <PlaylistPlay sx={{ mr: 1 }} />
            デフォルトプランを開始
          </Fab>
        </Box>
      ) : (
        <Stack spacing={2}>
          {pomodoroPlans.map(plan => (
            <Paper
              key={plan.id}
              elevation={0}
              sx={{
                p: 2,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                border: '1px solid',
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
              onClick={() => onStartPlan(plan)}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ flexGrow: 1, minWidth: 0, mr: 1 }}>
                  <Typography 
                    variant="body1" 
                    fontWeight={600}
                    sx={{ 
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      wordBreak: 'break-word'
                    }}
                  >
                    {plan.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      opacity: 0.7,
                      fontSize: { xs: '0.6rem', sm: '0.75rem' }
                    }}
                  >
                    {plan.steps.length} ステップ
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  sx={{ 
                    flexShrink: 0,
                    width: 24,
                    height: 24
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePlan(plan.id);
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};