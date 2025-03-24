import React from 'react';
import { 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  ListItemSecondaryAction,
  IconButton, 
  Box,
  Typography,
  Tooltip,
  Checkbox,
  Chip
} from '@mui/material';
import {
  ChevronRight as ChevronRightIcon,
  Assignment as TaskIcon,
  AssignmentTurnedIn as CompletedTaskIcon,
  AssignmentLate as BlockedTaskIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';

import { Task as TaskType } from '../../stores/tasksSlice';
import { setSelectedItem } from '../../stores/uiSlice';
import { updateTask } from '../../stores/tasksSlice';
import { handleDragStart, handleDragOver } from '../../utils/dragDropUtils';

interface TaskProps {
  task: TaskType;
  depth: number;
  hasChildren?: boolean;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  onDrop?: (event: React.DragEvent<HTMLElement>, targetTask: TaskType) => void;
}

const Task: React.FC<TaskProps> = ({ 
  task, 
  depth, 
  hasChildren = false,
  onToggleExpand,
  isExpanded = false,
  onDrop
}) => {
  const dispatch = useDispatch();
  
  const handleSelect = () => {
    dispatch(setSelectedItem(task.id));
  };

  const handleToggleComplete = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation();
    dispatch(updateTask({
      id: task.id,
      status: event.target.checked ? 'completed' : 'not_started'
    }));
  };
  
  // Handle drag and drop events
  const onDragStart = (event: React.DragEvent<HTMLElement>) => {
    handleDragStart(event, task);
  };
  
  const onDragOver = (event: React.DragEvent<HTMLElement>) => {
    handleDragOver(event, task);
  };
  
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    if (onDrop) {
      onDrop(event, task);
    }
  };

  // Determine the task icon based on status
  const getTaskIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CompletedTaskIcon color="success" />;
      case 'blocked':
        return <BlockedTaskIcon color="error" />;
      case 'in_progress':
        return <TaskIcon color="primary" />;
      default:
        return <TaskIcon color="action" />;
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <Box>
          <IconButton edge="end" size="small" onClick={(e) => e.stopPropagation()}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton edge="end" size="small" onClick={(e) => e.stopPropagation()}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      }
      sx={{ pl: depth * 2 }}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={handleDrop}
    >
      <ListItemButton
        onClick={handleSelect}
        dense
      >
        <ListItemIcon onClick={hasChildren && onToggleExpand ? onToggleExpand : undefined}>
          {hasChildren ? (
            isExpanded ? <ChevronRightIcon style={{ transform: 'rotate(90deg)' }} /> : <ChevronRightIcon />
          ) : (
            <Box sx={{ width: 24 }} /> // Empty space for alignment
          )}
        </ListItemIcon>
        
        <Checkbox
          edge="start"
          checked={task.status === 'completed'}
          onChange={handleToggleComplete}
          onClick={(e) => e.stopPropagation()}
          sx={{ mr: 1 }}
        />
        
        <ListItemIcon>
          {getTaskIcon()}
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  fontWeight: 'normal'
                }}
              >
                {task.title}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {task.priority === 'high' && (
                <Chip size="small" label="High" color="error" 
                  variant="outlined" sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }} />
              )}
              {task.tags.map(tag => (
                <Chip
                  key={tag}
                  size="small"
                  label={tag}
                  sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }}
                />
              ))}
              {task.endDate && (
                <Tooltip title="Due date">
                  <Chip
                    size="small"
                    label={new Date(task.endDate).toLocaleDateString()}
                    color={new Date(task.endDate) < new Date() ? 'error' : 'default'}
                    variant="outlined"
                    sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }}
                  />
                </Tooltip>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default Task; 