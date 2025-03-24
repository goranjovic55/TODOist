import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Chip, 
  Stack,
  Typography,
  IconButton,
  SelectChangeEvent,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';

import { RootState } from '../../stores/store';
import { Project, Group, Task, addTask, updateTask } from '../../stores/tasksSlice';

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  task?: Task;
  parentId?: string;
  isEditMode?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ open, onClose, task, parentId, isEditMode = false }) => {
  const dispatch = useDispatch();
  const projects = useSelector((state: RootState) => state.tasks.projects);
  const groups = useSelector((state: RootState) => state.tasks.groups);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'not_started' | 'in_progress' | 'completed' | 'blocked'>('not_started');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Set initial form values when editing an existing task
  useEffect(() => {
    if (task && isEditMode) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setSelectedParentId(task.parentId);
      setStartDate(task.startDate ? new Date(task.startDate) : null);
      setEndDate(task.endDate ? new Date(task.endDate) : null);
      setTags([...task.tags]);
    } else {
      // Set default values for a new task
      setTitle('');
      setDescription('');
      setStatus('not_started');
      setPriority('medium');
      setSelectedParentId(parentId);
      setStartDate(new Date());
      setEndDate(null);
      setTags([]);
    }
  }, [task, isEditMode, parentId]);
  
  // Get all available parent options (groups)
  const parentOptions = groups.map(group => ({
    id: group.id,
    name: group.name,
    projectId: group.parentId
  }));
  
  // Handle form submission
  const handleSubmit = () => {
    if (!title.trim()) {
      return; // Don't submit if title is empty
    }
    
    if (isEditMode && task) {
      // Update existing task
      dispatch(updateTask({
        id: task.id,
        title,
        description,
        status,
        priority,
        parentId: selectedParentId,
        startDate,
        endDate,
        tags
      }));
    } else {
      // Create new task
      dispatch(addTask({
        title,
        description,
        status,
        priority,
        parentId: selectedParentId,
        startDate,
        endDate
      }));
    }
    
    onClose();
  };
  
  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };
  
  // Handle deleting a tag
  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };
  
  // Handle status change
  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value as 'not_started' | 'in_progress' | 'completed' | 'blocked');
  };
  
  // Handle priority change
  const handlePriorityChange = (event: SelectChangeEvent) => {
    setPriority(event.target.value as 'low' | 'medium' | 'high');
  };
  
  // Handle parent change
  const handleParentChange = (event: SelectChangeEvent) => {
    setSelectedParentId(event.target.value);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditMode ? 'Edit Task' : 'New Task'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Task Title"
            type="text"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            id="description"
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={status}
                  label="Status"
                  onChange={handleStatusChange}
                >
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  value={priority}
                  label="Priority"
                  onChange={handlePriorityChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="parent-label">Group</InputLabel>
            <Select
              labelId="parent-label"
              id="parent"
              value={selectedParentId || ''}
              label="Group"
              onChange={handleParentChange}
            >
              {parentOptions.map(option => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'dense',
                      sx: { mb: 2 }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date (Due Date)"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'dense',
                      sx: { mb: 2 }
                    }
                  }}
                />
              </Grid>
            </Grid>
          </LocalizationProvider>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                size="small"
                label="Add Tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{ mr: 1 }}
              />
              <IconButton onClick={handleAddTag} size="small" color="primary">
                <AddIcon />
              </IconButton>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleDeleteTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {isEditMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskForm; 