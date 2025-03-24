import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  IconButton,
  Badge,
  Tooltip,
  Chip,
  Divider,
  ButtonGroup,
  Button,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Popover
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  FilterList as FilterIcon,
  Event as EventIcon,
  AssignmentTurnedIn as CompletedIcon,
  AssignmentLate as LateIcon,
  DateRange as DateRangeIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  isWeekend,
  isSameMonth,
  addMonths,
  subMonths,
  isPast,
  isSameDay,
  addDays
} from 'date-fns';

// Calendar view component for tasks
const TaskCalendarView: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // State for calendar view
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [filteredStatus, setFilteredStatus] = useState<string[]>([]);
  const [filteredPriority, setFilteredPriority] = useState<string[]>([]);
  const [taskPopoverState, setTaskPopoverState] = useState<{
    anchorEl: HTMLElement | null;
    task: any | null;
  }>({ anchorEl: null, task: null });

  // Get days of current month
  const daysInMonth = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate]);

  // Get tasks for each day
  const tasksByDay = useMemo(() => {
    const result = new Map();
    
    // Initialize map with all days in month
    daysInMonth.forEach(day => {
      result.set(format(day, 'yyyy-MM-dd'), []);
    });
    
    // Filter tasks based on selected filters
    const filteredTasks = tasks.filter(task => {
      if (filteredStatus.length > 0 && !filteredStatus.includes(task.status)) {
        return false;
      }
      
      if (filteredPriority.length > 0 && !filteredPriority.includes(task.priority)) {
        return false;
      }
      
      return true;
    });
    
    // Add tasks to their due dates
    filteredTasks.forEach(task => {
      if (task.endDate) {
        const dueDate = new Date(task.endDate);
        const dateStr = format(dueDate, 'yyyy-MM-dd');
        
        if (result.has(dateStr)) {
          result.get(dateStr).push(task);
        }
      }
    });
    
    return result;
  }, [daysInMonth, tasks, filteredStatus, filteredPriority]);

  // Get upcoming tasks for next 7 days
  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const next7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
    
    const upcoming: { date: Date; tasks: any[] }[] = [];
    
    next7Days.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => 
        task.endDate && 
        isSameDay(new Date(task.endDate), date) &&
        task.status !== 'completed'
      );
      
      if (dayTasks.length > 0) {
        upcoming.push({ 
          date,
          tasks: dayTasks
        });
      }
    });
    
    return upcoming;
  }, [tasks]);

  // Handle changing month
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle changing view mode (month/week)
  const handleViewModeChange = (mode: 'month' | 'week') => {
    setViewMode(mode);
  };
  
  // Handle filter status change
  const handleStatusFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilteredStatus(value);
  };
  
  // Handle filter priority change
  const handlePriorityFilterChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value as string[];
    setFilteredPriority(value);
  };
  
  // Handle task popover
  const handleTaskClick = (event: React.MouseEvent<HTMLElement>, task: any) => {
    setTaskPopoverState({
      anchorEl: event.currentTarget,
      task
    });
  };
  
  const handleTaskPopoverClose = () => {
    setTaskPopoverState({
      anchorEl: null,
      task: null
    });
  };
  
  // Get color for task based on status and priority
  const getTaskColor = (task: any) => {
    if (task.status === 'completed') {
      return 'success';
    }
    
    if (task.status === 'blocked') {
      return 'error';
    }
    
    if (task.endDate && isPast(new Date(task.endDate)) && task.status !== 'completed') {
      return 'error';
    }
    
    if (task.priority === 'high') {
      return 'warning';
    }
    
    return 'primary';
  };
  
  // Get badge content (number of tasks) for a given day
  const getBadgeContent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = tasksByDay.get(dateStr) || [];
    return dayTasks.length;
  };
  
  // Render a single day cell in calendar
  const renderDayCell = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = tasksByDay.get(dateStr) || [];
    const isWeekendDay = isWeekend(date);
    const isSameMth = isSameMonth(date, currentDate);
    
    return (
      <Box 
        key={dateStr}
        sx={{
          p: 1,
          height: '100%',
          minHeight: 100,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: isToday(date) ? 'action.selected' : 
                  isWeekendDay ? 'action.hover' : 
                  'background.paper',
          opacity: isSameMth ? 1 : 0.4,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Typography 
          variant="body2" 
          align="center"
          sx={{
            fontWeight: isToday(date) ? 'bold' : 'normal',
            mb: 1
          }}
        >
          {format(date, 'd')}
        </Typography>
        
        {dayTasks.slice(0, 3).map((task, index) => (
          <Chip
            key={task.id}
            label={task.title}
            size="small"
            color={getTaskColor(task) as any}
            variant={task.status === 'completed' ? 'outlined' : 'filled'}
            sx={{ 
              mb: 0.5, 
              width: '100%',
              height: 'auto',
              '& .MuiChip-label': {
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                py: 0.25
              }
            }}
            onClick={(e) => handleTaskClick(e, task)}
            icon={
              task.status === 'completed' ? <CompletedIcon fontSize="small" /> :
              (task.endDate && isPast(new Date(task.endDate))) ? <LateIcon fontSize="small" /> :
              <EventIcon fontSize="small" />
            }
          />
        ))}
        
        {dayTasks.length > 3 && (
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            +{dayTasks.length - 3} more
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" display="flex" alignItems="center">
          <DateRangeIcon sx={{ mr: 1 }} />
          Task Calendar
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ButtonGroup variant="outlined" size="small" sx={{ mr: 1 }}>
            <Button
              onClick={() => handleViewModeChange('month')}
              variant={viewMode === 'month' ? 'contained' : 'outlined'}
            >
              Month
            </Button>
            <Button
              onClick={() => handleViewModeChange('week')}
              variant={viewMode === 'week' ? 'contained' : 'outlined'}
            >
              Week
            </Button>
          </ButtonGroup>
          
          <IconButton 
            size="small" 
            onClick={handleFilterClick}
            color={
              filteredStatus.length > 0 || filteredPriority.length > 0 ? 'primary' : 'default'
            }
          >
            <Badge 
              badgeContent={filteredStatus.length + filteredPriority.length} 
              color="primary"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }}
            >
              <FilterIcon />
            </Badge>
          </IconButton>
          
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={handleFilterClose}
            PaperProps={{
              sx: { width: 250, p: 1 }
            }}
          >
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                multiple
                value={filteredStatus}
                onChange={handleStatusFilterChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                label="Status"
              >
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="dense" size="small">
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                multiple
                value={filteredPriority}
                onChange={handlePriorityFilterChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                label="Priority"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                size="small" 
                onClick={() => {
                  setFilteredStatus([]);
                  setFilteredPriority([]);
                }}
              >
                Clear Filters
              </Button>
            </Box>
          </Menu>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Calendar navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <IconButton size="small" onClick={handlePrevMonth}>
          <ChevronLeftIcon />
        </IconButton>
        
        <Typography variant="h6">
          {format(currentDate, 'MMMM yyyy')}
        </Typography>
        
        <Box>
          <IconButton size="small" onClick={handleToday} sx={{ mr: 1 }}>
            <Tooltip title="Today">
              <TodayIcon />
            </Tooltip>
          </IconButton>
          
          <IconButton size="small" onClick={handleNextMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Calendar grid */}
      <Box sx={{ display: 'flex', mb: 1 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Box 
            key={day} 
            sx={{ 
              flex: 1, 
              textAlign: 'center',
              fontWeight: 'bold',
              backgroundColor: 'action.hover',
              py: 0.5
            }}
          >
            <Typography variant="caption">{day}</Typography>
          </Box>
        ))}
      </Box>
      
      {/* Calendar body */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Grid container spacing={0} sx={{ mb: 2 }}>
          {/* Fill in empty days from previous month to start on correct day of week */}
          {(() => {
            const firstDayOfMonth = startOfMonth(currentDate);
            const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.
            const emptyCells = [];
            
            for (let i = 0; i < dayOfWeek; i++) {
              const emptyDate = subMonths(addDays(firstDayOfMonth, i - dayOfWeek), 0);
              emptyCells.push(
                <Grid item xs={12 / 7} key={`empty-${i}`} sx={{ aspectRatio: '1/1' }}>
                  {renderDayCell(emptyDate)}
                </Grid>
              );
            }
            
            return emptyCells;
          })()}
          
          {/* Render actual days of current month */}
          {daysInMonth.map(date => (
            <Grid item xs={12 / 7} key={date.toString()} sx={{ aspectRatio: '1/1' }}>
              {renderDayCell(date)}
            </Grid>
          ))}
          
          {/* Fill in empty days from next month to complete the grid */}
          {(() => {
            const lastDayOfMonth = endOfMonth(currentDate);
            const dayOfWeek = lastDayOfMonth.getDay(); // 0 = Sunday, 6 = Saturday
            const emptyCells = [];
            
            for (let i = 1; i < 7 - dayOfWeek; i++) {
              const emptyDate = addDays(lastDayOfMonth, i);
              emptyCells.push(
                <Grid item xs={12 / 7} key={`next-empty-${i}`} sx={{ aspectRatio: '1/1' }}>
                  {renderDayCell(emptyDate)}
                </Grid>
              );
            }
            
            return emptyCells;
          })()}
        </Grid>
      </Box>
      
      {/* Upcoming tasks sidebar */}
      <Box sx={{ mt: 2 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Upcoming Tasks (Next 7 Days)
        </Typography>
        
        {upcomingTasks.length > 0 ? (
          <Grid container spacing={1}>
            {upcomingTasks.map(({ date, tasks }) => (
              <Grid item xs={12} key={date.toString()}>
                <Box sx={{ 
                  p: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: isToday(date) ? 'action.selected' : 'background.paper'
                }}>
                  <Typography variant="caption" fontWeight="bold">
                    {isToday(date) ? 'Today' : format(date, 'EEE, MMM d')}
                  </Typography>
                  
                  {tasks.map(task => (
                    <Chip
                      key={task.id}
                      label={task.title}
                      size="small"
                      color={getTaskColor(task) as any}
                      sx={{ mt: 0.5, mr: 0.5 }}
                      onClick={(e) => handleTaskClick(e, task)}
                    />
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            No upcoming tasks in the next 7 days
          </Typography>
        )}
      </Box>
      
      {/* Task popover */}
      <Popover
        open={Boolean(taskPopoverState.anchorEl)}
        anchorEl={taskPopoverState.anchorEl}
        onClose={handleTaskPopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {taskPopoverState.task && (
          <Box sx={{ p: 2, maxWidth: 320 }}>
            <Typography variant="subtitle1" gutterBottom>
              {taskPopoverState.task.title}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Chip
                size="small"
                label={taskPopoverState.task.status}
                color={getTaskColor(taskPopoverState.task) as any}
              />
              
              <Chip
                size="small"
                label={taskPopoverState.task.priority}
                variant="outlined"
              />
              
              {taskPopoverState.task.assignedTo && (
                <Chip
                  size="small"
                  label={`Assigned to: ${taskPopoverState.task.assignedTo}`}
                  variant="outlined"
                />
              )}
            </Box>
            
            {taskPopoverState.task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {taskPopoverState.task.description.length > 100
                  ? `${taskPopoverState.task.description.substring(0, 100)}...`
                  : taskPopoverState.task.description}
              </Typography>
            )}
            
            <Typography variant="caption" color="text.secondary" display="block">
              Due: {format(new Date(taskPopoverState.task.endDate), 'PPP')}
            </Typography>
            
            {taskPopoverState.task.tags && taskPopoverState.task.tags.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {taskPopoverState.task.tags.map((tag: string) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20 }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </Popover>
    </Paper>
  );
};

export default TaskCalendarView; 