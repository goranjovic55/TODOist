import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Chip,
  Badge,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Button,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  NotificationsActive as UrgentIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  AssignmentTurnedIn as CompletedIcon,
  Error as BlockedIcon,
  Delete as DeleteIcon,
  Done as MarkReadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';
import { format, isToday, isYesterday, isTomorrow, isPast } from 'date-fns';

// Notification types
type NotificationType = 'assignment' | 'deadline' | 'completion' | 'blocked' | 'mention' | 'system';
type NotificationPriority = 'normal' | 'high' | 'urgent';

// Notification interface
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string; // ISO date string
  isRead: boolean;
  priority: NotificationPriority;
  taskId?: string;
  userId?: string;
  actionUrl?: string;
}

// Component for displaying task notifications
const TaskNotificationCenter: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // State for notification center
  const [tabValue, setTabValue] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilters, setSelectedFilters] = useState<NotificationType[]>([]);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<{
    element: HTMLElement | null;
    notificationId: string | null;
  }>({ element: null, notificationId: null });
  
  // Mock notifications - in a real app, these would come from API/Redux
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'assignment',
      title: 'Task assigned to you',
      message: 'Project homepage redesign has been assigned to you',
      createdAt: new Date().toISOString(),
      isRead: false,
      priority: 'normal',
      taskId: '123'
    },
    {
      id: '2',
      type: 'deadline',
      title: 'Task due soon',
      message: 'API integration is due tomorrow',
      createdAt: new Date().toISOString(),
      isRead: false,
      priority: 'high',
      taskId: '456'
    },
    {
      id: '3',
      type: 'completion',
      title: 'Task completed',
      message: 'Sara has completed Database setup',
      createdAt: new Date(Date.now() - 86400000).toISOString(), // yesterday
      isRead: true,
      priority: 'normal',
      taskId: '789'
    },
    {
      id: '4',
      type: 'blocked',
      title: 'Task blocked',
      message: 'UI component library is blocked waiting for design assets',
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      isRead: false,
      priority: 'urgent',
      taskId: '101'
    },
    {
      id: '5',
      type: 'mention',
      title: 'You were mentioned',
      message: 'Alex mentioned you in a comment on Test automation task',
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      isRead: true,
      priority: 'normal',
      taskId: '112'
    }
  ]);
  
  // Stats for notification counts
  const notificationStats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    const urgent = notifications.filter(n => n.priority === 'urgent').length;
    const today = notifications.filter(n => isToday(new Date(n.createdAt))).length;
    
    return { total, unread, urgent, today };
  }, [notifications]);
  
  // Effect to generate task-related notifications
  useEffect(() => {
    // This would typically be done server-side or in a middleware
    const dueTodayTasks = tasks.filter(task => 
      task.status !== 'completed' && 
      task.endDate && 
      isToday(new Date(task.endDate))
    );
    
    const overdueNotCompleted = tasks.filter(task => 
      task.status !== 'completed' && 
      task.endDate && 
      isPast(new Date(task.endDate)) &&
      !isToday(new Date(task.endDate))
    );
    
    // Create new notifications array with real task data
    const taskNotifications: Notification[] = [];
    
    // Add due today notifications
    dueTodayTasks.forEach(task => {
      if (!notifications.some(n => n.taskId === task.id && n.type === 'deadline')) {
        taskNotifications.push({
          id: `due-${task.id}`,
          type: 'deadline',
          title: 'Task due today',
          message: `${task.title} is due today`,
          createdAt: new Date().toISOString(),
          isRead: false,
          priority: 'high',
          taskId: task.id
        });
      }
    });
    
    // Add overdue notifications
    overdueNotCompleted.forEach(task => {
      if (!notifications.some(n => n.taskId === task.id && n.type === 'deadline')) {
        taskNotifications.push({
          id: `overdue-${task.id}`,
          type: 'deadline',
          title: 'Task overdue',
          message: `${task.title} is overdue`,
          createdAt: new Date().toISOString(),
          isRead: false,
          priority: 'urgent',
          taskId: task.id
        });
      }
    });
    
    // Only add new notifications if we have any
    if (taskNotifications.length > 0) {
      setNotifications(prev => [...taskNotifications, ...prev]);
    }
  }, [tasks]);
  
  // Filter notifications based on tab and search
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];
    
    // Apply tab filter
    if (tabValue === 1) {
      filtered = filtered.filter(n => !n.isRead);
    } else if (tabValue === 2) {
      filtered = filtered.filter(n => n.priority === 'high' || n.priority === 'urgent');
    }
    
    // Apply search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search) || 
        n.message.toLowerCase().includes(search)
      );
    }
    
    // Apply type filters
    if (selectedFilters.length > 0) {
      filtered = filtered.filter(n => selectedFilters.includes(n.type));
    }
    
    return filtered;
  }, [notifications, tabValue, searchText, selectedFilters]);
  
  // Format date for display
  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle marking notification as read
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
    handleCloseNotificationMenu();
  };
  
  // Handle deleting notification
  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    handleCloseNotificationMenu();
  };
  
  // Handle marking all as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };
  
  // Handle clearing all notifications
  const handleClearAllNotifications = () => {
    setNotifications([]);
  };
  
  // Handle filter menu open
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle filter selection
  const handleFilterSelect = (type: NotificationType) => {
    setSelectedFilters(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type) 
        : [...prev, type]
    );
  };
  
  // Handle notification menu open
  const handleOpenNotificationMenu = (event: React.MouseEvent<HTMLElement>, id: string) => {
    setNotificationMenuAnchor({ element: event.currentTarget, notificationId: id });
  };
  
  // Handle notification menu close
  const handleCloseNotificationMenu = () => {
    setNotificationMenuAnchor({ element: null, notificationId: null });
  };
  
  // Get avatar icon for notification type
  const getNotificationAvatar = (type: NotificationType, priority: NotificationPriority) => {
    switch (type) {
      case 'assignment':
        return <PersonIcon />;
      case 'deadline':
        return <DateIcon />;
      case 'completion':
        return <CompletedIcon />;
      case 'blocked':
        return <BlockedIcon />;
      case 'mention':
        return <PersonIcon />;
      case 'system':
      default:
        return <NotificationIcon />;
    }
  };
  
  // Get color for notification priority
  const getNotificationColor = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'normal':
      default:
        return 'primary';
    }
  };
  
  // Get label for notification type
  const getNotificationTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'assignment':
        return 'Assignment';
      case 'deadline':
        return 'Deadline';
      case 'completion':
        return 'Completion';
      case 'blocked':
        return 'Blocked';
      case 'mention':
        return 'Mention';
      case 'system':
        return 'System';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" display="flex" alignItems="center">
          <NotificationIcon sx={{ mr: 1 }} />
          Notifications
          {notificationStats.unread > 0 && (
            <Badge 
              badgeContent={notificationStats.unread} 
              color="error" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        
        <Box>
          <Tooltip title="Mark all as read">
            <Button 
              size="small" 
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllAsRead}
              disabled={notificationStats.unread === 0}
            >
              Mark all read
            </Button>
          </Tooltip>
          
          <Tooltip title="Clear all notifications">
            <Button 
              size="small" 
              startIcon={<DeleteIcon />}
              onClick={handleClearAllNotifications}
              disabled={notifications.length === 0}
              color="error"
              sx={{ ml: 1 }}
            >
              Clear all
            </Button>
          </Tooltip>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Notification filters and search */}
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All" />
          <Tab 
            label={
              <Badge badgeContent={notificationStats.unread} color="error">
                Unread
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={notificationStats.urgent} color="error">
                Important
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={notificationStats.today} color="primary">
                Today
              </Badge>
            } 
          />
        </Tabs>
      </Box>
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          placeholder="Search notifications..."
          size="small"
          fullWidth
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={handleFilterClick}
          size="small"
          color={selectedFilters.length > 0 ? 'primary' : 'inherit'}
        >
          Filter
          {selectedFilters.length > 0 && (
            <Badge 
              badgeContent={selectedFilters.length} 
              color="primary" 
              sx={{ ml: 1 }}
            />
          )}
        </Button>
        
        <Menu
          anchorEl={filterAnchorEl}
          open={Boolean(filterAnchorEl)}
          onClose={handleFilterClose}
        >
          <MenuItem>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Filter by type
            </Typography>
          </MenuItem>
          <Divider />
          {['assignment', 'deadline', 'completion', 'blocked', 'mention', 'system'].map((type) => (
            <MenuItem 
              key={type}
              onClick={() => handleFilterSelect(type as NotificationType)}
              dense
            >
              <Checkbox 
                checked={selectedFilters.includes(type as NotificationType)} 
                size="small" 
              />
              {getNotificationTypeLabel(type as NotificationType)}
            </MenuItem>
          ))}
        </Menu>
      </Box>
      
      {/* Notifications list */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {filteredNotifications.length > 0 ? (
          <List sx={{ px: 1 }}>
            {filteredNotifications.map(notification => (
              <ListItem 
                key={notification.id}
                alignItems="flex-start"
                sx={{ 
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  border: 1,
                  borderColor: 'divider'
                }}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    aria-label="more" 
                    onClick={(e) => handleOpenNotificationMenu(e, notification.id)}
                  >
                    <MoreIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: `${getNotificationColor(notification.priority)}.light`,
                      color: `${getNotificationColor(notification.priority)}.main`
                    }}
                  >
                    {getNotificationAvatar(notification.type, notification.priority)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                      >
                        {notification.title}
                      </Typography>
                      
                      <Chip 
                        label={getNotificationTypeLabel(notification.type)} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 20 }}
                      />
                      
                      {notification.priority !== 'normal' && (
                        <Chip
                          icon={notification.priority === 'urgent' ? <UrgentIcon /> : undefined}
                          label={notification.priority.toUpperCase()}
                          size="small"
                          color={getNotificationColor(notification.priority) as any}
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                      >
                        {formatNotificationDate(notification.createdAt)}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              opacity: 0.7
            }}
          >
            <NotificationIcon sx={{ fontSize: 48, mb: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle1" color="text.secondary">
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFilters.length > 0 || searchText 
                ? 'Try changing your filters or search' 
                : 'You\'re all caught up!'}
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Notification action menu */}
      <Menu
        anchorEl={notificationMenuAnchor.element}
        open={Boolean(notificationMenuAnchor.element)}
        onClose={handleCloseNotificationMenu}
      >
        <MenuItem
          onClick={() => {
            if (notificationMenuAnchor.notificationId) {
              handleMarkAsRead(notificationMenuAnchor.notificationId);
            }
          }}
        >
          <ListItemIcon>
            <MarkReadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Mark as read</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (notificationMenuAnchor.notificationId) {
              handleDeleteNotification(notificationMenuAnchor.notificationId);
            }
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

// Mock checkbox component as it's used in the code but not imported
const Checkbox = ({ checked, size }: { checked: boolean, size: 'small' | 'medium' }) => (
  <Box 
    component="span" 
    sx={{ 
      display: 'inline-block',
      width: size === 'small' ? 18 : 24,
      height: size === 'small' ? 18 : 24,
      borderRadius: '2px',
      border: '1px solid',
      borderColor: checked ? 'primary.main' : 'action.disabled',
      bgcolor: checked ? 'primary.main' : 'transparent',
      mr: 1,
      position: 'relative',
      '&::after': checked ? {
        content: '""',
        position: 'absolute',
        display: 'block',
        left: '5px',
        top: '2px',
        width: '5px',
        height: '10px',
        borderRight: '2px solid',
        borderBottom: '2px solid',
        transform: 'rotate(45deg)',
        borderColor: 'white'
      } : {}
    }} 
  />
);

export default TaskNotificationCenter; 