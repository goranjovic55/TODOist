import React, { useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  ArrowUpward as HighPriorityIcon,
  Remove as MediumPriorityIcon,
  ArrowDownward as LowPriorityIcon,
  CheckCircle as CompletedIcon,
  Visibility as ViewIcon,
  Schedule as DueIcon,
  Error as OverdueIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task, updateTaskStatus } from '../../stores/tasksSlice';
import { formatDate, isToday, isPast } from '../../utils/dateUtils';

interface TaskPriorityViewProps {
  onViewTask?: (taskId: string) => void;
}

const TaskPriorityView: React.FC<TaskPriorityViewProps> = ({ onViewTask }) => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // Get non-completed tasks
  const activeTasks = useMemo(() => {
    return tasks
      .filter(task => task.status !== 'completed')
      .sort((a, b) => {
        // First by priority (high > medium > low)
        const priorityMap = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityMap[b.priority] - priorityMap[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by due date (sooner dates first)
        if (a.endDate && b.endDate) {
          return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
        } else if (a.endDate) {
          return -1;
        } else if (b.endDate) {
          return 1;
        }
        
        // Finally by creation date (newer first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [tasks]);
  
  // Helper to get priority icon and color
  const getPriorityDisplay = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return { 
          icon: <HighPriorityIcon sx={{ color: 'error.main' }} />, 
          color: 'error'
        };
      case 'medium':
        return { 
          icon: <MediumPriorityIcon sx={{ color: 'warning.main' }} />,
          color: 'warning'
        };
      case 'low':
        return { 
          icon: <LowPriorityIcon sx={{ color: 'success.main' }} />,
          color: 'success'
        };
      default:
        return { 
          icon: <MediumPriorityIcon />,
          color: 'default'
        };
    }
  };
  
  // Get due date status and icon
  const getDueDateStatus = (task: Task) => {
    if (!task.endDate) return null;
    
    const dueDate = new Date(task.endDate);
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { 
        icon: <OverdueIcon color="error" />,
        label: 'Overdue',
        color: 'error'
      };
    } else if (isToday(dueDate)) {
      return { 
        icon: <DueIcon color="warning" />,
        label: 'Due Today',
        color: 'warning' 
      };
    } else {
      return { 
        icon: <DueIcon />,
        label: 'Upcoming',
        color: 'default'
      };
    }
  };
  
  // Mark task as completed
  const handleCompleteTask = (taskId: string) => {
    dispatch(updateTaskStatus({ id: taskId, status: 'completed' }));
  };
  
  // Handle view task
  const handleViewTask = (taskId: string) => {
    if (onViewTask) {
      onViewTask(taskId);
    }
  };
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Task Priority View
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Priority</TableCell>
              <TableCell>Task</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeTasks.length > 0 ? (
              activeTasks.map(task => {
                const priority = getPriorityDisplay(task.priority);
                const dueStatus = getDueDateStatus(task);
                
                return (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Tooltip title={`${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority`}>
                        <Box>
                          {priority.icon}
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={task.priority === 'high' ? 'bold' : 'normal'}>
                        {task.title}
                      </Typography>
                      {task.tags.length > 0 && (
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {task.tags.slice(0, 2).map(tag => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small" 
                              variant="outlined" 
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          ))}
                          {task.tags.length > 2 && (
                            <Badge badgeContent={task.tags.length - 2} color="primary" sx={{ ml: 1 }}>
                              <Chip 
                                label="more" 
                                size="small" 
                                variant="outlined" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Badge>
                          )}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status.replace('_', ' ')}
                        size="small"
                        color={
                          task.status === 'in_progress' ? 'primary' :
                          task.status === 'blocked' ? 'error' : 'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {task.endDate ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {dueStatus?.icon}
                          <Typography variant="body2">
                            {formatDate(new Date(task.endDate))}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No due date
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Mark as completed">
                        <IconButton 
                          size="small" 
                          onClick={() => handleCompleteTask(task.id)}
                          aria-label="Mark as completed"
                        >
                          <CompletedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="View task details">
                        <IconButton 
                          size="small" 
                          onClick={() => handleViewTask(task.id)}
                          aria-label="View task details"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    No active tasks
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TaskPriorityView; 