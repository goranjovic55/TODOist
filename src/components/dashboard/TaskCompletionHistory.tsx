import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CompletedIcon,
  Delete as DeleteIcon,
  Undo as UndoIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../stores/store';
import { updateTaskStatus, deleteTask } from '../../stores/tasksSlice';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

interface TaskCompletionHistoryProps {
  limit?: number;
}

const TaskCompletionHistory: React.FC<TaskCompletionHistoryProps> = ({ limit = 10 }) => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // Get completed tasks sorted by completion date
  const completedTasks = useMemo(() => {
    return tasks
      .filter(task => task.status === 'completed' && task.completedAt)
      .sort((a, b) => {
        // Sort by completion date, descending (newest first)
        const dateA = new Date(a.completedAt || 0);
        const dateB = new Date(b.completedAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  }, [tasks, limit]);
  
  // Handle undo completion (mark as in progress)
  const handleUndoCompletion = (taskId: string) => {
    dispatch(updateTaskStatus({ id: taskId, status: 'in_progress' }));
  };
  
  // Handle delete task
  const handleDeleteTask = (taskId: string) => {
    dispatch(deleteTask(taskId));
  };
  
  // Get initials for avatar
  const getInitials = (title: string): string => {
    return title
      .split(' ')
      .map(word => word[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };
  
  // Get color based on task priority
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return '#f44336'; // red
      case 'medium': return '#ff9800'; // orange
      case 'low': return '#4caf50'; // green
      default: return '#9e9e9e'; // grey
    }
  };
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Recently Completed Tasks
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {completedTasks.length > 0 ? (
        <List>
          {completedTasks.map(task => (
            <ListItem 
              key={task.id}
              sx={{ 
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1
              }}
              secondaryAction={
                <Box>
                  <Tooltip title="Mark as in progress">
                    <IconButton 
                      edge="end" 
                      size="small"
                      aria-label="undo completion"
                      onClick={() => handleUndoCompletion(task.id)}
                      sx={{ mr: 1 }}
                    >
                      <UndoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Delete task">
                    <IconButton 
                      edge="end" 
                      size="small"
                      aria-label="delete task"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
            >
              <ListItemIcon>
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: getPriorityColor(task.priority),
                    fontSize: '0.875rem'
                  }}
                >
                  {getInitials(task.title)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      textDecoration: 'line-through',
                      color: 'text.secondary'
                    }}
                  >
                    {task.title}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <DateIcon 
                      fontSize="small" 
                      sx={{ 
                        fontSize: '0.875rem', 
                        color: 'text.secondary',
                        mr: 0.5 
                      }} 
                    />
                    <Typography variant="caption" color="text.secondary">
                      Completed: {formatDateTime(new Date(task.completedAt || new Date()))}
                    </Typography>
                  </Box>
                }
              />
              
              {task.tags && task.tags.length > 0 && (
                <Chip 
                  size="small" 
                  label={task.tags[0]} 
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </ListItem>
          ))}
        </List>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
          <Typography color="text.secondary">
            No completed tasks
          </Typography>
        </Box>
      )}
      
      {completedTasks.length > 0 && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(completedTasks.length, limit)} of {tasks.filter(t => t.status === 'completed').length} completed tasks
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default TaskCompletionHistory; 