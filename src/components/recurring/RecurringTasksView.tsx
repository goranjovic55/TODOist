import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Event as EventIcon,
  EventRepeat as RecurringIcon,
  CheckCircle as CompletedIcon,
  Warning as WarningIcon,
  AccessTime as TimeIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { format, addDays, addWeeks, addMonths, isAfter } from 'date-fns';

// Recurring task definition
interface RecurringTask {
  id: string;
  name: string;
  baseTaskId: string; // Reference to the original task template
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval: number; // For custom frequency: every X days/weeks/months
  intervalUnit: 'days' | 'weeks' | 'months';
  startDate: Date;
  endDate?: Date;
  dayOfWeek?: number[]; // 0-6, for weekly tasks
  dayOfMonth?: number; // 1-31, for monthly tasks
  count?: number; // Number of occurrences
  lastGenerated?: Date;
  nextDueDate?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultRecurringTask: Omit<RecurringTask, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  baseTaskId: '',
  frequency: 'weekly',
  interval: 1,
  intervalUnit: 'weeks',
  startDate: new Date(),
  active: true
};

const RecurringTasksView: React.FC = () => {
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<RecurringTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<RecurringTask | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // Load recurring tasks from localStorage on mount
  useEffect(() => {
    const storedTasks = localStorage.getItem('recurringTasks');
    if (storedTasks) {
      const parsedTasks = JSON.parse(storedTasks);
      // Convert string dates back to Date objects
      const formattedTasks = parsedTasks.map((task: any) => ({
        ...task,
        startDate: new Date(task.startDate),
        endDate: task.endDate ? new Date(task.endDate) : undefined,
        lastGenerated: task.lastGenerated ? new Date(task.lastGenerated) : undefined,
        nextDueDate: task.nextDueDate ? new Date(task.nextDueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }));
      setRecurringTasks(formattedTasks);
    } else {
      // Initialize with sample data
      const sampleTasks = getSampleRecurringTasks();
      setRecurringTasks(sampleTasks);
      localStorage.setItem('recurringTasks', JSON.stringify(sampleTasks));
    }
    
    // Filter tasks that can be used as templates
    setAvailableTasks(tasks);
  }, [tasks]);
  
  // Save recurring tasks to localStorage whenever they change
  useEffect(() => {
    if (recurringTasks.length > 0) {
      localStorage.setItem('recurringTasks', JSON.stringify(recurringTasks));
    }
  }, [recurringTasks]);
  
  // Check and update next due dates
  useEffect(() => {
    const updatedTasks = recurringTasks.map(task => {
      if (!task.active) return task;
      
      if (!task.nextDueDate || isAfter(new Date(), task.nextDueDate)) {
        return updateNextDueDate(task);
      }
      
      return task;
    });
    
    if (JSON.stringify(updatedTasks) !== JSON.stringify(recurringTasks)) {
      setRecurringTasks(updatedTasks);
    }
  }, [recurringTasks]);
  
  const updateNextDueDate = (task: RecurringTask): RecurringTask => {
    let nextDate: Date;
    
    if (!task.nextDueDate) {
      // First-time initialization
      nextDate = new Date(task.startDate);
    } else {
      // Calculate the next date based on frequency
      nextDate = calculateNextDate(task);
    }
    
    // Check if we've reached the end date or max count
    if (
      (task.endDate && isAfter(nextDate, task.endDate)) ||
      (task.count && task.lastGenerated && 
       getOccurrenceCount(task.startDate, task.lastGenerated, task) >= task.count)
    ) {
      return { ...task, active: false };
    }
    
    return { ...task, nextDueDate: nextDate };
  };
  
  const calculateNextDate = (task: RecurringTask): Date => {
    const baseDate = task.lastGenerated || task.startDate;
    let nextDate: Date;
    
    switch (task.frequency) {
      case 'daily':
        nextDate = addDays(baseDate, 1);
        break;
      case 'weekly':
        nextDate = addWeeks(baseDate, 1);
        break;
      case 'biweekly':
        nextDate = addWeeks(baseDate, 2);
        break;
      case 'monthly':
        nextDate = addMonths(baseDate, 1);
        break;
      case 'custom':
        switch (task.intervalUnit) {
          case 'days':
            nextDate = addDays(baseDate, task.interval);
            break;
          case 'weeks':
            nextDate = addWeeks(baseDate, task.interval);
            break;
          case 'months':
            nextDate = addMonths(baseDate, task.interval);
            break;
          default:
            nextDate = addDays(baseDate, task.interval);
        }
        break;
      default:
        nextDate = addDays(baseDate, 1);
    }
    
    return nextDate;
  };
  
  const getOccurrenceCount = (start: Date, end: Date, task: RecurringTask): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let divisor: number;
    
    switch (task.frequency) {
      case 'daily':
        divisor = 24 * 60 * 60 * 1000; // milliseconds in a day
        break;
      case 'weekly':
        divisor = 7 * 24 * 60 * 60 * 1000;
        break;
      case 'biweekly':
        divisor = 14 * 24 * 60 * 60 * 1000;
        break;
      case 'monthly':
        // This is an approximation
        divisor = 30 * 24 * 60 * 60 * 1000;
        break;
      case 'custom':
        switch (task.intervalUnit) {
          case 'days':
            divisor = task.interval * 24 * 60 * 60 * 1000;
            break;
          case 'weeks':
            divisor = task.interval * 7 * 24 * 60 * 60 * 1000;
            break;
          case 'months':
            // Approximation
            divisor = task.interval * 30 * 24 * 60 * 60 * 1000;
            break;
          default:
            divisor = task.interval * 24 * 60 * 60 * 1000;
        }
        break;
      default:
        divisor = 24 * 60 * 60 * 1000;
    }
    
    return Math.floor(diffTime / divisor) + 1;
  };
  
  const handleOpenDialog = (edit: boolean = false, task?: RecurringTask) => {
    if (edit && task) {
      setEditedTask({ ...task });
      setEditMode(true);
    } else {
      setEditedTask({
        ...defaultRecurringTask,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setEditMode(false);
    }
    setDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditedTask(null);
  };
  
  const handleSaveTask = () => {
    if (!editedTask) return;
    
    // Calculate next due date
    const taskWithDueDate = {
      ...editedTask,
      updatedAt: new Date()
    };
    
    const updatedTask = updateNextDueDate(taskWithDueDate);
    
    if (editMode) {
      // Update existing task
      setRecurringTasks(prevTasks => 
        prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
    } else {
      // Add new task
      setRecurringTasks(prevTasks => [...prevTasks, updatedTask]);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteTask = (taskId: string) => {
    setRecurringTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };
  
  const handleSelectTask = (task: RecurringTask) => {
    setSelectedTask(task);
  };
  
  const handleToggleActive = (taskId: string) => {
    setRecurringTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === taskId ? { ...t, active: !t.active } : t
      )
    );
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    if (!editedTask) return;
    
    const { name, value } = e.target;
    if (name) {
      setEditedTask({
        ...editedTask,
        [name]: value
      });
    }
  };
  
  const handleFrequencyChange = (event: SelectChangeEvent) => {
    if (!editedTask) return;
    
    const frequency = event.target.value as RecurringTask['frequency'];
    setEditedTask({
      ...editedTask,
      frequency,
      // Set default values based on frequency
      interval: frequency === 'custom' ? 1 : undefined,
      intervalUnit: frequency === 'custom' ? 'days' : undefined
    });
  };
  
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (!editedTask) return;
    
    setEditedTask({
      ...editedTask,
      [field]: value ? new Date(value) : undefined
    });
  };
  
  const handleIntervalUnitChange = (event: SelectChangeEvent) => {
    if (!editedTask) return;
    
    setEditedTask({
      ...editedTask,
      intervalUnit: event.target.value as 'days' | 'weeks' | 'months'
    });
  };
  
  const handleBaseTaskChange = (event: SelectChangeEvent) => {
    if (!editedTask) return;
    
    const taskId = event.target.value;
    const selectedTask = tasks.find(t => t.id === taskId);
    
    if (selectedTask) {
      setEditedTask({
        ...editedTask,
        baseTaskId: taskId,
        name: selectedTask.title // Use the task title as the recurring task name
      });
    }
  };
  
  const getBaseTaskTitle = (taskId: string): string => {
    const task = tasks.find(t => t.id === taskId);
    return task ? task.title : 'Unknown Task';
  };
  
  const generateRecurringTask = (recurringTask: RecurringTask) => {
    if (!recurringTask.active) return;
    
    const baseTask = tasks.find(t => t.id === recurringTask.baseTaskId);
    if (!baseTask) return;
    
    // Create a new task based on the template
    const newTask: Task = {
      id: Date.now().toString(),
      title: baseTask.title,
      description: baseTask.description,
      status: 'not_started',
      priority: baseTask.priority,
      parentId: baseTask.parentId,
      tags: [...(baseTask.tags || [])],
      dueDate: recurringTask.nextDueDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real implementation, would dispatch to Redux store
    // dispatch(addTask(newTask));
    
    // Update the recurring task with new last generated date
    setRecurringTasks(prevTasks => 
      prevTasks.map(t => 
        t.id === recurringTask.id 
          ? { 
              ...t, 
              lastGenerated: new Date(),
              nextDueDate: undefined // Will be recalculated in the effect
            } 
          : t
      )
    );
    
    console.log('Generated task:', newTask);
    alert(`Task "${newTask.title}" created successfully!`);
  };
  
  const getFrequencyText = (task: RecurringTask): string => {
    switch (task.frequency) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'biweekly':
        return 'Every two weeks';
      case 'monthly':
        return 'Every month';
      case 'custom':
        return `Every ${task.interval} ${task.intervalUnit}`;
      default:
        return 'Custom schedule';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recurring Tasks
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Set up tasks that automatically repeat at specified intervals.
        </Typography>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recurring Tasks ({recurringTasks.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Create Recurring Task
            </Button>
          </Box>
          
          {recurringTasks.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No recurring tasks set up yet.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {recurringTasks.map(task => (
                <Paper 
                  key={task.id} 
                  elevation={selectedTask?.id === task.id ? 3 : 1}
                  sx={{ 
                    mb: 2, 
                    border: selectedTask?.id === task.id ? 2 : 0,
                    borderColor: 'primary.main',
                    transition: 'all 0.2s'
                  }}
                >
                  <ListItem 
                    button 
                    onClick={() => handleSelectTask(task)}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography 
                            sx={{ 
                              fontWeight: 'medium',
                              color: !task.active ? 'text.disabled' : 'text.primary'
                            }}
                          >
                            {task.name}
                          </Typography>
                          {!task.active && (
                            <Chip 
                              label="Inactive" 
                              size="small" 
                              color="default" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <RecurringIcon fontSize="small" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {getFrequencyText(task)}
                            </Typography>
                          </Box>
                          
                          {task.nextDueDate && task.active && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <DateIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                Next: {format(task.nextDueDate, 'MMM d, yyyy')}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title={task.active ? 'Deactivate' : 'Activate'}>
                        <Switch
                          edge="end"
                          checked={task.active}
                          onChange={() => handleToggleActive(task.id)}
                        />
                      </Tooltip>
                      
                      <Tooltip title="Generate Task Now">
                        <IconButton 
                          edge="end" 
                          onClick={(e) => {
                            e.stopPropagation();
                            generateRecurringTask(task);
                          }}
                          disabled={!task.active}
                          sx={{ ml: 1 }}
                        >
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit">
                        <IconButton 
                          edge="end" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(true, task);
                          }}
                          sx={{ ml: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete">
                        <IconButton 
                          edge="end" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Grid>
        
        <Grid item xs={12} md={5}>
          {selectedTask ? (
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">
                    {selectedTask.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created: {format(new Date(selectedTask.createdAt), 'MMM d, yyyy')}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => generateRecurringTask(selectedTask)}
                  disabled={!selectedTask.active}
                >
                  Generate Now
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Based on Task
                </Typography>
                <Typography variant="body1">
                  {getBaseTaskTitle(selectedTask.baseTaskId)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Schedule
                </Typography>
                <Typography variant="body1">
                  {getFrequencyText(selectedTask)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Starting from: {format(new Date(selectedTask.startDate), 'MMM d, yyyy')}
                </Typography>
                {selectedTask.endDate && (
                  <Typography variant="body2" color="text.secondary">
                    Until: {format(new Date(selectedTask.endDate), 'MMM d, yyyy')}
                  </Typography>
                )}
                {selectedTask.count && (
                  <Typography variant="body2" color="text.secondary">
                    Occurrences: {selectedTask.count}
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Chip 
                    label={selectedTask.active ? 'Active' : 'Inactive'} 
                    color={selectedTask.active ? 'success' : 'default'}
                  />
                </Box>
              </Box>
              
              {selectedTask.lastGenerated && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Last Generated
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedTask.lastGenerated), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
              
              {selectedTask.nextDueDate && selectedTask.active && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Next Due Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedTask.nextDueDate), 'MMM d, yyyy')}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleOpenDialog(true, selectedTask)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteTask(selectedTask.id)}
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Recurring Task Selected
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a recurring task to view details
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Create Recurring Task
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Create/Edit Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Edit Recurring Task' : 'Create Recurring Task'}
        </DialogTitle>
        <DialogContent>
          {editedTask && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="base-task-label">Base Task</InputLabel>
                  <Select
                    labelId="base-task-label"
                    id="base-task"
                    value={editedTask.baseTaskId}
                    label="Base Task"
                    onChange={handleBaseTaskChange}
                    required
                  >
                    {availableTasks.map(task => (
                      <MenuItem key={task.id} value={task.id}>
                        {task.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Name"
                  fullWidth
                  value={editedTask.name}
                  onChange={handleInputChange}
                  required
                  helperText="A name to identify this recurring task"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="frequency-label">Frequency</InputLabel>
                  <Select
                    labelId="frequency-label"
                    id="frequency"
                    value={editedTask.frequency}
                    label="Frequency"
                    onChange={handleFrequencyChange}
                    required
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {editedTask.frequency === 'custom' && (
                <>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      name="interval"
                      label="Every"
                      type="number"
                      fullWidth
                      value={editedTask.interval}
                      onChange={handleInputChange}
                      required
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                      <InputLabel id="interval-unit-label">Unit</InputLabel>
                      <Select
                        labelId="interval-unit-label"
                        id="interval-unit"
                        value={editedTask.intervalUnit}
                        label="Unit"
                        onChange={handleIntervalUnitChange}
                        required
                      >
                        <MenuItem value="days">Days</MenuItem>
                        <MenuItem value="weeks">Weeks</MenuItem>
                        <MenuItem value="months">Months</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={editedTask.startDate ? format(editedTask.startDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('startDate', e.target.value)}
                  required
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date (Optional)"
                  type="date"
                  fullWidth
                  value={editedTask.endDate ? format(editedTask.endDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleDateChange('endDate', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Leave blank for no end date"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  name="count"
                  label="Number of Occurrences (Optional)"
                  type="number"
                  fullWidth
                  value={editedTask.count || ''}
                  onChange={handleInputChange}
                  inputProps={{ min: 1 }}
                  helperText="Leave blank for unlimited occurrences"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained"
            disabled={!editedTask?.baseTaskId || !editedTask?.name}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Sample recurring tasks for initial setup
const getSampleRecurringTasks = (): RecurringTask[] => [
  {
    id: '1',
    name: 'Weekly Team Meeting',
    baseTaskId: '1', // This should match an existing task ID in your real implementation
    frequency: 'weekly',
    interval: 1,
    intervalUnit: 'weeks',
    startDate: new Date('2023-01-04'), // A Wednesday
    active: true,
    lastGenerated: new Date('2023-06-21'),
    nextDueDate: new Date('2023-06-28'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-21')
  },
  {
    id: '2',
    name: 'Monthly Report',
    baseTaskId: '2', // This should match an existing task ID in your real implementation
    frequency: 'monthly',
    interval: 1,
    intervalUnit: 'months',
    startDate: new Date('2023-01-01'),
    active: true,
    lastGenerated: new Date('2023-06-01'),
    nextDueDate: new Date('2023-07-01'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-01')
  },
  {
    id: '3',
    name: 'Daily Code Review',
    baseTaskId: '3', // This should match an existing task ID in your real implementation
    frequency: 'daily',
    interval: 1,
    intervalUnit: 'days',
    startDate: new Date('2023-06-01'),
    endDate: new Date('2023-07-15'),
    active: true,
    lastGenerated: new Date('2023-06-25'),
    nextDueDate: new Date('2023-06-26'),
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-25')
  },
  {
    id: '4',
    name: 'Bi-weekly 1:1 Meeting',
    baseTaskId: '4', // This should match an existing task ID in your real implementation
    frequency: 'biweekly',
    interval: 2,
    intervalUnit: 'weeks',
    startDate: new Date('2023-01-10'),
    active: false,
    lastGenerated: new Date('2023-05-16'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-05-16')
  },
  {
    id: '5',
    name: 'Custom Schedule Task',
    baseTaskId: '5', // This should match an existing task ID in your real implementation
    frequency: 'custom',
    interval: 3,
    intervalUnit: 'days',
    startDate: new Date('2023-06-01'),
    count: 10,
    active: true,
    lastGenerated: new Date('2023-06-22'),
    nextDueDate: new Date('2023-06-25'),
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2023-06-22')
  }
];

export default RecurringTasksView; 