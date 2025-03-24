import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Paper,
  Typography,
  Divider,
  Chip,
  Box
} from '@mui/material';
import {
  AccessTime as ClockIcon,
  CheckCircle as CompletedIcon,
  PendingActions as PendingIcon,
  RunningWithErrors as InProgressIcon,
  Error as BlockedIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { formatDate } from '../../utils/dateUtils';

interface RecentTasksListProps {
  limit?: number;
  showCompleted?: boolean;
  title?: string;
}

const RecentTasksList: React.FC<RecentTasksListProps> = ({ 
  limit = 5, 
  showCompleted = true,
  title = "Recent Tasks"
}) => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // Get status icon
  const getStatusIcon = (status: Task['status']) => {
    switch(status) {
      case 'completed': return <CompletedIcon color="success" />;
      case 'in_progress': return <InProgressIcon color="primary" />;
      case 'blocked': return <BlockedIcon color="error" />;
      case 'not_started': 
      default: return <PendingIcon />;
    }
  };
  
  // Filter and sort tasks
  const recentTasks = React.useMemo(() => {
    return tasks
      .filter(task => showCompleted || task.status !== 'completed')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [tasks, showCompleted, limit]);
  
  if (recentTasks.length === 0) {
    return (
      <Paper sx={{ p: 2, height: '100%' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No recent tasks found
          </Typography>
        </Box>
      </Paper>
    );
  }
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      <List>
        {recentTasks.map(task => (
          <ListItem 
            key={task.id} 
            sx={{ 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              '&:last-child': {
                borderBottom: 'none'
              }
            }}
          >
            <ListItemIcon>
              {getStatusIcon(task.status)}
            </ListItemIcon>
            
            <ListItemText 
              primary={task.title}
              secondary={`Updated: ${formatDate(new Date(task.updatedAt))}`}
              primaryTypographyProps={{
                style: {
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                }
              }}
            />
            
            <Chip 
              label={task.priority}
              size="small"
              color={
                task.priority === 'high' ? 'error' :
                task.priority === 'medium' ? 'warning' : 'default'
              }
              variant="outlined"
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default RecentTasksList; 