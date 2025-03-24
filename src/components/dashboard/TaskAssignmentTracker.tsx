import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip
} from '@mui/material';
import { useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { getTasksInDateRange } from '../../utils/taskStatsUtils';

// Interface for assignee stats
interface AssigneeStats {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
}

/**
 * Calculate task assignment metrics by assignee
 */
const getAssigneeStats = (tasks: Task[]): AssigneeStats[] => {
  const assigneeMap = new Map<string, AssigneeStats>();
  
  // Process each task
  tasks.forEach((task: Task) => {
    const assignee = task.assignedTo || 'Unassigned';
    
    if (!assigneeMap.has(assignee)) {
      assigneeMap.set(assignee, {
        name: assignee,
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        completionRate: 0
      });
    }
    
    const stats = assigneeMap.get(assignee)!;
    
    // Update counters
    stats.total++;
    
    if (task.status === 'completed') {
      stats.completed++;
    } else if (task.status === 'in_progress') {
      stats.inProgress++;
    } else if (task.status === 'not_started') {
      stats.notStarted++;
    }
    
    // Calculate completion rate
    stats.completionRate = stats.total > 0 
      ? (stats.completed / stats.total) * 100 
      : 0;
    
    assigneeMap.set(assignee, stats);
  });
  
  // Sort by total tasks descending
  return Array.from(assigneeMap.values())
    .sort((a, b) => b.total - a.total);
};

/**
 * Component that displays task assignment and completion metrics
 */
const TaskAssignmentTracker: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // Filter to recent tasks (last month)
  const recentTasks = useMemo(() => {
    return getTasksInDateRange(tasks, 'month');
  }, [tasks]);
  
  // Calculate assignee stats
  const assigneeStats = useMemo(() => {
    return getAssigneeStats(recentTasks);
  }, [recentTasks]);
  
  // Calculate team completion rate
  const teamCompletionRate = useMemo(() => {
    if (recentTasks.length === 0) return 0;
    
    const totalCompleted = recentTasks.filter(task => task.status === 'completed').length;
    return (totalCompleted / recentTasks.length) * 100;
  }, [recentTasks]);
  
  // Get color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 75) return 'success';
    if (rate >= 50) return 'primary';
    if (rate >= 25) return 'warning';
    return 'error';
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Task Assignment & Completion
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Team Completion Rate
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {Math.round(teamCompletionRate)}%
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={teamCompletionRate} 
          color={getCompletionColor(teamCompletionRate) as 'success' | 'primary' | 'warning' | 'error'}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Assigned Tasks
              </Typography>
              <Typography variant="h5" align="center">
                {recentTasks.filter(task => task.assignedTo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Unassigned Tasks
              </Typography>
              <Typography variant="h5" align="center">
                {recentTasks.filter(task => !task.assignedTo).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Assignees
              </Typography>
              <Typography variant="h5" align="center">
                {assigneeStats.filter(stats => stats.name !== 'Unassigned').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="subtitle2" gutterBottom>
        Assignee Performance
      </Typography>
      
      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
        {assigneeStats.map((stats) => (
          <ListItem key={stats.name} divider>
            <ListItemAvatar>
              <Avatar
                sx={{ 
                  bgcolor: stats.name === 'Unassigned' 
                    ? 'grey.500' 
                    : `hsl(${stats.name.charCodeAt(0) * 10}, 70%, 50%)` 
                }}
              >
                {stats.name === 'Unassigned' ? 'U' : stats.name.charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText 
              primary={stats.name}
              secondary={
                <Box sx={{ width: '100%', mt: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Completion Rate
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {Math.round(stats.completionRate)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.completionRate} 
                    color={getCompletionColor(stats.completionRate) as 'success' | 'primary' | 'warning' | 'error'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              }
            />
            
            <ListItemSecondaryAction>
              <Chip 
                label={`${stats.total} tasks`} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default TaskAssignmentTracker; 