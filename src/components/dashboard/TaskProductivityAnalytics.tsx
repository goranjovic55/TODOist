import React, { useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as CompletedIcon,
  Schedule as DueIcon,
  BarChart as ChartIcon,
  Today as TodayIcon,
  DateRange as WeekIcon,
  CalendarToday as MonthIcon,
  AssignmentTurnedIn as CompletedIcon,
  Alarm as OverdueIcon,
  Add as CreatedIcon,
  Speed as ProductivityIcon,
  AccessTime as TimeIcon,
  CheckCircle as RateIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { PieChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';

import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { 
  getStartOfDay, 
  getWeekRange, 
  getMonthRange, 
  isToday, 
  isPast 
} from '../../utils/dateUtils';
import { 
  getTasksInDateRange, 
  getAverageCompletionTime, 
  getProductivityByDayOfWeek,
  getMostProductiveDay 
} from '../../utils/taskStatsUtils';

type TimeRange = 'today' | 'week' | 'month' | 'all';

interface ProductivityMetrics {
  tasksCompleted: number;
  tasksCreated: number;
  overdueTasks: number;
  completionRate: number;
  averageCompletionTime: number; // in days
  trend: 'up' | 'down' | 'stable';
}

// Custom label formatter for pie chart
const renderCustomizedLabel = ({ 
  cx, 
  cy, 
  midAngle, 
  innerRadius, 
  outerRadius, 
  percent 
}: any) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const TaskProductivityAnalytics: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  
  // Get tasks within the selected time range
  const filteredTasks = useMemo(() => {
    return getTasksInDateRange(tasks, timeRange);
  }, [tasks, timeRange]);

  // Get completed tasks within selected time range
  const completedTasks = useMemo(() => {
    return filteredTasks.filter(task => task.status === 'completed');
  }, [filteredTasks]);

  // Get tasks created in selected time range
  const createdTasks = useMemo(() => {
    return filteredTasks;
  }, [filteredTasks]);

  // Get overdue tasks
  const overdueTasks = useMemo(() => {
    return filteredTasks.filter(task => 
      task.status !== 'completed' && 
      task.endDate && 
      new Date(task.endDate) < new Date()
    );
  }, [filteredTasks]);

  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (createdTasks.length === 0) return 0;
    return (completedTasks.length / createdTasks.length) * 100;
  }, [completedTasks.length, createdTasks.length]);

  // Calculate average completion time
  const averageCompletionTime = useMemo(() => {
    return getAverageCompletionTime(completedTasks);
  }, [completedTasks]);

  // Get productivity by day of week
  const productivityByDay = useMemo(() => {
    return getProductivityByDayOfWeek(tasks);
  }, [tasks]);

  // Get most productive day
  const mostProductiveDay = useMemo(() => {
    return getMostProductiveDay(tasks);
  }, [tasks]);

  // Format for pie chart
  const productivityData = useMemo(() => {
    return Object.entries(productivityByDay).map(([day, count]) => ({
      name: day,
      value: count
    })).filter(item => item.value > 0);
  }, [productivityByDay]);

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  // Handle time range change
  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeRange: TimeRange | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };
  
  // Trend icon component
  const TrendIcon = productivityByDay.length > 0 ? (
    productivityByDay.some(day => day.value > 0) ? <TrendingUpIcon sx={{ color: 'success.main' }} /> : <TrendingDownIcon sx={{ color: 'error.main' }} />
  ) : null;
  
  // Function to render stat card
  const renderStatCard = (
    title: string, 
    value: string | number, 
    icon: React.ReactNode, 
    color: string
  ) => (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box sx={{ color, mr: 1 }}>
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h5" component="div" sx={{ textAlign: 'center', mt: 1 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          Productivity Analytics
        </Typography>
        
        <ToggleButtonGroup
          size="small"
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
        >
          <ToggleButton value="today">
            Today
          </ToggleButton>
          <ToggleButton value="week">
            Week
          </ToggleButton>
          <ToggleButton value="month">
            Month
          </ToggleButton>
          <ToggleButton value="all">
            All
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={4}>
          {renderStatCard(
            'Tasks Completed', 
            completedTasks.length, 
            <CompletedIcon />, 
            'success.main'
          )}
        </Grid>
        <Grid item xs={6} md={4}>
          {renderStatCard(
            'Tasks Created', 
            createdTasks.length, 
            <CreatedIcon />, 
            'primary.main'
          )}
        </Grid>
        <Grid item xs={6} md={4}>
          {renderStatCard(
            'Overdue Tasks', 
            overdueTasks.length, 
            <OverdueIcon />, 
            'error.main'
          )}
        </Grid>
        <Grid item xs={6} md={4}>
          {renderStatCard(
            'Completion Rate', 
            `${Math.round(completionRate)}%`, 
            <RateIcon />, 
            'info.main'
          )}
        </Grid>
        <Grid item xs={6} md={4}>
          {renderStatCard(
            'Avg. Completion Time', 
            `${averageCompletionTime.toFixed(1)} days`, 
            <TimeIcon />, 
            'warning.main'
          )}
        </Grid>
        <Grid item xs={6} md={4}>
          {renderStatCard(
            'Most Productive Day', 
            mostProductiveDay || 'N/A', 
            <ProductivityIcon />, 
            'secondary.main'
          )}
        </Grid>
      </Grid>
      
      <Box sx={{ height: 300 }}>
        <Typography variant="subtitle2" gutterBottom>
          Productivity by Day of Week
        </Typography>
        
        {productivityData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productivityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {productivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} tasks`, 'Completed']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No completion data available for selected time range
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TaskProductivityAnalytics; 