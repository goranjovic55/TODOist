import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  LinearProgress,
  Tooltip,
  InputAdornment,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Refresh as ResetIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlaylistAdd as LogIcon,
  Timer as TimerIcon,
  Today as TodayIcon,
  DateRange as DateRangeIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { format, formatDistanceStrict, parseISO, differenceInSeconds } from 'date-fns';

// Mock time entry interface - in a real app, this would be in a shared types file
interface TimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  notes: string;
  createdAt: string;
}

// Mock task timer data - in a real app, this would be in the Redux store
const mockTimeEntries: TimeEntry[] = [
  {
    id: '1',
    taskId: '101',
    startTime: new Date(Date.now() - 3600000 * 3).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 2).toISOString(),
    duration: 3600, // 1 hour
    notes: 'Working on frontend implementation',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: '2',
    taskId: '102',
    startTime: new Date(Date.now() - 3600000 * 8).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 6).toISOString(),
    duration: 7200, // 2 hours
    notes: 'Backend API integration',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: '3',
    taskId: '103',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    duration: 900, // 15 minutes
    notes: 'Team meeting',
    createdAt: new Date().toISOString()
  }
];

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
};

// Task time tracker component
const TaskTimeTracker: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // State for timer
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [timerNotes, setTimerNotes] = useState('');
  
  // State for time entries
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('today');
  
  // State for new/edit time entry dialog
  const [timeEntryDialogOpen, setTimeEntryDialogOpen] = useState(false);
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null);
  const [manualTimeEntry, setManualTimeEntry] = useState({
    taskId: '',
    startTime: '',
    endTime: '',
    duration: 0,
    notes: ''
  });
  
  // Effect for timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);
  
  // Filtered time entries based on selected time range
  const filteredTimeEntries = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return timeEntries.filter(entry => {
      const entryDate = parseISO(entry.startTime);
      
      switch (selectedTimeRange) {
        case 'today':
          return entryDate >= today;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return entryDate >= weekStart;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return entryDate >= monthStart;
        case 'all':
        default:
          return true;
      }
    });
  }, [timeEntries, selectedTimeRange]);
  
  // Total time tracked for the selected period
  const totalTimeTracked = useMemo(() => {
    return filteredTimeEntries.reduce((total, entry) => total + entry.duration, 0);
  }, [filteredTimeEntries]);
  
  // Daily time tracked
  const dailyTimeStats = useMemo(() => {
    const stats: { [date: string]: number } = {};
    
    filteredTimeEntries.forEach(entry => {
      const dateKey = format(parseISO(entry.startTime), 'yyyy-MM-dd');
      stats[dateKey] = (stats[dateKey] || 0) + entry.duration;
    });
    
    return Object.entries(stats)
      .map(([date, seconds]) => ({ date, seconds }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTimeEntries]);
  
  // Task time stats
  const taskTimeStats = useMemo(() => {
    const stats: { [taskId: string]: number } = {};
    
    filteredTimeEntries.forEach(entry => {
      stats[entry.taskId] = (stats[entry.taskId] || 0) + entry.duration;
    });
    
    return Object.entries(stats).map(([taskId, seconds]) => {
      const task = tasks.find(t => t.id === taskId);
      return {
        taskId,
        taskTitle: task ? task.title : 'Unknown Task',
        seconds
      };
    }).sort((a, b) => b.seconds - a.seconds);
  }, [filteredTimeEntries, tasks]);
  
  // Handle timer controls
  const handleStartTimer = () => {
    if (!selectedTaskId) return;
    
    setTimerRunning(true);
    setTimerStartTime(new Date());
  };
  
  const handlePauseTimer = () => {
    setTimerRunning(false);
  };
  
  const handleStopTimer = () => {
    if (!selectedTaskId || !timerStartTime) return;
    
    const endTime = new Date();
    const duration = Math.floor(differenceInSeconds(endTime, timerStartTime) + timerSeconds);
    
    // Create new time entry
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId: selectedTaskId,
      startTime: timerStartTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      notes: timerNotes,
      createdAt: new Date().toISOString()
    };
    
    setTimeEntries(prev => [newEntry, ...prev]);
    
    // Reset timer
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    setTimerNotes('');
  };
  
  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerStartTime(null);
    setTimerNotes('');
  };
  
  // Handle manual time entry
  const handleOpenManualEntryDialog = (timeEntry: TimeEntry | null = null) => {
    if (timeEntry) {
      setEditingTimeEntry(timeEntry);
      setManualTimeEntry({
        taskId: timeEntry.taskId,
        startTime: format(parseISO(timeEntry.startTime), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(parseISO(timeEntry.endTime), "yyyy-MM-dd'T'HH:mm"),
        duration: timeEntry.duration,
        notes: timeEntry.notes
      });
    } else {
      setEditingTimeEntry(null);
      setManualTimeEntry({
        taskId: selectedTaskId,
        startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endTime: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:mm"), // Default 1 hour later
        duration: 3600,
        notes: ''
      });
    }
    
    setTimeEntryDialogOpen(true);
  };
  
  const handleCloseEntryDialog = () => {
    setTimeEntryDialogOpen(false);
  };
  
  const handleSaveTimeEntry = () => {
    const startDate = new Date(manualTimeEntry.startTime);
    const endDate = new Date(manualTimeEntry.endTime);
    
    // Calculate duration based on start and end times
    const calculatedDuration = Math.floor(differenceInSeconds(endDate, startDate));
    
    if (calculatedDuration <= 0) {
      // Handle invalid time range - could show an error message
      return;
    }
    
    if (editingTimeEntry) {
      // Update existing entry
      setTimeEntries(prev => 
        prev.map(entry => 
          entry.id === editingTimeEntry.id
            ? {
                ...entry,
                taskId: manualTimeEntry.taskId,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                duration: calculatedDuration,
                notes: manualTimeEntry.notes
              }
            : entry
        )
      );
    } else {
      // Create new entry
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId: manualTimeEntry.taskId,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        duration: calculatedDuration,
        notes: manualTimeEntry.notes,
        createdAt: new Date().toISOString()
      };
      
      setTimeEntries(prev => [newEntry, ...prev]);
    }
    
    handleCloseEntryDialog();
  };
  
  // Handle deleting time entry
  const handleDeleteTimeEntry = (id: string) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  // Format time entry for display
  const formatTimeEntry = (entry: TimeEntry) => {
    const task = tasks.find(t => t.id === entry.taskId);
    const taskTitle = task ? task.title : 'Unknown Task';
    const startDate = parseISO(entry.startTime);
    const endDate = parseISO(entry.endTime);
    const formattedDuration = formatTime(entry.duration);
    
    return {
      taskTitle,
      startTime: format(startDate, 'MMM d, yyyy h:mm a'),
      endTime: format(endDate, 'MMM d, yyyy h:mm a'),
      formattedDuration,
      notes: entry.notes,
      dateFormatted: format(startDate, 'EEEE, MMMM d, yyyy')
    };
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" display="flex" alignItems="center">
          <TimerIcon sx={{ mr: 1 }} />
          Time Tracker
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<LogIcon />}
          size="small"
          onClick={() => handleOpenManualEntryDialog()}
        >
          Log Time
        </Button>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Active timer */}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Active Timer</Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="task-select-label">Select Task</InputLabel>
              <Select
                labelId="task-select-label"
                value={selectedTaskId}
                label="Select Task"
                onChange={(e) => setSelectedTaskId(e.target.value)}
                disabled={timerRunning}
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {tasks.map(task => (
                  <MenuItem key={task.id} value={task.id}>
                    {task.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: 2 }}>
                {formatTime(timerSeconds)}
              </Typography>
              
              <Box>
                {!timerRunning ? (
                  <Tooltip title="Start Timer">
                    <IconButton 
                      color="primary" 
                      onClick={handleStartTimer}
                      disabled={!selectedTaskId}
                    >
                      <PlayIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="Pause Timer">
                    <IconButton color="primary" onClick={handlePauseTimer}>
                      <PauseIcon />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Stop and Save">
                  <IconButton 
                    color="error" 
                    onClick={handleStopTimer}
                    disabled={!timerRunning && timerSeconds === 0}
                  >
                    <StopIcon />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Reset Timer">
                  <IconButton 
                    onClick={handleResetTimer}
                    disabled={!timerRunning && timerSeconds === 0}
                  >
                    <ResetIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            
            <TextField
              label="Notes"
              size="small"
              multiline
              rows={2}
              value={timerNotes}
              onChange={(e) => setTimerNotes(e.target.value)}
              placeholder="Add notes about your work session"
            />
            
            {timerRunning && timerStartTime && (
              <Alert severity="info" icon={<AccessTimeIcon />}>
                Timer started at {format(timerStartTime, 'h:mm a')}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
      
      {/* Time tracked summary */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1">Time Tracked</Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              displayEmpty
              variant="outlined"
              size="small"
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Time
              </Typography>
              <Typography variant="h5" sx={{ fontFamily: 'monospace' }}>
                {formatTime(totalTimeTracked)}
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Entries
              </Typography>
              <Typography variant="h5">
                {filteredTimeEntries.length}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      {/* Task time distribution */}
      {taskTimeStats.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Time by Task
          </Typography>
          
          {taskTimeStats.slice(0, 5).map((stat) => (
            <Box key={stat.taskId} sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                  {stat.taskTitle}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {formatTime(stat.seconds)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(stat.seconds / totalTimeTracked) * 100} 
                sx={{ height: 8, borderRadius: 1 }}
              />
            </Box>
          ))}
        </Box>
      )}
      
      {/* Time entries list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Typography variant="subtitle1" gutterBottom>
          Recent Time Entries
        </Typography>
        
        {filteredTimeEntries.length > 0 ? (
          <List disablePadding>
            {filteredTimeEntries.map((entry) => {
              const formattedEntry = formatTimeEntry(entry);
              
              return (
                <ListItem
                  key={entry.id}
                  alignItems="flex-start"
                  secondaryAction={
                    <Box>
                      <IconButton 
                        edge="end" 
                        aria-label="edit" 
                        onClick={() => handleOpenManualEntryDialog(entry)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        aria-label="delete" 
                        onClick={() => handleDeleteTimeEntry(entry.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  sx={{ 
                    bgcolor: 'background.paper', 
                    mb: 1, 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">
                          {formattedEntry.taskTitle}
                        </Typography>
                        <Chip 
                          label={formattedEntry.formattedDuration} 
                          size="small" 
                          sx={{ fontFamily: 'monospace' }}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TodayIcon fontSize="small" /> {formattedEntry.dateFormatted}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon fontSize="small" /> {formattedEntry.startTime} - {formattedEntry.endTime}
                        </Typography>
                        {formattedEntry.notes && (
                          <Typography variant="body2" component="div" sx={{ mt: 0.5 }}>
                            {formattedEntry.notes}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
            No time entries found for the selected period
          </Typography>
        )}
      </Box>
      
      {/* Manual time entry dialog */}
      <Dialog 
        open={timeEntryDialogOpen} 
        onClose={handleCloseEntryDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTimeEntry ? 'Edit Time Entry' : 'Log Time Manually'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel id="manual-task-select-label">Task</InputLabel>
                <Select
                  labelId="manual-task-select-label"
                  value={manualTimeEntry.taskId}
                  label="Task"
                  onChange={(e) => setManualTimeEntry(prev => ({ ...prev, taskId: e.target.value }))}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {tasks.map(task => (
                    <MenuItem key={task.id} value={task.id}>
                      {task.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Time"
                type="datetime-local"
                value={manualTimeEntry.startTime}
                onChange={(e) => setManualTimeEntry(prev => ({ 
                  ...prev, 
                  startTime: e.target.value 
                }))}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Time"
                type="datetime-local"
                value={manualTimeEntry.endTime}
                onChange={(e) => setManualTimeEntry(prev => ({ 
                  ...prev, 
                  endTime: e.target.value 
                }))}
                fullWidth
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Duration"
                value={formatTime(
                  Math.max(0, differenceInSeconds(
                    new Date(manualTimeEntry.endTime), 
                    new Date(manualTimeEntry.startTime)
                  ))
                )}
                fullWidth
                size="small"
                disabled
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccessTimeIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Notes"
                value={manualTimeEntry.notes}
                onChange={(e) => setManualTimeEntry(prev => ({ ...prev, notes: e.target.value }))}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEntryDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveTimeEntry}
            variant="contained"
            color="primary"
            disabled={!manualTimeEntry.taskId || !manualTimeEntry.startTime || !manualTimeEntry.endTime}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TaskTimeTracker; 