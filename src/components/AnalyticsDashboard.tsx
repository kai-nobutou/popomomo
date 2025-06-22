import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from "@mui/material";
import {
  Close,
  BarChart,
  Timer,
  TrendingUp,
  CalendarToday
} from "@mui/icons-material";
import { useState, useMemo } from "react";
import { WorkLog, WorkModeConfig } from "../types";

interface AnalyticsDashboardProps {
  open: boolean;
  workLogs: WorkLog[];
  workModes: Record<string, WorkModeConfig>;
  isDarkMode: boolean;
  onClose: () => void;
  formatDuration: (seconds: number) => string;
}

type FilterPeriod = 'today' | 'week' | 'month' | 'all';
type ViewType = 'overview' | 'daily' | 'category' | 'mode';

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  open,
  workLogs,
  isDarkMode,
  onClose,
  formatDuration
}) => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('week');
  const [viewType, setViewType] = useState<ViewType>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // フィルタされたログデータ
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (filterPeriod) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        return workLogs;
    }

    return workLogs.filter(log => new Date(log.timestamp) >= startDate);
  }, [workLogs, filterPeriod]);

  // カテゴリフィルタリング
  const categoryFilteredLogs = useMemo(() => {
    if (selectedCategory === 'all') return filteredLogs;
    return filteredLogs.filter(log => log.category === selectedCategory);
  }, [filteredLogs, selectedCategory]);

  // 統計データ
  const stats = useMemo(() => {
    const totalTime = categoryFilteredLogs.reduce((sum, log) => sum + log.duration, 0);
    const completedLogs = categoryFilteredLogs.filter(log => log.completed);
    const totalSessions = categoryFilteredLogs.length;
    const completedSessions = completedLogs.length;
    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // カテゴリ別集計
    const categoryStats = categoryFilteredLogs.reduce((acc, log) => {
      if (!acc[log.category]) {
        acc[log.category] = { duration: 0, sessions: 0, completed: 0 };
      }
      acc[log.category].duration += log.duration;
      acc[log.category].sessions += 1;
      if (log.completed) acc[log.category].completed += 1;
      return acc;
    }, {} as Record<string, { duration: number; sessions: number; completed: number }>);

    // モード別集計
    const modeStats = categoryFilteredLogs.reduce((acc, log) => {
      if (!acc[log.mode]) {
        acc[log.mode] = { duration: 0, sessions: 0, completed: 0 };
      }
      acc[log.mode].duration += log.duration;
      acc[log.mode].sessions += 1;
      if (log.completed) acc[log.mode].completed += 1;
      return acc;
    }, {} as Record<string, { duration: number; sessions: number; completed: number }>);

    // 日別集計
    const dailyStats = categoryFilteredLogs.reduce((acc, log) => {
      const date = new Date(log.timestamp).toLocaleDateString('ja-JP');
      if (!acc[date]) {
        acc[date] = { duration: 0, sessions: 0, completed: 0 };
      }
      acc[date].duration += log.duration;
      acc[date].sessions += 1;
      if (log.completed) acc[date].completed += 1;
      return acc;
    }, {} as Record<string, { duration: number; sessions: number; completed: number }>);

    return {
      totalTime,
      totalSessions,
      completedSessions,
      completionRate,
      categoryStats,
      modeStats,
      dailyStats
    };
  }, [categoryFilteredLogs]);

  // ユニークカテゴリ
  const categories = useMemo(() => {
    const unique = Array.from(new Set(workLogs.map(log => log.category)));
    return unique.sort();
  }, [workLogs]);

  const renderOverview = () => (
    <Grid container spacing={3} justifyContent="center">
      <Grid item xs={12} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Timer sx={{ color: 'white', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  {formatDuration(stats.totalTime)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  総作業時間
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <BarChart sx={{ color: 'white', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  {stats.totalSessions}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  総セッション数
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <TrendingUp sx={{ color: 'white', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  {stats.completionRate.toFixed(1)}%
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  完了率
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CalendarToday sx={{ color: 'white', fontSize: 32 }} />
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                  {Object.keys(stats.dailyStats).length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  活動日数
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTable = (data: Record<string, { duration: number; sessions: number; completed: number }>, title: string) => (
    <TableContainer component={Paper} elevation={2}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>{title}</strong></TableCell>
            <TableCell align="right"><strong>時間</strong></TableCell>
            <TableCell align="right"><strong>セッション</strong></TableCell>
            <TableCell align="right"><strong>完了</strong></TableCell>
            <TableCell align="right"><strong>完了率</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(data)
            .sort(([,a], [,b]) => b.duration - a.duration)
            .map(([key, stats]) => (
              <TableRow key={key} hover>
                <TableCell>
                  <Chip label={key} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right">{formatDuration(stats.duration)}</TableCell>
                <TableCell align="right">{stats.sessions}</TableCell>
                <TableCell align="right">{stats.completed}</TableCell>
                <TableCell align="right">
                  <Chip 
                    label={`${((stats.completed / stats.sessions) * 100).toFixed(1)}%`}
                    size="small"
                    color={(stats.completed / stats.sessions) > 0.8 ? 'success' : 'default'}
                  />
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%)',
          backdropFilter: 'blur(20px)',
          minHeight: '80vh'
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={700}>
            📊 作業分析ダッシュボード
          </Typography>
          <Tooltip title="閉じる">
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Tooltip>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* フィルタコントロール */}
          <Card elevation={2}>
            <CardContent>
              <Stack spacing={3} alignItems="center">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="center">
                  <ToggleButtonGroup
                    value={filterPeriod}
                    exclusive
                    onChange={(_, value) => value && setFilterPeriod(value)}
                    size="small"
                  >
                    <ToggleButton value="today">今日</ToggleButton>
                    <ToggleButton value="week">1週間</ToggleButton>
                    <ToggleButton value="month">1ヶ月</ToggleButton>
                    <ToggleButton value="all">全期間</ToggleButton>
                  </ToggleButtonGroup>

                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>カテゴリ</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="カテゴリ"
                    >
                      <MenuItem value="all">すべて</MenuItem>
                      {categories.map(category => (
                        <MenuItem key={category} value={category}>{category}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <ToggleButtonGroup
                    value={viewType}
                    exclusive
                    onChange={(_, value) => value && setViewType(value)}
                    size="small"
                  >
                    <ToggleButton value="overview">概要</ToggleButton>
                    <ToggleButton value="daily">日別</ToggleButton>
                    <ToggleButton value="category">カテゴリ別</ToggleButton>
                    <ToggleButton value="mode">モード別</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* メインコンテンツ */}
          {viewType === 'overview' && renderOverview()}
          
          {viewType === 'daily' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>日別作業時間</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {renderTable(stats.dailyStats, '日付')}
              </Box>
            </Box>
          )}
          
          {viewType === 'category' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>カテゴリ別統計</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {renderTable(stats.categoryStats, 'カテゴリ')}
              </Box>
            </Box>
          )}
          
          {viewType === 'mode' && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>モード別統計</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                {renderTable(stats.modeStats, 'モード')}
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};