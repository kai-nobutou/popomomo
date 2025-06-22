import { 
  Box, 
  Typography, 
  Stack, 
  IconButton, 
  Chip, 
  Collapse, 
  Paper, 
  Fade, 
  Badge,
  Tooltip
} from "@mui/material";
import { 
  ExpandMore, 
  ExpandLess, 
  TrendingUp, 
  CheckCircle, 
  Cancel, 
  Download,
  Timer,
  Delete
} from "@mui/icons-material";
import { WorkLog, WorkModeConfig } from "../types";

interface WorkLogsProps {
  workLogs: WorkLog[];
  showLogs: boolean;
  workModes: Record<string, WorkModeConfig>;
  isDarkMode: boolean;
  onToggleLogs: () => void;
  onExportCSV: () => void;
  onDeleteLog: (id: string) => void;
  formatDuration: (seconds: number) => string;
  getTotalTime: () => number;
}

export const WorkLogs: React.FC<WorkLogsProps> = ({
  workLogs,
  showLogs,
  workModes,
  isDarkMode,
  onToggleLogs,
  onExportCSV,
  onDeleteLog,
  formatDuration,
  getTotalTime
}) => {
  return (
    <Box sx={{ 
      overflow: 'hidden',
      background: isDarkMode 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      border: '1px solid',
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      borderRadius: 2
    }}>
      <Box 
        sx={{ 
          p: 3, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: 'pointer',
          background: isDarkMode 
            ? 'rgba(255, 255, 255, 0.02)' 
            : 'rgba(0, 0, 0, 0.02)',
          '&:hover': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
          }
        }}
        onClick={onToggleLogs}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h6" fontWeight={700}>
            作業ログ
          </Typography>
          <Badge badgeContent={workLogs.length} color="primary" />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip 
            icon={<TrendingUp />}
            label={`${formatDuration(getTotalTime())}`}
            color="success"
            size="small"
          />
          {workLogs.length === 0 ? (
            <span>
              <IconButton 
                size="small" 
                disabled
                onClick={(e) => {
                  e.stopPropagation();
                  onExportCSV();
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </span>
          ) : (
            <Tooltip title="CSVエクスポート">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  onExportCSV();
                }}
              >
                <Download fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <IconButton size="small">
            {showLogs ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>
      </Box>
      
      <Collapse in={showLogs}>
        <Box sx={{ p: 3, pt: 0, maxHeight: 500, overflow: 'auto' }}>
          {workLogs.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center', py: 4 }}>
              まだ作業ログがありません
            </Typography>
          ) : (
            <Stack spacing={2}>
              {workLogs.slice(-10).reverse().map((log, index) => (
                <Fade in key={log.id} timeout={200 * (index + 1)}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      background: isDarkMode 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid',
                      borderColor: log.completed 
                        ? 'rgba(76, 175, 80, 0.3)' 
                        : 'rgba(255, 152, 0, 0.3)',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        borderColor: log.completed 
                          ? 'rgba(76, 175, 80, 0.5)' 
                          : 'rgba(255, 152, 0, 0.5)'
                      }
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Chip 
                          label={log.category} 
                          size="small" 
                          variant="outlined"
                          sx={{ borderRadius: 1 }}
                        />
                        <Chip 
                          icon={workModes[log.mode]?.icon || <Timer />}
                          label={workModes[log.mode]?.label || log.mode} 
                          size="small"
                          sx={{ 
                            borderRadius: 1,
                            borderColor: workModes[log.mode]?.color,
                            color: workModes[log.mode]?.color
                          }}
                          variant="outlined"
                        />
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                          {formatDuration(log.duration)}
                        </Typography>
                        {log.completed ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Cancel color="warning" fontSize="small" />
                        )}
                        <Tooltip title="ログを削除">
                          <IconButton
                            size="small"
                            color="error"
                            sx={{ 
                              ml: 0.5,
                              width: 24,
                              height: 24,
                              minWidth: 24
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('このログを削除しますか？')) {
                                onDeleteLog(log.id);
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                      {log.task}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.5 }}>
                      {log.timestamp.toLocaleString('ja-JP')}
                    </Typography>
                  </Paper>
                </Fade>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};