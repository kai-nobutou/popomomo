import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  IconButton,
  Button,
  Paper,
  Box,
  Chip
} from "@mui/material";
import { Add, Delete, Edit, Save, Cancel } from "@mui/icons-material";
import { useState } from "react";
import { Category } from "../types";

interface CategoryManagerProps {
  open: boolean;
  categories: Category[];
  onClose: () => void;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory: (id: number, name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  open,
  categories,
  onClose,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = async () => {
    if (newCategoryName.trim()) {
      await onAddCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
  };

  const handleSave = async () => {
    if (editingId && editingName.trim()) {
      await onUpdateCategory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('このカテゴリを削除しますか？関連する作業ログは「その他」カテゴリに移動されます。')) {
      await onDeleteCategory(id);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>カテゴリ管理</DialogTitle>
      <DialogContent>
        {/* 新規追加 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            新しいカテゴリを追加
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              placeholder="カテゴリ名"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              disabled={!newCategoryName.trim()}
            >
              追加
            </Button>
          </Stack>
        </Box>

        {/* カテゴリ一覧 */}
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          既存のカテゴリ
        </Typography>
        <Stack spacing={1}>
          {categories.map((category) => (
            <Paper key={category.id} elevation={1} sx={{ p: 2 }}>
              {editingId === category.id ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    size="small"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSave}
                    disabled={!editingName.trim()}
                  >
                    <Save />
                  </IconButton>
                  <IconButton color="default" onClick={handleCancel}>
                    <Cancel />
                  </IconButton>
                </Stack>
              ) : (
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Chip
                    label={category.name}
                    variant="outlined"
                    sx={{ borderRadius: 1 }}
                  />
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => startEdit(category)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {category.name === 'その他' ? (
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled
                          onClick={() => handleDelete(category.id)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    ) : (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                </Stack>
              )}
            </Paper>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
};