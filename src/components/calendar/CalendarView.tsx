import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Chip,
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  Event as EventIcon,
  AssignmentLate as OverdueIcon,
  CheckCircleOutline as CompleteIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';

const CalendarView: React.FC = () => {
  const { tasks, groups, projects } = useSelector((state: RootState) => state.tasks);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Get the current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get the first day of the month and the number of days in the month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  
  // Get the day of the week of the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calendar navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get task context (project and group names)
  const getTaskContext = (task: Task) => {
    const group = groups.find(g => g.id === task.parentId);
    if (!group) return { projectName: '', groupName: '' };
    
    const project = projects.find(p => p.id === group.parentId);
    return {
      projectName: project?.name || '',
      groupName: group.name
    };
  };
  
  // Get tasks for a specific day
  const getTasksForDay = (day: number): Task[] => {
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0);
    
    return tasks.filter(task => {
      if (!task.endDate) return false;
      
      const taskDate = new Date(task.endDate);
      taskDate.setHours(0, 0, 0, 0);
      
      return taskDate.getTime() === date.getTime();
    });
  };
  
  // Check if a day is today
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };
  
  // Format the month name
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(currentDate);
  
  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add cells for each day of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }
  
  // Create weeks (rows) for the calendar
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            {monthName} {currentYear}
          </Typography>
          <Tooltip title="Previous Month">
            <IconButton onClick={goToPreviousMonth}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Today">
            <IconButton onClick={goToToday}>
              <TodayIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next Month">
            <IconButton onClick={goToNextMonth}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Grid container spacing={0}>
          {/* Calendar header - Days of the week */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
            <Grid item xs key={dayName} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="subtitle2">{dayName}</Typography>
              </Box>
            </Grid>
          ))}
          
          {/* Calendar days */}
          {weeks.map((week, weekIndex) => (
            <React.Fragment key={`week-${weekIndex}`}>
              {week.map((day, dayIndex) => (
                <Grid 
                  item 
                  xs 
                  key={`day-${dayIndex}`} 
                  sx={{ 
                    borderBottom: 1, 
                    borderRight: dayIndex < 6 ? 1 : 0,
                    borderColor: 'divider', 
                    height: 120, 
                    bgcolor: isToday(day as number) ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                  }}
                >
                  {day !== null ? (
                    <Box sx={{ p: 1, height: '100%', position: 'relative' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: isToday(day) ? 'bold' : 'regular',
                          color: isToday(day) ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {day}
                      </Typography>
                      
                      <Box sx={{ mt: 1, overflow: 'auto', maxHeight: 85 }}>
                        {getTasksForDay(day).map(task => {
                          const { projectName } = getTaskContext(task);
                          return (
                            <Tooltip 
                              key={task.id}
                              title={`${task.title} (${projectName})`}
                              arrow
                            >
                              <Chip
                                size="small"
                                icon={
                                  task.status === 'completed' ? <CompleteIcon fontSize="small" /> :
                                  task.status === 'blocked' ? <OverdueIcon fontSize="small" /> :
                                  <EventIcon fontSize="small" />
                                }
                                label={task.title}
                                sx={{ 
                                  mb: 0.5, 
                                  width: '100%',
                                  backgroundColor: 
                                    task.status === 'completed' ? 'success.light' :
                                    task.status === 'blocked' ? 'error.light' :
                                    task.priority === 'high' ? 'warning.light' :
                                    'default',
                                  '& .MuiChip-label': {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                                  }
                                }}
                              />
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1, height: '100%', bgcolor: 'action.hover', opacity: 0.3 }} />
                  )}
                </Grid>
              ))}
            </React.Fragment>
          ))}
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Tasks
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          {tasks
            .filter(task => {
              if (!task.endDate || task.status === 'completed') return false;
              
              const taskDate = new Date(task.endDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              // Get tasks due within the next 14 days
              const twoWeeksLater = new Date(today);
              twoWeeksLater.setDate(today.getDate() + 14);
              
              return taskDate >= today && taskDate <= twoWeeksLater;
            })
            .sort((a, b) => {
              const dateA = new Date(a.endDate!).getTime();
              const dateB = new Date(b.endDate!).getTime();
              return dateA - dateB;
            })
            .slice(0, 6) // Show only the next 6 tasks
            .map(task => {
              const { projectName, groupName } = getTaskContext(task);
              const dueDate = new Date(task.endDate!);
              
              // Calculate days until due
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <Grid item xs={12} sm={6} md={4} key={task.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle1" gutterBottom>
                          {task.title}
                        </Typography>
                        <Chip 
                          size="small" 
                          color={
                            daysUntilDue === 0 ? 'error' :
                            daysUntilDue <= 2 ? 'warning' :
                            'default'
                          }
                          label={
                            daysUntilDue === 0 ? 'Today' :
                            daysUntilDue === 1 ? 'Tomorrow' :
                            `In ${daysUntilDue} days`
                          }
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {projectName && `${projectName} > `}{groupName}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        Due: {dueDate.toLocaleDateString()}
                      </Typography>
                      {task.priority === 'high' && (
                        <Chip size="small" label="High Priority" color="error" variant="outlined" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
        </Grid>
      </Paper>
    </Box>
  );
};

export default CalendarView; 