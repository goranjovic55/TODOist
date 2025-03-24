import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  LinearProgress, 
  Grid, 
  Chip,
  Card,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import { 
  CheckCircle as CompletedIcon,
  PendingActions as PendingIcon,
  RunningWithErrors as InProgressIcon,
  Error as BlockedIcon,
  Schedule as DueIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { getStatusCounts, getDueDateCounts } from '../../utils/taskStatsUtils';

type StatusKey = 'not_started' | 'in_progress' | 'completed' | 'blocked';

const TaskStatusTracker: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // Calculate counts for each status using utility function
  const statusCounts = useMemo(() => {
    return getStatusCounts(tasks);
  }, [tasks]);

  // Count tasks due today and overdue using utility function
  const { dueTodayCount, overdueCount } = useMemo(() => {
    return getDueDateCounts(tasks);
  }, [tasks]);

  // Helper function to get the color for a status
  const getStatusColor = (status: StatusKey) => {
    switch(status) {
      case 'not_started': return 'default';
      case 'in_progress': return 'primary';
      case 'completed': return 'success';
      case 'blocked': return 'error';
      default: return 'default';
    }
  };

  // Helper function to get the icon for a status
  const getStatusIcon = (status: StatusKey) => {
    switch(status) {
      case 'not_started': return <PendingIcon />;
      case 'in_progress': return <InProgressIcon />;
      case 'completed': return <CompletedIcon />;
      case 'blocked': return <BlockedIcon />;
      default: return null;
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Task Status Overview
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Overall Progress */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Overall Completion
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {statusCounts.completed} / {statusCounts.total} tasks ({Math.round(statusCounts.completion_rate)}%)
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={statusCounts.completion_rate} 
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
      
      {/* Status Breakdown */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {(['not_started', 'in_progress', 'completed', 'blocked'] as StatusKey[]).map((status) => (
          <Grid item xs={6} sm={3} key={status}>
            <Card variant="outlined" sx={{ 
              height: '100%', 
              borderColor: `${getStatusColor(status)}.main` 
            }}>
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Box sx={{ color: `${getStatusColor(status)}.main`, mr: 1 }}>
                    {getStatusIcon(status)}
                  </Box>
                  <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                    {status.replace('_', ' ')}
                  </Typography>
                </Box>
                <Typography variant="h5" align="right">
                  {statusCounts[status]}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
      {/* Due Today and Overdue */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Tooltip title="Tasks due today">
          <Chip 
            icon={<TodayIcon />} 
            label={`Due Today: ${dueTodayCount}`} 
            color={dueTodayCount > 0 ? 'warning' : 'default'} 
            variant="outlined"
          />
        </Tooltip>
        
        <Tooltip title="Tasks past their due date">
          <Chip 
            icon={<DueIcon />} 
            label={`Overdue: ${overdueCount}`} 
            color={overdueCount > 0 ? 'error' : 'default'} 
            variant="outlined"
          />
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default TaskStatusTracker; 