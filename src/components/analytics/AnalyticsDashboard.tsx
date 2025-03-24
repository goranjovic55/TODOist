import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  ButtonGroup,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import {
  QueryStats as StatsIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CompletedIcon,
  Alarm as DueIcon,
  Favorite as PriorityIcon,
  CalendarToday as DateIcon,
  Schedule as TimeIcon,
  Category as CategoryIcon,
  Flag as GoalIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, isSameDay, isSameWeek, isSameMonth } from 'date-fns';

// Define interfaces for statistics and chart data
interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
  upcoming: number;
  highPriority: number;
  completionRate: number;
}

interface TaskProgressData {
  labels: string[];
  data: number[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

// Helper function to calculate circular progress color
const getProgressColor = (value: number): 'success' | 'warning' | 'error' | 'info' => {
  if (value >= 75) return 'success';
  if (value >= 50) return 'info';
  if (value >= 25) return 'warning';
  return 'error';
};

// Main component
const AnalyticsDashboard: React.FC = () => {
  // State for date range filter and tab
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'all'>('week');
  const [activeTab, setActiveTab] = useState(0);
  
  // Redux state
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const goals = useSelector((state: RootState) => state.goals?.goals || []);
  
  // Task statistics based on the selected date range
  const [taskStats, setTaskStats] = useState<TaskStats>({
    total: 0,
    completed: 0,
    overdue: 0,
    upcoming: 0,
    highPriority: 0,
    completionRate: 0
  });
  
  // Task completion data for charts
  const [taskProgressData, setTaskProgressData] = useState<TaskProgressData>({
    labels: [],
    data: []
  });
  
  // Task category data for chart
  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>([]);
  
  // Task priority data for chart
  const [priorityData, setPriorityData] = useState<{ name: string; count: number }[]>([]);
  
  // Task time data (morning, afternoon, evening, night)
  const [timeOfDayData, setTimeOfDayData] = useState<{ name: string; count: number }[]>([]);
  
  // Calculate statistics based on date range
  useEffect(() => {
    if (!tasks.length) return;
    
    const now = new Date();
    let filteredTasks = [...tasks];
    
    // Filter tasks based on selected date range
    if (dateRange !== 'all') {
      const startDate = dateRange === 'day' 
        ? startOfDay(now) 
        : dateRange === 'week' 
          ? startOfWeek(now, { weekStartsOn: 1 }) 
          : startOfMonth(now);
      
      filteredTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        if (dateRange === 'day') return isSameDay(taskDate, now);
        if (dateRange === 'week') return isSameWeek(taskDate, now, { weekStartsOn: 1 });
        return isSameMonth(taskDate, now);
      });
    }
    
    // Calculate basic statistics
    const completed = filteredTasks.filter(task => task.status === 'completed').length;
    const overdue = filteredTasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < now;
    }).length;
    const upcoming = filteredTasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      const dueDate = new Date(task.dueDate);
      const threeDaysFromNow = new Date(now);
      threeDaysFromNow.setDate(now.getDate() + 3);
      return dueDate >= now && dueDate <= threeDaysFromNow;
    }).length;
    const highPriority = filteredTasks.filter(task => task.priority === 'high').length;
    const completionRate = filteredTasks.length > 0 
      ? Math.round((completed / filteredTasks.length) * 100) 
      : 0;
    
    setTaskStats({
      total: filteredTasks.length,
      completed,
      overdue,
      upcoming,
      highPriority,
      completionRate
    });
    
    // Calculate task progress data for charts
    if (dateRange === 'day') {
      // For day, show hours
      const hours = Array.from({ length: 24 }, (_, i) => i);
      const hourLabels = hours.map(hour => `${hour}:00`);
      const hourData = hours.map(hour => {
        return filteredTasks.filter(task => {
          if (task.status !== 'completed') return false;
          const completedDate = task.completedAt ? new Date(task.completedAt) : null;
          return completedDate && completedDate.getHours() === hour;
        }).length;
      });
      
      setTaskProgressData({
        labels: hourLabels,
        data: hourData
      });
    } else if (dateRange === 'week') {
      // For week, show days
      const days = Array.from({ length: 7 }, (_, i) => i);
      const dayLabels = days.map(day => {
        const date = new Date(now);
        date.setDate(date.getDate() - date.getDay() + day);
        return format(date, 'EEE');
      });
      const dayData = days.map(day => {
        const date = new Date(now);
        date.setDate(date.getDate() - date.getDay() + day);
        return filteredTasks.filter(task => {
          if (task.status !== 'completed') return false;
          const completedDate = task.completedAt ? new Date(task.completedAt) : null;
          return completedDate && completedDate.getDay() === day;
        }).length;
      });
      
      setTaskProgressData({
        labels: dayLabels,
        data: dayData
      });
    } else {
      // For month or all, show weeks
      const weeks = dateRange === 'month' ? 4 : 12;
      const weekLabels = Array.from({ length: weeks }, (_, i) => {
        if (dateRange === 'month') {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - 21 + (i * 7));
          return `W${i+1}`;
        } else {
          const monthStart = new Date(now);
          monthStart.setMonth(monthStart.getMonth() - 11 + i);
          return format(monthStart, 'MMM');
        }
      });
      
      const weekData = Array.from({ length: weeks }, (_, i) => {
        if (dateRange === 'month') {
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - 21 + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          return filteredTasks.filter(task => {
            if (task.status !== 'completed') return false;
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
            return completedDate && completedDate >= weekStart && completedDate <= weekEnd;
          }).length;
        } else {
          const monthStart = new Date(now);
          monthStart.setMonth(monthStart.getMonth() - 11 + i);
          const monthEnd = new Date(monthStart);
          monthEnd.setMonth(monthStart.getMonth() + 1);
          monthEnd.setDate(0);
          
          return filteredTasks.filter(task => {
            if (task.status !== 'completed') return false;
            const completedDate = task.completedAt ? new Date(task.completedAt) : null;
            return completedDate && completedDate >= monthStart && completedDate <= monthEnd;
          }).length;
        }
      });
      
      setTaskProgressData({
        labels: weekLabels,
        data: weekData
      });
    }
    
    // Calculate category data
    const categories: { [key: string]: number } = {};
    filteredTasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    const categoryItems = Object.keys(categories).map(name => ({ 
      name, 
      count: categories[name]
    })).sort((a, b) => b.count - a.count);
    
    setCategoryData(categoryItems);
    
    // Calculate priority data
    const priorities: { [key: string]: number } = {
      'low': 0,
      'medium': 0,
      'high': 0
    };
    
    filteredTasks.forEach(task => {
      const priority = task.priority || 'medium';
      priorities[priority] = (priorities[priority] || 0) + 1;
    });
    
    const priorityItems = Object.keys(priorities).map(name => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      count: priorities[name]
    }));
    
    setPriorityData(priorityItems);
    
    // Calculate time of day data
    const timeRanges = {
      'Morning (6-12)': { start: 6, end: 11 },
      'Afternoon (12-18)': { start: 12, end: 17 },
      'Evening (18-24)': { start: 18, end: 23 },
      'Night (0-6)': { start: 0, end: 5 }
    };
    
    const timeData: { [key: string]: number } = {};
    
    Object.keys(timeRanges).forEach(range => {
      timeData[range] = 0;
    });
    
    filteredTasks.filter(task => task.status === 'completed' && task.completedAt).forEach(task => {
      const completedDate = task.completedAt ? new Date(task.completedAt) : null;
      if (!completedDate) return;
      
      const hour = completedDate.getHours();
      
      Object.entries(timeRanges).forEach(([range, { start, end }]) => {
        if (hour >= start && hour <= end) {
          timeData[range]++;
        }
      });
    });
    
    const timeItems = Object.keys(timeData).map(name => ({
      name,
      count: timeData[name]
    }));
    
    setTimeOfDayData(timeItems);
    
  }, [tasks, dateRange]);
  
  // Handle date range change
  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setDateRange(event.target.value as 'day' | 'week' | 'month' | 'all');
  };
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Render overview section
  const renderOverview = () => (
    <>
      <Typography variant="h5" sx={{ mb: 2 }}>Task Overview</Typography>
      <Grid container spacing={3}>
        {/* Task Count Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <StatsIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" component="div">{taskStats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Tasks</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Completed Tasks Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CompletedIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" component="div">{taskStats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">Completed Tasks</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Overdue Tasks Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <DueIcon color="error" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" component="div">{taskStats.overdue}</Typography>
              <Typography variant="body2" color="text.secondary">Overdue Tasks</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Upcoming Tasks Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <DateIcon color="info" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" component="div">{taskStats.upcoming}</Typography>
              <Typography variant="body2" color="text.secondary">Upcoming (3 days)</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Completion Rate Card */}
        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-flex', mr: 3 }}>
                <CircularProgress
                  variant="determinate"
                  value={taskStats.completionRate}
                  size={80}
                  color={getProgressColor(taskStats.completionRate)}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="body1" component="div" color="text.secondary">
                    {`${taskStats.completionRate}%`}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ ml: 2 }}>
                <Typography variant="h6" component="div">Completion Rate</Typography>
                <Typography variant="body2" color="text.secondary">
                  {taskStats.completed} of {taskStats.total} tasks completed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* High Priority Tasks Card */}
        <Grid item xs={12} sm={6} md={6}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PriorityIcon color="error" sx={{ fontSize: 48, mr: 3 }} />
              <Box>
                <Typography variant="h6" component="div">High Priority Tasks</Typography>
                <Typography variant="h4" component="div">{taskStats.highPriority}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {Math.round((taskStats.highPriority / (taskStats.total || 1)) * 100)}% of all tasks
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
  
  // Render progress chart section
  const renderProgressChart = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Task Completion Trend" 
            subheader={`Shows task completion over ${dateRange === 'day' ? 'hours' : dateRange === 'week' ? 'days' : 'weeks'}`}
          />
          <Divider />
          <CardContent sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Using a simple bar chart visualization with divs */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', height: '100%', width: '100%', gap: 1 }}>
              {taskProgressData.labels.map((label, index) => {
                const height = `${Math.max((taskProgressData.data[index] / Math.max(...taskProgressData.data, 1)) * 100, 5)}%`;
                
                return (
                  <Tooltip key={label} title={`${label}: ${taskProgressData.data[index]} tasks`}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box 
                        sx={{ 
                          width: '100%', 
                          bgcolor: 'primary.main', 
                          height, 
                          minHeight: '5px',
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, fontSize: '0.7rem' }}>
                        {label}
                      </Typography>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  // Render distribution charts
  const renderDistributionCharts = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      {/* Category Distribution */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader 
            title="Tasks by Category" 
            subheader="Distribution of tasks across categories"
            avatar={<CategoryIcon color="primary" />}
          />
          <Divider />
          <CardContent>
            <List>
              {categoryData.map(category => (
                <ListItem key={category.name}>
                  <ListItemText 
                    primary={category.name} 
                    secondary={`${category.count} tasks (${Math.round((category.count / taskStats.total) * 100)}%)`}
                  />
                  <Box 
                    sx={{ 
                      width: `${(category.count / taskStats.total) * 100}%`, 
                      bgcolor: 'primary.main', 
                      height: 8,
                      minWidth: '5%',
                      borderRadius: 1
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
      
      {/* Priority Distribution */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader 
            title="Tasks by Priority" 
            subheader="Distribution by priority level"
            avatar={<PriorityIcon color="error" />}
          />
          <Divider />
          <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 5 }}>
            {priorityData.map(priority => {
              const color = priority.name === 'High' 
                ? 'error.main' 
                : priority.name === 'Medium' 
                  ? 'warning.main' 
                  : 'success.main';
              
              return (
                <Box key={priority.name} sx={{ width: '100%', mb: 3, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ width: 80 }}>
                    {priority.name}
                  </Typography>
                  <Box sx={{ flex: 1, mx: 1 }}>
                    <Box 
                      sx={{ 
                        width: `${(priority.count / taskStats.total) * 100}%`, 
                        bgcolor: color, 
                        height: 20,
                        minWidth: '5%',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}
                    >
                      {priority.count > 0 && `${priority.count}`}
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ width: 50, textAlign: 'right' }}>
                    {Math.round((priority.count / taskStats.total) * 100)}%
                  </Typography>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Time of Day Distribution */}
      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardHeader 
            title="Completion by Time" 
            subheader="When you complete tasks"
            avatar={<TimeIcon color="info" />}
          />
          <Divider />
          <CardContent>
            <List>
              {timeOfDayData.map(timeRange => (
                <ListItem key={timeRange.name}>
                  <ListItemText 
                    primary={timeRange.name} 
                    secondary={`${timeRange.count} tasks`}
                  />
                  <Box 
                    sx={{ 
                      width: `${(timeRange.count / (taskStats.completed || 1)) * 100}%`, 
                      bgcolor: 'info.main', 
                      height: 8,
                      minWidth: '5%',
                      borderRadius: 1
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  // Render goal progress
  const renderGoalProgress = () => (
    <Grid container spacing={3} sx={{ mt: 1 }}>
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title="Goal Progress" 
            subheader="Progress on your active goals"
            avatar={<GoalIcon color="primary" />}
          />
          <Divider />
          <CardContent>
            {goals.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No goals found. Create goals to track your progress.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {goals.filter(goal => goal.status === 'active').slice(0, 5).map(goal => (
                  <Box key={goal.id} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1">{goal.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {goal.linkedTaskIds.length} linked tasks
                      </Typography>
                    </Box>
                    <Box sx={{ width: '60%', pl: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{goal.progress}% Complete</Typography>
                      </Box>
                      <Box 
                        sx={{
                          width: '100%',
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          height: 8,
                          position: 'relative'
                        }}
                      >
                        <Box 
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            bgcolor: goal.progress === 100 ? 'success.main' : 'primary.main',
                            width: `${goal.progress}%`,
                            borderRadius: 1,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
  
  // Render productivity insights
  const renderProductivityInsights = () => {
    // Calculate best day
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCountMap: { [key: string]: number } = {};
    
    dayNames.forEach(day => {
      dayCountMap[day] = 0;
    });
    
    tasks.forEach(task => {
      if (task.status === 'completed' && task.completedAt) {
        const completedDate = new Date(task.completedAt);
        const dayName = dayNames[completedDate.getDay()];
        dayCountMap[dayName]++;
      }
    });
    
    const bestDay = Object.entries(dayCountMap)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, count]) => count > 0)[0];
    
    // Calculate best time
    const bestTimeRange = timeOfDayData
      .sort((a, b) => b.count - a.count)
      .filter(time => time.count > 0)[0];
    
    // Calculate productive streak
    const streakDays = calculateLongestStreak(tasks);
    
    return (
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Productivity Insights" 
              subheader="Analytics about your work habits"
              avatar={<TrendingUpIcon color="success" />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Most Productive Day</Typography>
                    <Typography variant="h3" color="primary">
                      {bestDay && bestDay[1] > 0 ? bestDay[0] : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {bestDay && bestDay[1] > 0 
                        ? `You completed ${bestDay[1]} tasks on this day` 
                        : 'Complete tasks to see data'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Most Productive Time</Typography>
                    <Typography variant="h3" color="primary">
                      {bestTimeRange && bestTimeRange.count > 0 
                        ? bestTimeRange.name.split(' ')[0] 
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {bestTimeRange && bestTimeRange.count > 0 
                        ? `You completed ${bestTimeRange.count} tasks during this time` 
                        : 'Complete tasks to see data'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Longest Streak</Typography>
                    <Typography variant="h3" color="primary">
                      {streakDays} {streakDays === 1 ? 'day' : 'days'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {streakDays > 0 
                        ? 'Your longest streak of completing tasks' 
                        : 'Complete tasks on consecutive days to start a streak'}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Productivity Tips</Typography>
                  <List>
                    {generateProductivityTips(taskStats, bestDay?.[0], bestTimeRange?.name).map((tip, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUpIcon color="success" />
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };
  
  // Helper function to calculate longest streak
  const calculateLongestStreak = (tasks: any[]): number => {
    if (!tasks.length) return 0;
    
    // Get all days where tasks were completed
    const completedDays = tasks
      .filter(task => task.status === 'completed' && task.completedAt)
      .map(task => format(new Date(task.completedAt), 'yyyy-MM-dd'))
      .sort()
      .filter((date, index, array) => array.indexOf(date) === index);
    
    if (!completedDays.length) return 0;
    
    let currentStreak = 1;
    let maxStreak = 1;
    
    for (let i = 1; i < completedDays.length; i++) {
      const prevDate = new Date(completedDays[i - 1]);
      const currDate = new Date(completedDays[i]);
      
      prevDate.setDate(prevDate.getDate() + 1);
      
      if (prevDate.getTime() === currDate.getTime()) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };
  
  // Helper function to generate productivity tips based on data
  const generateProductivityTips = (
    stats: TaskStats, 
    bestDay?: string,
    bestTime?: string
  ): string[] => {
    const tips: string[] = [];
    
    if (stats.completionRate < 50) {
      tips.push('Try breaking down large tasks into smaller, more manageable subtasks to improve completion rate.');
    }
    
    if (stats.overdue > 0) {
      tips.push(`You have ${stats.overdue} overdue tasks. Consider rescheduling or prioritizing them.`);
    }
    
    if (bestDay) {
      tips.push(`${bestDay} seems to be your most productive day. Consider scheduling important tasks on this day.`);
    }
    
    if (bestTime) {
      tips.push(`You're most productive during ${bestTime}. Try scheduling challenging tasks during this time.`);
    }
    
    if (stats.highPriority > (stats.total * 0.5)) {
      tips.push('You have many high priority tasks. Consider re-evaluating your priority assignments.');
    }
    
    // Add more general tips if we don't have enough specific ones
    if (tips.length < 3) {
      tips.push('Use the Pomodoro technique (25 minutes work, 5 minutes break) to maintain focus.');
      tips.push('Try to complete at least one high-priority task early in the day.');
      tips.push('Review your task list at the end of each day and plan for tomorrow.');
    }
    
    return tips.slice(0, 5);
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="date-range-label">Date Range</InputLabel>
          <Select
            labelId="date-range-label"
            id="date-range"
            value={dateRange}
            onChange={handleDateRangeChange}
            label="Date Range"
          >
            <MenuItem value="day">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="all">All Time</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Tabs for different analytics views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="analytics tabs"
        >
          <Tab label="Overview" />
          <Tab label="Progress" />
          <Tab label="Distribution" />
          <Tab label="Goals" />
          <Tab label="Insights" />
        </Tabs>
      </Box>
      
      {/* Tab content */}
      <TabPanel value={activeTab} index={0}>
        {renderOverview()}
        {renderProgressChart()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {renderProgressChart()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        {renderDistributionCharts()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        {renderGoalProgress()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={4}>
        {renderProductivityInsights()}
      </TabPanel>
    </Box>
  );
};

export default AnalyticsDashboard; 