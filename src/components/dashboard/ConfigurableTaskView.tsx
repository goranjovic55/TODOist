import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  SelectChangeEvent,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  ViewList as ListViewIcon,
  ViewModule as GridViewIcon,
  Sort as SortIcon,
  CheckCircle as CompletedIcon,
  Schedule as DueIcon,
  Flag as PriorityIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task, updateTaskStatus } from '../../stores/tasksSlice';
import { formatDate, isToday, isPast } from '../../utils/dateUtils';

type TaskViewLayout = 'list' | 'grid';
type TaskSortField = 'priority' | 'dueDate' | 'title' | 'createdAt' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

interface TaskViewConfig {
  layout: TaskViewLayout;
  sortBy: TaskSortField;
  sortDirection: SortDirection;
  showCompleted: boolean;
}

const ConfigurableTaskView: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // View configuration state
  const [viewConfig, setViewConfig] = useState<TaskViewConfig>({
    layout: 'list',
    sortBy: 'dueDate',
    sortDirection: 'asc',
    showCompleted: false
  });
  
  // Handle layout change
  const handleLayoutChange = (_event: React.MouseEvent<HTMLElement>, newLayout: TaskViewLayout | null) => {
    if (newLayout) {
      setViewConfig({ ...viewConfig, layout: newLayout });
    }
  };
  
  // Handle sort field change
  const handleSortChange = (event: SelectChangeEvent) => {
    setViewConfig({ 
      ...viewConfig, 
      sortBy: event.target.value as TaskSortField
    });
  };
  
  // Handle sort direction toggle
  const toggleSortDirection = () => {
    setViewConfig({
      ...viewConfig,
      sortDirection: viewConfig.sortDirection === 'asc' ? 'desc' : 'asc'
    });
  };
  
  // Toggle showing completed tasks
  const toggleShowCompleted = () => {
    setViewConfig({
      ...viewConfig,
      showCompleted: !viewConfig.showCompleted
    });
  };
  
  // Complete a task
  const handleCompleteTask = (taskId: string) => {
    dispatch(updateTaskStatus({ id: taskId, status: 'completed' }));
  };
  
  // Get filtered and sorted tasks
  const displayTasks = useMemo(() => {
    const filteredTasks = viewConfig.showCompleted 
      ? tasks 
      : tasks.filter(task => task.status !== 'completed');
    
    return filteredTasks.sort((a, b) => {
      let compareResult = 0;
      
      // Sort by the selected field
      switch (viewConfig.sortBy) {
        case 'priority': {
          const priorityMap = { high: 3, medium: 2, low: 1 };
          compareResult = (priorityMap[a.priority as keyof typeof priorityMap] || 0) - 
                         (priorityMap[b.priority as keyof typeof priorityMap] || 0);
          break;
        }
        case 'dueDate': {
          // Handle cases where either or both tasks don't have a due date
          if (!a.endDate && !b.endDate) {
            compareResult = 0;
          } else if (!a.endDate) {
            compareResult = 1; // No due date sorts after tasks with due dates
          } else if (!b.endDate) {
            compareResult = -1; // Tasks with due dates sort before those without
          } else {
            compareResult = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
          }
          break;
        }
        case 'title': 
          compareResult = a.title.localeCompare(b.title);
          break;
        case 'createdAt':
          compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          compareResult = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }
      
      // Adjust for sort direction
      return viewConfig.sortDirection === 'asc' ? compareResult : -compareResult;
    });
  }, [tasks, viewConfig]);
  
  // Get chip color based on task status
  const getStatusColor = (task: Task) => {
    switch (task.status) {
      case 'completed': return 'success';
      case 'in_progress': return 'primary';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };
  
  // Get due date display
  const getDueDateDisplay = (task: Task) => {
    if (!task.endDate) return null;
    
    const dueDate = new Date(task.endDate);
    
    if (task.status === 'completed') {
      return <Chip size="small" label={formatDate(dueDate)} variant="outlined" />;
    }
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Chip size="small" label={`Overdue: ${formatDate(dueDate)}`} color="error" />;
    }
    
    if (isToday(dueDate)) {
      return <Chip size="small" label="Due Today" color="warning" />;
    }
    
    return <Chip size="small" label={`Due: ${formatDate(dueDate)}`} variant="outlined" />;
  };
  
  // Get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <PriorityIcon color="error" />;
      case 'medium':
        return <PriorityIcon color="warning" />;
      case 'low':
        return <PriorityIcon color="success" />;
      default:
        return <PriorityIcon />;
    }
  };
  
  // Render tasks in list view
  const renderListView = () => (
    <List>
      {displayTasks.map(task => (
        <ListItem 
          key={task.id}
          sx={{ 
            borderBottom: '1px solid',
            borderColor: 'divider',
            opacity: task.status === 'completed' ? 0.6 : 1
          }}
        >
          <ListItemIcon>
            {task.status === 'completed' 
              ? <CompletedIcon color="success" /> 
              : getPriorityIcon(task.priority)}
          </ListItemIcon>
          
          <ListItemText
            primary={
              <Typography 
                variant="body1" 
                sx={{ 
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  fontWeight: task.priority === 'high' && task.status !== 'completed' ? 'bold' : 'normal'
                }}
              >
                {task.title}
              </Typography>
            }
            secondary={task.description ? task.description.substring(0, 60) + (task.description.length > 60 ? '...' : '') : null}
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            {/* Status chip */}
            <Chip 
              size="small" 
              label={task.status.replace('_', ' ')} 
              color={getStatusColor(task)}
            />
            
            {/* Due date display */}
            {getDueDateDisplay(task)}
            
            {/* Complete button (only for non-completed tasks) */}
            {task.status !== 'completed' && (
              <Tooltip title="Mark as complete">
                <IconButton 
                  size="small" 
                  onClick={() => handleCompleteTask(task.id)}
                  color="success"
                >
                  <CompletedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </ListItem>
      ))}
    </List>
  );
  
  // Render tasks in grid view
  const renderGridView = () => (
    <Grid container spacing={2}>
      {displayTasks.map(task => (
        <Grid item xs={12} sm={6} md={4} key={task.id}>
          <Card 
            variant="outlined" 
            sx={{ 
              height: '100%',
              opacity: task.status === 'completed' ? 0.7 : 1,
              borderColor: 
                task.status === 'completed' ? 'success.main' :
                task.priority === 'high' ? 'error.main' :
                task.priority === 'medium' ? 'warning.main' : 
                undefined
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Chip 
                  size="small" 
                  label={task.status.replace('_', ' ')} 
                  color={getStatusColor(task)}
                />
                {task.priority !== 'low' && (
                  <Chip 
                    size="small" 
                    label={task.priority} 
                    color={task.priority === 'high' ? 'error' : 'warning'}
                    variant="outlined"
                  />
                )}
              </Box>
              
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  mb: 1,
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  fontWeight: task.priority === 'high' && task.status !== 'completed' ? 'bold' : 'normal'
                }}
              >
                {task.title}
              </Typography>
              
              {task.description && (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {task.description.substring(0, 100)}
                  {task.description.length > 100 ? '...' : ''}
                </Typography>
              )}
              
              {task.endDate && (
                <Box sx={{ mb: 2 }}>
                  {getDueDateDisplay(task)}
                </Box>
              )}
              
              {task.tags && task.tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                  {task.tags.map(tag => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small" 
                      variant="outlined"
                      sx={{ height: 24 }}
                    />
                  ))}
                </Box>
              )}
            </CardContent>
            
            {task.status !== 'completed' && (
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="success"
                  startIcon={<CompletedIcon />}
                  onClick={() => handleCompleteTask(task.id)}
                >
                  Complete
                </Button>
              </CardActions>
            )}
          </Card>
        </Grid>
      ))}
    </Grid>
  );
  
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Tasks ({displayTasks.length})
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* Layout toggle */}
          <ToggleButtonGroup
            size="small"
            value={viewConfig.layout}
            exclusive
            onChange={handleLayoutChange}
            aria-label="task view layout"
          >
            <ToggleButton value="list" aria-label="list view">
              <ListViewIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="grid view">
              <GridViewIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          
          {/* Show completed toggle */}
          <Button 
            size="small" 
            variant={viewConfig.showCompleted ? "contained" : "outlined"}
            onClick={toggleShowCompleted}
            startIcon={<CompletedIcon />}
          >
            {viewConfig.showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>
          
          {/* Sort controls */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                value={viewConfig.sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="priority">Priority</MenuItem>
                <MenuItem value="dueDate">Due Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="updatedAt">Updated Date</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title={`Sort ${viewConfig.sortDirection === 'asc' ? 'Ascending' : 'Descending'}`}>
              <IconButton onClick={toggleSortDirection} size="small">
                {viewConfig.sortDirection === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Task list */}
      {displayTasks.length > 0 ? (
        viewConfig.layout === 'list' ? renderListView() : renderGridView()
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No tasks found
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default ConfigurableTaskView; 