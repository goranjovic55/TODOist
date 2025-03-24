import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Button,
  Divider,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Tooltip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
  Done as DoneIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  NotificationsActive as ActiveIcon,
  NotificationsOff as MuteIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Refresh as RecurringIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { format, isToday, isTomorrow, addDays, isAfter, isBefore } from 'date-fns';

// Define notification types
type NotificationType = 'deadline' | 'reminder' | 'system' | 'update' | 'recurring';

// Notification priority levels
type Priority = 'low' | 'medium' | 'high';

// Notification interface
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;  // Optional reference to related task
  createdAt: Date;
  read: boolean;
  priority: Priority;
  actionable: boolean;
  expiresAt?: Date;
  actions?: NotificationAction[];
}

// Action that can be taken on a notification
interface NotificationAction {
  label: string;
  handler: () => void;
}

// Settings for notification preferences
interface NotificationSettings {
  enableNotifications: boolean;
  enableDesktopNotifications: boolean;
  enableSoundAlerts: boolean;
  notifyDeadlines: boolean;
  deadlineAdvanceDays: number;
  notifyUpdates: boolean;
  notifyRecurring: boolean;
  notifySystemUpdates: boolean;
}

// Default notification settings
const defaultSettings: NotificationSettings = {
  enableNotifications: true,
  enableDesktopNotifications: true,
  enableSoundAlerts: true,
  notifyDeadlines: true,
  deadlineAdvanceDays: 2,
  notifyUpdates: true,
  notifyRecurring: true,
  notifySystemUpdates: true
};

const NotificationCenter: React.FC = () => {
  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  
  // Redux selectors
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // Load notifications and settings on mount
  useEffect(() => {
    // Load notifications from localStorage
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        // Convert string dates to Date objects
        const formattedNotifications = parsedNotifications.map((notification: any) => ({
          ...notification,
          createdAt: new Date(notification.createdAt),
          expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined
        }));
        setNotifications(formattedNotifications);
      } catch (error) {
        console.error('Error parsing stored notifications:', error);
        // Initialize with empty array if parsing fails
        setNotifications([]);
      }
    } else {
      // Initialize with sample notifications for demo
      const sampleNotifications = getSampleNotifications();
      setNotifications(sampleNotifications);
      localStorage.setItem('notifications', JSON.stringify(sampleNotifications));
    }
    
    // Load settings from localStorage
    const storedSettings = localStorage.getItem('notificationSettings');
    if (storedSettings) {
      try {
        const parsedSettings = JSON.parse(storedSettings);
        setSettings(parsedSettings);
      } catch (error) {
        console.error('Error parsing stored notification settings:', error);
        // Use default settings if parsing fails
        setSettings(defaultSettings);
      }
    } else {
      // Initialize with default settings
      setSettings(defaultSettings);
      localStorage.setItem('notificationSettings', JSON.stringify(defaultSettings));
    }
  }, []);
  
  // Update unread count when notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.read).length;
    setUnreadCount(count);
    
    // Request permission for desktop notifications if enabled
    if (settings.enableDesktopNotifications && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    
    // Save notifications to localStorage whenever they change
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications, settings.enableDesktopNotifications]);
  
  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);
  
  // Check for upcoming deadlines and generate notifications
  useEffect(() => {
    if (!settings.enableNotifications || !settings.notifyDeadlines) return;
    
    // Check tasks for upcoming deadlines
    const currentDate = new Date();
    const deadlineNotifications = tasks
      .filter(task => task.dueDate && !task.completed)
      .filter(task => {
        const dueDate = new Date(task.dueDate as Date);
        // Check if the task is due within the specified advance days and we haven't already notified
        const notificationDate = addDays(dueDate, -settings.deadlineAdvanceDays);
        return isAfter(currentDate, notificationDate) && isBefore(currentDate, dueDate);
      })
      .map(task => {
        // Check if we already have a notification for this task deadline
        const existingNotification = notifications.find(
          n => n.taskId === task.id && n.type === 'deadline'
        );
        
        if (existingNotification) return null; // Skip if notification already exists
        
        // Create a new deadline notification
        const dueDate = new Date(task.dueDate as Date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        let priority: Priority = 'medium';
        if (isToday(dueDate)) priority = 'high';
        else if (isTomorrow(dueDate)) priority = 'medium';
        else priority = 'low';
        
        return {
          id: `deadline_${task.id}_${Date.now()}`,
          type: 'deadline' as NotificationType,
          title: `Upcoming Deadline: ${task.title}`,
          message: isToday(dueDate) 
            ? `Task is due today!` 
            : isTomorrow(dueDate) 
              ? `Task is due tomorrow.` 
              : `Task is due in ${daysUntilDue} days.`,
          taskId: task.id,
          createdAt: new Date(),
          read: false,
          priority,
          actionable: true,
          expiresAt: dueDate,
          actions: [
            {
              label: 'View Task',
              handler: () => console.log('View task:', task.id)
            },
            {
              label: 'Mark Complete',
              handler: () => console.log('Mark task complete:', task.id)
            }
          ]
        };
      })
      .filter(Boolean) as Notification[];
    
    // Add new notifications
    if (deadlineNotifications.length > 0) {
      setNotifications(prev => [...deadlineNotifications, ...prev]);
      
      // Show desktop notification for new deadline notifications if enabled
      if (settings.enableDesktopNotifications && Notification.permission === 'granted') {
        deadlineNotifications.forEach(notification => {
          const desktopNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
          
          desktopNotification.onclick = () => {
            window.focus();
            // Handle click action
          };
        });
      }
    }
  }, [tasks, settings.enableNotifications, settings.notifyDeadlines, settings.deadlineAdvanceDays, settings.enableDesktopNotifications, notifications]);
  
  // Clean up expired notifications
  useEffect(() => {
    const currentDate = new Date();
    const updatedNotifications = notifications.filter(notification => 
      !notification.expiresAt || isAfter(new Date(notification.expiresAt), currentDate)
    );
    
    if (updatedNotifications.length !== notifications.length) {
      setNotifications(updatedNotifications);
    }
  }, [notifications]);
  
  // Handle notification click
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  // Handle notification menu close
  const handleNotificationMenuClose = () => {
    setNotificationAnchorEl(null);
  };
  
  // Handle notification item click
  const handleNotificationClick = (notification: Notification) => {
    // Update notification to read status
    const updatedNotifications = notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    
    // Handle specific notification type actions
    if (notification.type === 'deadline' && notification.taskId) {
      // Navigate to task or show task details
      console.log('Navigate to task:', notification.taskId);
      
      // For demo, show snackbar
      setSnackbarMessage(`Viewing task: ${notification.title}`);
      setSnackbarOpen(true);
    }
  };
  
  // Handle notification action button click
  const handleActionClick = (notification: Notification, action: NotificationAction, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click
    action.handler();
    
    // Update notification to read status
    const updatedNotifications = notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    
    // Close menu
    handleNotificationMenuClose();
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    setSnackbarMessage('All notifications marked as read');
    setSnackbarOpen(true);
  };
  
  // Delete notification
  const deleteNotification = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click
    const updatedNotifications = notifications.filter(notification => notification.id !== id);
    setNotifications(updatedNotifications);
    setSnackbarMessage('Notification deleted');
    setSnackbarOpen(true);
  };
  
  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
    handleNotificationMenuClose();
    setSnackbarMessage('All notifications cleared');
    setSnackbarOpen(true);
  };
  
  // Toggle settings dialog
  const toggleSettingsDialog = () => {
    setSettingsOpen(!settingsOpen);
  };
  
  // Handle settings change
  const handleSettingChange = (setting: keyof NotificationSettings, value: any) => {
    setSettings({
      ...settings,
      [setting]: value
    });
  };
  
  // Update the notification icon based on unread status
  const getNotificationIcon = () => {
    if (unreadCount > 0) {
      return (
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      );
    }
    return <NotificationsIcon />;
  };
  
  // Get icon for notification type
  const getTypeIcon = (type: NotificationType, priority: Priority) => {
    switch (type) {
      case 'deadline':
        return <TimeIcon color={priority === 'high' ? 'error' : (priority === 'medium' ? 'warning' : 'action')} />;
      case 'reminder':
        return <InfoIcon color="primary" />;
      case 'system':
        return <SettingsIcon color="action" />;
      case 'update':
        return <UpdateIcon color="info" />;
      case 'recurring':
        return <RecurringIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };
  
  // Get the priority color
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'error.main';
      case 'medium':
        return 'warning.main';
      case 'low':
        return 'success.main';
      default:
        return 'text.primary';
    }
  };
  
  // Handle tab change in notification menu
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(notification => !notification.read);
      case 2: // Deadlines
        return notifications.filter(notification => notification.type === 'deadline');
      case 3: // System
        return notifications.filter(notification => 
          notification.type === 'system' || notification.type === 'update' || notification.type === 'recurring'
        );
      default:
        return notifications;
    }
  };
  
  // Get formatted date for notification
  const getFormattedDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };
  
  // Add a notification (for testing or system notifications)
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}`,
      createdAt: new Date()
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show desktop notification if enabled
    if (settings.enableDesktopNotifications && Notification.permission === 'granted') {
      const desktopNotification = new Notification(newNotification.title, {
        body: newNotification.message,
        icon: '/favicon.ico'
      });
      
      desktopNotification.onclick = () => {
        window.focus();
        // Handle click action
      };
    }
    
    return newNotification.id;
  };
  
  return (
    <>
      {/* Notification Icon with Badge */}
      <IconButton 
        color="inherit" 
        aria-label={`${unreadCount} unread notifications`}
        onClick={handleNotificationMenuOpen}
      >
        {getNotificationIcon()}
      </IconButton>
      
      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            maxWidth: 360,
            width: '100%',
            maxHeight: 'calc(100% - 32px)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Notifications
          </Typography>
          <Box>
            <Tooltip title="Notification Settings">
              <IconButton size="small" onClick={toggleSettingsDialog}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Mark All as Read">
              <IconButton 
                size="small" 
                onClick={markAllAsRead}
                disabled={notifications.filter(n => !n.read).length === 0}
              >
                <DoneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Clear All">
              <IconButton 
                size="small" 
                onClick={clearAllNotifications}
                disabled={notifications.length === 0}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Divider />
        
        {/* Tabs for filtering notifications */}
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="fullWidth" 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" id="notification-tab-0" />
          <Tab 
            label={
              <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                Unread
              </Badge>
            } 
            id="notification-tab-1" 
          />
          <Tab label="Deadlines" id="notification-tab-2" />
          <Tab label="System" id="notification-tab-3" />
        </Tabs>
        
        {/* Notification List */}
        <List sx={{ p: 0, maxHeight: 400, overflowY: 'auto' }}>
          {getFilteredNotifications().length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary" variant="body2">
                No notifications to display
              </Typography>
            </Box>
          ) : (
            getFilteredNotifications().map((notification) => (
              <ListItem 
                key={notification.id}
                button 
                alignItems="flex-start"
                onClick={() => handleNotificationClick(notification)}
                sx={{ 
                  opacity: notification.read ? 0.7 : 1,
                  backgroundColor: notification.read ? 'transparent' : 'action.hover',
                  borderLeft: 3,
                  borderColor: notification.read ? 'transparent' : getPriorityColor(notification.priority)
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.paper' }}>
                    {getTypeIcon(notification.type, notification.priority)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography 
                      variant="subtitle2" 
                      component="div"
                      sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography 
                        variant="body2" 
                        color="text.primary"
                        component="div"
                        sx={{ mt: 0.5, mb: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                      
                      {notification.actions && notification.actions.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                          {notification.actions.map((action, index) => (
                            <Button 
                              key={index} 
                              size="small" 
                              variant="outlined"
                              onClick={(e) => handleActionClick(notification, action, e)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </Box>
                      )}
                      
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        component="div"
                        sx={{ mt: 0.5 }}
                      >
                        {getFormattedDate(notification.createdAt)}
                      </Typography>
                    </React.Fragment>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    size="small"
                    onClick={(e) => deleteNotification(notification.id, e)}
                    sx={{ mt: 2 }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      </Menu>
      
      {/* Settings Dialog */}
      <Dialog 
        open={settingsOpen} 
        onClose={toggleSettingsDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Notification Settings</DialogTitle>
        <DialogContent dividers>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              General Settings
            </Typography>
            <Box sx={{ ml: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableNotifications}
                    onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                  />
                }
                label="Enable Notifications"
              />
              
              <FormControlLabel
                disabled={!settings.enableNotifications}
                control={
                  <Switch
                    checked={settings.enableDesktopNotifications}
                    onChange={(e) => handleSettingChange('enableDesktopNotifications', e.target.checked)}
                  />
                }
                label="Enable Desktop Notifications"
              />
              
              <FormControlLabel
                disabled={!settings.enableNotifications}
                control={
                  <Switch
                    checked={settings.enableSoundAlerts}
                    onChange={(e) => handleSettingChange('enableSoundAlerts', e.target.checked)}
                  />
                }
                label="Enable Sound Alerts"
              />
            </Box>
          </Paper>
          
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Notification Types
            </Typography>
            <Box sx={{ ml: 2 }}>
              <FormControlLabel
                disabled={!settings.enableNotifications}
                control={
                  <Switch
                    checked={settings.notifyDeadlines}
                    onChange={(e) => handleSettingChange('notifyDeadlines', e.target.checked)}
                  />
                }
                label="Task Deadlines"
              />
              
              {settings.notifyDeadlines && (
                <Box sx={{ ml: 4, mt: 1, mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Notify me of deadlines this many days in advance:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                      size="small" 
                      variant="outlined"
                      disabled={settings.deadlineAdvanceDays <= 1}
                      onClick={() => handleSettingChange('deadlineAdvanceDays', settings.deadlineAdvanceDays - 1)}
                    >
                      -
                    </Button>
                    <Typography sx={{ mx: 2 }}>
                      {settings.deadlineAdvanceDays} {settings.deadlineAdvanceDays === 1 ? 'day' : 'days'}
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined"
                      disabled={settings.deadlineAdvanceDays >= 7}
                      onClick={() => handleSettingChange('deadlineAdvanceDays', settings.deadlineAdvanceDays + 1)}
                    >
                      +
                    </Button>
                  </Box>
                </Box>
              )}
              
              <FormControlLabel
                disabled={!settings.enableNotifications}
                control={
                  <Switch
                    checked={settings.notifyUpdates}
                    onChange={(e) => handleSettingChange('notifyUpdates', e.target.checked)}
                  />
                }
                label="Task Updates & Changes"
              />
              
              <FormControlLabel
                disabled={!settings.enableNotifications}
                control={
                  <Switch
                    checked={settings.notifyRecurring}
                    onChange={(e) => handleSettingChange('notifyRecurring', e.target.checked)}
                  />
                }
                label="Recurring Task Generation"
              />
              
              <FormControlLabel
                disabled={!settings.enableNotifications}
                control={
                  <Switch
                    checked={settings.notifySystemUpdates}
                    onChange={(e) => handleSettingChange('notifySystemUpdates', e.target.checked)}
                  />
                }
                label="System Updates"
              />
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleSettingsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

// Sample notifications for testing
const getSampleNotifications = (): Notification[] => {
  const now = new Date();
  
  return [
    {
      id: '1',
      type: 'deadline',
      title: 'Deadline: Project Proposal',
      message: 'Project proposal is due today!',
      taskId: '12345',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: false,
      priority: 'high',
      actionable: true,
      actions: [
        {
          label: 'View Task',
          handler: () => console.log('View task: 12345')
        },
        {
          label: 'Mark Complete',
          handler: () => console.log('Mark task complete: 12345')
        }
      ]
    },
    {
      id: '2',
      type: 'update',
      title: 'Task Updated: Team Meeting',
      message: 'The meeting time has been changed to 3:00 PM.',
      taskId: '23456',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5), // 5 hours ago
      read: true,
      priority: 'medium',
      actionable: true,
      actions: [
        {
          label: 'View Task',
          handler: () => console.log('View task: 23456')
        }
      ]
    },
    {
      id: '3',
      type: 'system',
      title: 'System Update',
      message: 'TODOist has been updated to version 1.5.0 with new recurring tasks feature.',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      read: false,
      priority: 'low',
      actionable: false
    },
    {
      id: '4',
      type: 'recurring',
      title: 'Recurring Task Created',
      message: 'Weekly Team Meeting has been scheduled for every Monday.',
      taskId: '34567',
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      read: true,
      priority: 'low',
      actionable: true,
      actions: [
        {
          label: 'View Recurring',
          handler: () => console.log('View recurring task: 34567')
        }
      ]
    },
    {
      id: '5',
      type: 'deadline',
      title: 'Deadline: Client Presentation',
      message: 'Client presentation is due tomorrow.',
      taskId: '45678',
      createdAt: new Date(now.getTime() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      priority: 'medium',
      actionable: true,
      actions: [
        {
          label: 'View Task',
          handler: () => console.log('View task: 45678')
        }
      ]
    }
  ];
};

export default NotificationCenter; 