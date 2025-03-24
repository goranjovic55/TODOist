import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Stack
} from '@mui/material';
import {
  AssignmentLate as OverdueIcon,
  AccessTime as DueSoonIcon,
  PriorityHigh as HighPriorityIcon,
  Check as CompleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task, updateTask } from '../../stores/tasksSlice';
import { getTaskStatistics } from '../../utils/filterUtils';
import { gitCommitMilestone } from '../../utils/gitUtils';

const TodoDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const { tasks, groups, projects } = useSelector((state: RootState) => state.tasks);
  const statistics = getTaskStatistics(tasks);
  
  // Get today's tasks (tasks that are due today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysTasks = tasks.filter(task => {
    if (!task.endDate || task.status === 'completed') return false;
    const endDate = new Date(task.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate.getTime() === today.getTime();
  });
  
  // Get overdue tasks
  const overdueTasks = tasks.filter(task => {
    if (!task.endDate || task.status === 'completed') return false;
    const endDate = new Date(task.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  });
  
  // Get upcoming tasks (due within the next 7 days)
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  const upcomingTasks = tasks.filter(task => {
    if (!task.endDate || task.status === 'completed' || task.status === 'blocked') return false;
    const endDate = new Date(task.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate > today && endDate <= nextWeek;
  });
  
  // Get high priority tasks
  const highPriorityTasks = tasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  );
  
  // Get pending tasks (not started or in progress)
  const pendingTasks = tasks.filter(task => 
    (task.status === 'not_started' || task.status === 'in_progress') &&
    task.status !== 'blocked'
  );
  
  // Handle task completion
  const handleCompleteTask = (taskId: string) => {
    dispatch(updateTask({
      id: taskId,
      status: 'completed'
    }));
    
    // Check if this completion represents a milestone
    // For example, if all tasks in a group are completed
    const completedTask = tasks.find(t => t.id === taskId);
    if (completedTask) {
      const parentGroup = groups.find(g => g.id === completedTask.parentId);
      if (parentGroup) {
        const groupTasks = tasks.filter(t => t.parentId === parentGroup.id);
        const allTasksCompleted = groupTasks.every(t => 
          t.id === taskId ? true : t.status === 'completed'
        );
        
        if (allTasksCompleted) {
          // Find the parent project
          const parentProject = projects.find(p => p.id === parentGroup.parentId);
          const projectName = parentProject ? parentProject.name : 'Unknown Project';
          const groupName = parentGroup.name;
          
          // Commit the milestone
          gitCommitMilestone(`Completed milestone: ${projectName} - ${groupName}`);
        }
      }
    }
  };
  
  // Get project and group name for a task
  const getTaskContext = (task: Task) => {
    const group = groups.find(g => g.id === task.parentId);
    if (!group) return { projectName: '', groupName: '' };
    
    const project = projects.find(p => p.id === group.parentId);
    return {
      projectName: project?.name || '',
      groupName: group.name
    };
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        TODO Dashboard
      </Typography>
      
      {/* Statistics cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Overdue</Typography>
              <Typography variant="h4">{statistics.overdueTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Due Today</Typography>
              <Typography variant="h4">{todaysTasks.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>High Priority</Typography>
              <Typography variant="h4">{statistics.highPriorityTasks}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Completion Rate</Typography>
              <Typography variant="h4">{Math.round(statistics.completionRate * 100)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        {/* Overdue tasks section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <OverdueIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="h6">Overdue Tasks</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {overdueTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No overdue tasks. Great job!
              </Typography>
            ) : (
              <List dense>
                {overdueTasks.map(task => {
                  const { projectName, groupName } = getTaskContext(task);
                  return (
                    <ListItem
                      key={task.id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => handleCompleteTask(task.id)}
                          color="success"
                        >
                          <CompleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={task.status === 'completed'}
                          onChange={() => handleCompleteTask(task.id)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            {task.priority === 'high' && (
                              <HighPriorityIcon fontSize="small" color="error" />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {projectName && `${projectName} > `}{groupName}
                            </Typography>
                            <Typography variant="caption" color="error">
                              Due: {new Date(task.endDate!).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Today's tasks section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <DueSoonIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Due Today</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {todaysTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks due today.
              </Typography>
            ) : (
              <List dense>
                {todaysTasks.map(task => {
                  const { projectName, groupName } = getTaskContext(task);
                  return (
                    <ListItem
                      key={task.id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => handleCompleteTask(task.id)}
                          color="success"
                        >
                          <CompleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={task.status === 'completed'}
                          onChange={() => handleCompleteTask(task.id)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            {task.priority === 'high' && (
                              <HighPriorityIcon fontSize="small" color="error" />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {projectName && `${projectName} > `}{groupName}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Upcoming tasks section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Upcoming Tasks</Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
              >
                Add Task
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {upcomingTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No upcoming tasks for the next week.
              </Typography>
            ) : (
              <List dense>
                {upcomingTasks.map(task => {
                  const { projectName, groupName } = getTaskContext(task);
                  return (
                    <ListItem
                      key={task.id}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => handleCompleteTask(task.id)}
                          color="success"
                        >
                          <CompleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={task.status === 'completed'}
                          onChange={() => handleCompleteTask(task.id)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Stack direction="row" spacing={1} alignItems="center">
                            {task.priority === 'high' && (
                              <HighPriorityIcon fontSize="small" color="error" />
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {projectName && `${projectName} > `}{groupName}
                            </Typography>
                            <Chip 
                              size="small" 
                              label={task.status.replace('_', ' ')} 
                              color={
                                task.status === 'in_progress' ? 'primary' : 'default'
                              }
                              variant="outlined"
                              sx={{ height: 20 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Due: {new Date(task.endDate!).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TodoDashboard; 