import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../stores/store';
import { Badge, IconButton, Menu, MenuItem, List, ListItem, ListItemText, ListItemIcon, Typography, Divider, Box } from '@mui/material';
import { Notifications as NotificationsIcon, CheckCircle, ErrorOutline, Delete } from '@mui/icons-material';
import { requestNotificationPermission, startDeadlineNotifications, stopDeadlineNotifications } from '../utils/notifications';
import { Task, updateTask } from '../stores/tasksSlice';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'deadline' | 'overdue' | 'reminder' | 'system';
  taskId?: string;
  timestamp: Date;
  isRead: boolean;
}

const NotificationCenter: React.FC = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationInterval, setNotificationInterval] = useState<number | null>(null);

  // Request notification permission on component mount
  useEffect(() => {
    const requestPermission = async () => {
      await requestNotificationPermission();
    };
    
    requestPermission();
  }, []);

  // Start deadline notifications on component mount
  useEffect(() => {
    if (tasks.length > 0) {
      const intervalId = startDeadlineNotifications(tasks);
      setNotificationInterval(intervalId);
      
      // Generate initial notifications based on task deadlines
      const newNotifications: Notification[] = [];
      
      const now = new Date();
      const oneDayInMs = 24 * 60 * 60 * 1000;
      
      tasks.forEach((task: Task) => {
        if (task.status === 'completed' || !task.endDate) {
          return;
        }
        
        const endDate = new Date(task.endDate);
        const timeUntilDeadline = endDate.getTime() - now.getTime();
        
        // Due today
        if (timeUntilDeadline >= 0 && timeUntilDeadline <= oneDayInMs) {
          const hoursLeft = Math.ceil(timeUntilDeadline / (60 * 60 * 1000));
          
          newNotifications.push({
            id: `deadline-${task.id}`,
            title: 'Task Due Soon',
            message: `"${task.title}" is due in ${hoursLeft} hours.`,
            type: 'deadline',
            taskId: task.id,
            timestamp: new Date(),
            isRead: false
          });
        }
        
        // Overdue
        if (timeUntilDeadline < 0) {
          const daysOverdue = Math.ceil(Math.abs(timeUntilDeadline) / oneDayInMs);
          
          newNotifications.push({
            id: `overdue-${task.id}`,
            title: 'Overdue Task',
            message: `"${task.title}" is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}.`,
            type: 'overdue',
            taskId: task.id,
            timestamp: new Date(),
            isRead: false
          });
        }
      });
      
      setNotifications(prev => [...prev, ...newNotifications]);
    }
    
    return () => {
      if (notificationInterval) {
        stopDeadlineNotifications(notificationInterval);
      }
    };
  }, [tasks]);

  // Handle menu open/close
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Mark notification as read
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Handle completing a task from a notification
  const handleCompleteTask = (taskId: string) => {
    dispatch(
      updateTask({
        id: taskId,
        status: 'completed'
      })
    );
    
    // Update related notifications
    setNotifications(prev =>
      prev.map(notification =>
        notification.taskId === taskId
          ? { ...notification, isRead: true }
          : notification
      )
    );
    
    handleClose();
  };

  // Remove a notification
  const handleRemoveNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Clear all notifications
  const handleClearAll = () => {
    setNotifications([]);
    handleClose();
  };

  // Count unread notifications
  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <>
      <IconButton
        size="large"
        color="inherit"
        onClick={handleClick}
        aria-label="show notifications"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 350
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          {notifications.length > 0 && (
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer' }}
              onClick={handleClearAll}
            >
              Clear All
            </Typography>
          )}
        </Box>
        
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2">No notifications</Typography>
          </MenuItem>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{ 
                    backgroundColor: notification.isRead ? 'inherit' : 'rgba(0, 0, 0, 0.04)',
                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
                  }}
                  secondaryAction={
                    <Box>
                      {notification.taskId && (
                        <IconButton
                          edge="end"
                          aria-label="complete"
                          onClick={() => handleCompleteTask(notification.taskId!)}
                          size="small"
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveNotification(notification.id)}
                        size="small"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <ListItemIcon>
                    {notification.type === 'overdue' ? (
                      <ErrorOutline color="error" />
                    ) : (
                      <NotificationsIcon color="primary" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {notification.message}
                        </Typography>
                        <Typography component="span" variant="caption" display="block" color="text.secondary">
                          {new Date(notification.timestamp).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationCenter; 