import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Switch,
  Slider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Tooltip,
  Badge,
  Alert,
  Snackbar
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Restore as ResetIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Timer as TimerIcon,
  AccessTime as TimeIcon,
  History as HistoryIcon,
  CheckCircle as CompletedIcon,
  BarChart as ReportsIcon,
  AlarmOn as AlarmIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

// Define interfaces
interface TimeEntry {
  id: string;
  taskId: string | null;
  taskName: string;
  startTime: string;
  endTime: string | null;
  duration: number; // in seconds
  notes: string;
  tags: string[];
  isPomodoro: boolean;
  pomodoroCount?: number;
}

interface PomodoroSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // after how many pomodoros
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  alarmSound: string;
  alarmVolume: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`timer-tabpanel-${index}`}
      aria-labelledby={`timer-tab-${index}`}
      {...other}
      style={{ padding: '16px 0' }}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

const TimeTrackingPanel: React.FC = () => {
  // State for timer
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  
  // State for Pomodoro
  const [isPomodoroMode, setIsPomodoroMode] = useState<boolean>(false);
  const [pomodoroCount, setPomodoroCount] = useState<number>(0);
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [pomodoroRemaining, setPomodoroRemaining] = useState<number>(0);
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
    alarmSound: 'bell',
    alarmVolume: 70
  });
  
  // State for UI
  const [activeTab, setActiveTab] = useState<number>(0);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().substr(0, 10));
  
  // Refs
  const timerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Redux state
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const dispatch = useDispatch();
  
  // Load saved time entries and settings from localStorage
  useEffect(() => {
    try {
      const savedEntries = localStorage.getItem('timeEntries');
      if (savedEntries) {
        setTimeEntries(JSON.parse(savedEntries));
      }
      
      const savedSettings = localStorage.getItem('pomodoroSettings');
      if (savedSettings) {
        setPomodoroSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading time tracking data:', error);
    }
    
    // Initialize audio element
    audioRef.current = new Audio('/sounds/bell.mp3');
    
    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Save time entries to localStorage when updated
  useEffect(() => {
    localStorage.setItem('timeEntries', JSON.stringify(timeEntries));
  }, [timeEntries]);
  
  // Save pomodoro settings to localStorage when updated
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(pomodoroSettings));
  }, [pomodoroSettings]);
  
  // Handle timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
        
        if (isPomodoroMode && pomodoroRemaining > 0) {
          setPomodoroRemaining(prev => prev - 1);
          
          // Handle pomodoro phase completion
          if (pomodoroRemaining === 1) {
            playAlarmSound();
            
            if (pomodoroPhase === 'work') {
              // Completed a work session
              const newCount = pomodoroCount + 1;
              setPomodoroCount(newCount);
              
              // Determine next break type
              if (newCount % pomodoroSettings.longBreakInterval === 0) {
                setPomodoroPhase('longBreak');
                setPomodoroRemaining(pomodoroSettings.longBreakDuration * 60);
                showSnackbar('Long break started!');
              } else {
                setPomodoroPhase('shortBreak');
                setPomodoroRemaining(pomodoroSettings.shortBreakDuration * 60);
                showSnackbar('Short break started!');
              }
              
              // Auto start breaks if enabled
              if (!pomodoroSettings.autoStartBreaks) {
                pauseTimer();
              }
            } else {
              // Completed a break session
              setPomodoroPhase('work');
              setPomodoroRemaining(pomodoroSettings.workDuration * 60);
              showSnackbar('Work session started!');
              
              // Auto start pomodoros if enabled
              if (!pomodoroSettings.autoStartPomodoros) {
                pauseTimer();
              }
            }
          }
        }
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, isPomodoroMode, pomodoroRemaining, pomodoroPhase, pomodoroCount, pomodoroSettings]);
  
  // Start timer
  const startTimer = () => {
    if (activeTimer === null) {
      // Create new time entry
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        taskId: currentTask !== '' ? currentTask : null,
        taskName: currentTask !== '' ? 
          tasks.find(t => t.id === currentTask)?.title || 'Unnamed Task' : 
          'Untitled Time Entry',
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0,
        notes: notes,
        tags: tags,
        isPomodoro: isPomodoroMode,
        pomodoroCount: isPomodoroMode ? 0 : undefined
      };
      
      setActiveTimer(newEntry);
      setElapsedTime(0);
      
      if (isPomodoroMode) {
        setPomodoroPhase('work');
        setPomodoroRemaining(pomodoroSettings.workDuration * 60);
        setPomodoroCount(0);
      }
    }
    
    setIsRunning(true);
  };
  
  // Pause timer
  const pauseTimer = () => {
    setIsRunning(false);
  };
  
  // Resume timer
  const resumeTimer = () => {
    setIsRunning(true);
  };
  
  // Stop timer
  const stopTimer = () => {
    if (activeTimer) {
      const endedEntry: TimeEntry = {
        ...activeTimer,
        endTime: new Date().toISOString(),
        duration: elapsedTime,
        notes: notes,
        pomodoroCount: isPomodoroMode ? pomodoroCount : undefined
      };
      
      setTimeEntries(prev => [endedEntry, ...prev]);
      setActiveTimer(null);
      setIsRunning(false);
      setElapsedTime(0);
      setPomodoroCount(0);
      showSnackbar('Time entry saved!');
    }
  };
  
  // Reset timer
  const resetTimer = () => {
    if (activeTimer) {
      setElapsedTime(0);
      
      if (isPomodoroMode) {
        setPomodoroPhase('work');
        setPomodoroRemaining(pomodoroSettings.workDuration * 60);
        setPomodoroCount(0);
      }
    }
  };
  
  // Toggle Pomodoro mode
  const togglePomodoroMode = () => {
    if (!isRunning) {
      setIsPomodoroMode(!isPomodoroMode);
      
      if (!isPomodoroMode) {
        setPomodoroPhase('work');
        setPomodoroRemaining(pomodoroSettings.workDuration * 60);
      }
    } else {
      showSnackbar('Stop the timer before changing modes');
    }
  };
  
  // Delete time entry
  const deleteTimeEntry = (id: string) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== id));
    setDeleteDialogOpen(false);
    setSelectedEntry(null);
    showSnackbar('Time entry deleted');
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle settings dialog
  const openSettingsDialog = () => {
    setSettingsDialogOpen(true);
  };
  
  const closeSettingsDialog = () => {
    setSettingsDialogOpen(false);
  };
  
  const saveSettings = () => {
    setSettingsDialogOpen(false);
    showSnackbar('Settings saved');
    
    if (isPomodoroMode && isRunning) {
      // Adjust current pomodoro session if needed
      if (pomodoroPhase === 'work') {
        setPomodoroRemaining(pomodoroSettings.workDuration * 60);
      } else if (pomodoroPhase === 'shortBreak') {
        setPomodoroRemaining(pomodoroSettings.shortBreakDuration * 60);
      } else if (pomodoroPhase === 'longBreak') {
        setPomodoroRemaining(pomodoroSettings.longBreakDuration * 60);
      }
    }
  };
  
  // Play alarm sound
  const playAlarmSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = pomodoroSettings.alarmVolume / 100;
      audioRef.current.play().catch(err => console.error('Error playing alarm sound:', err));
    }
  };
  
  // Show snackbar
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };
  
  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get filtered time entries
  const getFilteredTimeEntries = (): TimeEntry[] => {
    return timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime).toISOString().substr(0, 10);
      return entryDate === filterDate;
    });
  };
  
  // Calculate total time for the day
  const getTotalTimeForDay = (): number => {
    return getFilteredTimeEntries().reduce((total, entry) => total + entry.duration, 0);
  };
  
  // Render timer display
  const renderTimerDisplay = () => {
    const progress = isPomodoroMode ? 
      (1 - (pomodoroRemaining / (pomodoroPhase === 'work' ? 
        pomodoroSettings.workDuration * 60 : 
        pomodoroPhase === 'shortBreak' ? 
          pomodoroSettings.shortBreakDuration * 60 : 
          pomodoroSettings.longBreakDuration * 60))) * 100 : 
      0;
    
    return (
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        {isPomodoroMode ? (
          <Box>
            <Typography variant="h6" color="textSecondary">
              {pomodoroPhase === 'work' ? 'Work' : pomodoroPhase === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex', m: 2 }}>
              <CircularProgress 
                variant="determinate" 
                value={progress} 
                size={200} 
                thickness={4} 
                color={pomodoroPhase === 'work' ? 'primary' : 'secondary'} 
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h2" component="div" color="text.primary">
                  {formatTime(pomodoroRemaining)}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={`Pomodoros: ${pomodoroCount}`} 
                color="primary" 
                variant="outlined" 
              />
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography variant="h1" component="div">
              {formatTime(elapsedTime)}
            </Typography>
            {activeTimer && (
              <Typography variant="body2" color="textSecondary">
                Started {formatDistanceToNow(new Date(activeTimer.startTime))} ago
              </Typography>
            )}
          </Box>
        )}
      </Box>
    );
  };
  
  // Render timer controls
  const renderTimerControls = () => {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        {!isRunning ? (
          activeTimer ? (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PlayIcon />} 
              onClick={resumeTimer}
              size="large"
              sx={{ mx: 1 }}
            >
              Resume
            </Button>
          ) : (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PlayIcon />} 
              onClick={startTimer}
              size="large"
              sx={{ mx: 1 }}
            >
              Start
            </Button>
          )
        ) : (
          <Button 
            variant="outlined" 
            color="primary" 
            startIcon={<PauseIcon />} 
            onClick={pauseTimer}
            size="large"
            sx={{ mx: 1 }}
          >
            Pause
          </Button>
        )}
        
        <Button 
          variant="outlined" 
          color="error" 
          startIcon={<StopIcon />} 
          onClick={stopTimer}
          size="large"
          sx={{ mx: 1 }}
          disabled={!activeTimer}
        >
          Stop
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<ResetIcon />} 
          onClick={resetTimer}
          size="large"
          sx={{ mx: 1 }}
          disabled={!activeTimer}
        >
          Reset
        </Button>
      </Box>
    );
  };
  
  // Render task selector
  const renderTaskSelector = () => {
    return (
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="task-select-label">Task (optional)</InputLabel>
          <Select
            labelId="task-select-label"
            value={currentTask}
            onChange={e => setCurrentTask(e.target.value as string)}
            label="Task (optional)"
            disabled={isRunning}
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
      </Box>
    );
  };
  
  // Render tags input
  const renderTagsInput = () => {
    return (
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Tags (comma separated)"
          value={tags.join(', ')}
          onChange={e => setTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
          disabled={isRunning}
          placeholder="project, meeting, coding..."
        />
      </Box>
    );
  };
  
  // Render notes input
  const renderNotesInput = () => {
    return (
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          multiline
          rows={2}
          placeholder="What are you working on?"
        />
      </Box>
    );
  };
  
  // Render pomodoro toggle
  const renderPomodoroToggle = () => {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography>Timer</Typography>
        <Switch
          checked={isPomodoroMode}
          onChange={togglePomodoroMode}
          disabled={isRunning}
        />
        <Typography>Pomodoro</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Pomodoro Settings">
          <IconButton
            onClick={openSettingsDialog}
            color="primary"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };
  
  // Render time entries list
  const renderTimeEntriesList = () => {
    const entries = getFilteredTimeEntries();
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <TextField
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            label="Date"
            InputLabelProps={{ shrink: true }}
          />
          <Typography variant="body2">
            Total: {formatTime(getTotalTimeForDay())}
          </Typography>
        </Box>
        
        {entries.length === 0 ? (
          <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
            No time entries for this date
          </Typography>
        ) : (
          <List>
            {entries.map(entry => (
              <ListItem 
                key={entry.id}
                sx={{ 
                  mb: 1, 
                  border: '1px solid', 
                  borderColor: 'divider', 
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
                onClick={() => setSelectedEntry(entry)}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {entry.taskName}
                      </Typography>
                      {entry.isPomodoro && (
                        <Chip 
                          size="small" 
                          label={`${entry.pomodoroCount} pomodoros`}
                          color="secondary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" component="span">
                        {format(parseISO(entry.startTime), 'HH:mm')} - {entry.endTime ? format(parseISO(entry.endTime), 'HH:mm') : 'Running'} ({formatTime(entry.duration)})
                      </Typography>
                      {entry.notes && (
                        <Typography variant="body2" color="textSecondary">
                          {entry.notes}
                        </Typography>
                      )}
                      <Box sx={{ mt: 0.5 }}>
                        {entry.tags.map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEntry(entry);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    );
  };
  
  // Render settings dialog
  const renderSettingsDialog = () => {
    return (
      <Dialog
        open={settingsDialogOpen}
        onClose={closeSettingsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Pomodoro Settings
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle2" gutterBottom>
            Work Duration (minutes)
          </Typography>
          <Slider
            value={pomodoroSettings.workDuration}
            onChange={(_e, newValue) => 
              setPomodoroSettings({
                ...pomodoroSettings,
                workDuration: newValue as number
              })
            }
            min={5}
            max={60}
            step={5}
            marks
            valueLabelDisplay="auto"
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Short Break Duration (minutes)
          </Typography>
          <Slider
            value={pomodoroSettings.shortBreakDuration}
            onChange={(_e, newValue) => 
              setPomodoroSettings({
                ...pomodoroSettings,
                shortBreakDuration: newValue as number
              })
            }
            min={1}
            max={15}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Long Break Duration (minutes)
          </Typography>
          <Slider
            value={pomodoroSettings.longBreakDuration}
            onChange={(_e, newValue) => 
              setPomodoroSettings({
                ...pomodoroSettings,
                longBreakDuration: newValue as number
              })
            }
            min={5}
            max={30}
            step={5}
            marks
            valueLabelDisplay="auto"
          />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Long Break Interval (pomodoros)
          </Typography>
          <Slider
            value={pomodoroSettings.longBreakInterval}
            onChange={(_e, newValue) => 
              setPomodoroSettings({
                ...pomodoroSettings,
                longBreakInterval: newValue as number
              })
            }
            min={2}
            max={6}
            step={1}
            marks
            valueLabelDisplay="auto"
          />
          
          <Box sx={{ mt: 3 }}>
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Auto Start Breaks
              </Typography>
              <Switch
                checked={pomodoroSettings.autoStartBreaks}
                onChange={e => 
                  setPomodoroSettings({
                    ...pomodoroSettings,
                    autoStartBreaks: e.target.checked
                  })
                }
              />
            </FormControl>
          </Box>
          
          <Box sx={{ mt: 1 }}>
            <FormControl>
              <Typography variant="subtitle2" gutterBottom>
                Auto Start Pomodoros
              </Typography>
              <Switch
                checked={pomodoroSettings.autoStartPomodoros}
                onChange={e => 
                  setPomodoroSettings({
                    ...pomodoroSettings,
                    autoStartPomodoros: e.target.checked
                  })
                }
              />
            </FormControl>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="alarm-sound-label">Alarm Sound</InputLabel>
              <Select
                labelId="alarm-sound-label"
                value={pomodoroSettings.alarmSound}
                onChange={e => 
                  setPomodoroSettings({
                    ...pomodoroSettings,
                    alarmSound: e.target.value as string
                  })
                }
                label="Alarm Sound"
              >
                <MenuItem value="bell">Bell</MenuItem>
                <MenuItem value="digital">Digital</MenuItem>
                <MenuItem value="classic">Classic</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Alarm Volume
            </Typography>
            <Slider
              value={pomodoroSettings.alarmVolume}
              onChange={(_e, newValue) => 
                setPomodoroSettings({
                  ...pomodoroSettings,
                  alarmVolume: newValue as number
                })
              }
              min={0}
              max={100}
              step={10}
              marks
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeSettingsDialog}>Cancel</Button>
          <Button 
            onClick={saveSettings}
            color="primary"
            variant="contained"
          >
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  // Render delete dialog
  const renderDeleteDialog = () => {
    return (
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete Time Entry
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this time entry? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedEntry && deleteTimeEntry(selectedEntry.id)}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Time Tracking
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            {/* Timer/Pomodoro Controls */}
            {renderPomodoroToggle()}
            {renderTimerDisplay()}
            {renderTimerControls()}
            
            <Divider sx={{ my: 3 }} />
            
            {/* Task and Notes */}
            {renderTaskSelector()}
            {renderTagsInput()}
            {renderNotesInput()}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="time tracking tabs"
              >
                <Tab 
                  label="Today" 
                  icon={<TimeIcon />} 
                  iconPosition="start" 
                />
                <Tab 
                  label="Reports" 
                  icon={<ReportsIcon />} 
                  iconPosition="start" 
                />
              </Tabs>
            </Box>
            
            <TabPanel value={activeTab} index={0}>
              {renderTimeEntriesList()}
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              {/* Placeholder for future reports feature */}
              <Typography align="center" color="textSecondary" sx={{ py: 4 }}>
                Time tracking reports will be available in a future update.
              </Typography>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Settings Dialog */}
      {renderSettingsDialog()}
      
      {/* Delete Confirmation Dialog */}
      {renderDeleteDialog()}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TimeTrackingPanel; 