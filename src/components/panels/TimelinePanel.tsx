import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Today as TodayIcon,
  CalendarToday as CalendarIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

import { RootState } from '../../stores/store';

// Simple timeline component that shows tasks on a timeline
const TimelinePanel: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // Filter tasks that have dates
  const tasksWithDates = tasks.filter(task => task.startDate || task.endDate);
  
  return (
    <Paper sx={{ height: '100%', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          Timeline
        </Typography>
        <Tooltip title="Zoom In">
          <IconButton size="small">
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton size="small">
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      
      {tasksWithDates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body2" color="text.secondary">
            No tasks with dates to display
          </Typography>
        </Box>
      ) : (
        <Box sx={{ p: 1, overflowY: 'auto', flexGrow: 1 }}>
          {/* Simplified timeline view - in a real implementation, this would be a more sophisticated component */}
          <Box sx={{ position: 'relative', height: '100%', minHeight: 100 }}>
            {/* Timeline header - days/weeks */}
            <Box sx={{ display: 'flex', borderBottom: 1, borderColor: 'divider', pb: 1 }}>
              {Array.from({ length: 7 }).map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() + i);
                return (
                  <Box key={i} sx={{ width: 100, textAlign: 'center' }}>
                    <Typography variant="caption">
                      {date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
            
            {/* Timeline body - task bars */}
            <Box sx={{ pt: 1 }}>
              {tasksWithDates.map((task) => (
                <Box
                  key={task.id}
                  sx={{
                    height: 30,
                    mb: 1,
                    backgroundColor: 
                      task.status === 'completed' ? 'success.light' :
                      task.status === 'in_progress' ? 'primary.light' :
                      task.status === 'blocked' ? 'error.light' : 'grey.300',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    pl: 1,
                    // Simplified positioning - in a real app this would use actual date calculations
                    width: `${Math.min(Math.max(Math.random() * 600, 100), 600)}px`,
                    ml: `${Math.random() * 100}px`
                  }}
                >
                  <Typography variant="caption" noWrap>
                    {task.title}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
      
      {/* Today's tasks summary */}
      <Divider />
      <Box sx={{ p: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Today's Tasks
        </Typography>
        <List dense disablePadding>
          {tasks
            .filter(task => {
              const today = new Date();
              const startDate = task.startDate ? new Date(task.startDate) : null;
              const endDate = task.endDate ? new Date(task.endDate) : null;
              
              if (!startDate && !endDate) return false;
              
              // Check if today is between start and end date
              const isAfterStart = !startDate || 
                (today.getFullYear() >= startDate.getFullYear() && 
                today.getMonth() >= startDate.getMonth() && 
                today.getDate() >= startDate.getDate());
              
              const isBeforeEnd = !endDate || 
                (today.getFullYear() <= endDate.getFullYear() && 
                today.getMonth() <= endDate.getMonth() && 
                today.getDate() <= endDate.getDate());
              
              return isAfterStart && isBeforeEnd;
            })
            .slice(0, 3) // Show at most 3 tasks
            .map(task => (
              <ListItem key={task.id} disablePadding>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TodayIcon fontSize="small" color={
                    task.status === 'completed' ? 'success' :
                    task.status === 'in_progress' ? 'primary' :
                    task.status === 'blocked' ? 'error' : 'action'
                  } />
                </ListItemIcon>
                <ListItemText 
                  primary={task.title}
                  primaryTypographyProps={{ variant: 'body2', noWrap: true }}
                />
              </ListItem>
            ))
          }
          {tasks.filter(task => task.startDate || task.endDate).length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No tasks scheduled for today
            </Typography>
          )}
        </List>
      </Box>
    </Paper>
  );
};

export default TimelinePanel; 