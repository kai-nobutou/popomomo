import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Button
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { PomodoroStep } from "../types";

interface PlanEditorDialogProps {
  open: boolean;
  planName: string;
  planSteps: PomodoroStep[];
  onClose: () => void;
  onPlanNameChange: (name: string) => void;
  onAddStep: () => void;
  onUpdateStep: (stepId: string, field: keyof PomodoroStep, value: any) => void;
  onRemoveStep: (stepId: string) => void;
  onSave: () => void;
}

export const PlanEditorDialog: React.FC<PlanEditorDialogProps> = ({
  open,
  planName,
  planSteps,
  onClose,
  onPlanNameChange,
  onAddStep,
  onUpdateStep,
  onRemoveStep,
  onSave
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>新しいポロモードプランを作成</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="プラン名"
          value={planName}
          onChange={(e) => onPlanNameChange(e.target.value)}
          margin="normal"
          variant="outlined"
        />
        
        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
          ステップ設定
        </Typography>
        
        <Stack spacing={2}>
          {planSteps.map((step, index) => (
            <Paper key={step.id} elevation={1} sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 80 }}>
                  ステップ {index + 1}
                </Typography>
                
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>タイプ</InputLabel>
                  <Select
                    value={step.type}
                    onChange={(e) => onUpdateStep(step.id, 'type', e.target.value)}
                    label="タイプ"
                  >
                    <MenuItem value="focus">集中</MenuItem>
                    <MenuItem value="short-break">休憩</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  size="small"
                  label="時間(分)"
                  type="number"
                  value={step.duration / 60}
                  onChange={(e) => onUpdateStep(step.id, 'duration', parseInt(e.target.value) * 60)}
                  sx={{ width: 100 }}
                />
                
                <TextField
                  size="small"
                  label="ラベル"
                  value={step.label}
                  onChange={(e) => onUpdateStep(step.id, 'label', e.target.value)}
                  sx={{ flexGrow: 1 }}
                />
                
                <IconButton 
                  color="error" 
                  onClick={() => onRemoveStep(step.id)}
                  disabled={planSteps.length <= 1}
                >
                  <Delete />
                </IconButton>
              </Stack>
            </Paper>
          ))}
          
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={onAddStep}
            sx={{ alignSelf: 'flex-start' }}
          >
            ステップを追加
          </Button>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          キャンセル
        </Button>
        <Button 
          onClick={onSave}
          variant="contained"
          disabled={!planName.trim() || planSteps.length === 0}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};