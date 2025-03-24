import React, { useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import { useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import { RootState } from '../../stores/store';
import { getTasksInDateRange } from '../../utils/taskStatsUtils';
import { formatDate } from '../../utils/dateUtils';

type TimeRange = 'week' | 'month' | 'all';

const TaskProgressTimeline: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const [timeRange, setTimeRange] = React.useState<TimeRange>('week');

  // Get tasks within the selected time range
  const filteredTasks = useMemo(() => {
    return getTasksInDateRange(tasks, timeRange);
  }, [tasks, timeRange]);

  // Process data for chart
  const chartData = useMemo(() => {
    // Map tasks to dates
    const tasksByDate = new Map<string, { created: number, completed: number }>();
    
    // Process task creation dates
    filteredTasks.forEach(task => {
      const dateCreated = formatDate(new Date(task.createdAt));
      
      if (!tasksByDate.has(dateCreated)) {
        tasksByDate.set(dateCreated, { created: 0, completed: 0 });
      }
      
      const current = tasksByDate.get(dateCreated)!;
      tasksByDate.set(dateCreated, { ...current, created: current.created + 1 });
    });
    
    // Process task completion dates
    filteredTasks.forEach(task => {
      if (task.completedAt) {
        const dateCompleted = formatDate(new Date(task.completedAt));
        
        if (!tasksByDate.has(dateCompleted)) {
          tasksByDate.set(dateCompleted, { created: 0, completed: 0 });
        }
        
        const current = tasksByDate.get(dateCompleted)!;
        tasksByDate.set(dateCompleted, { ...current, completed: current.completed + 1 });
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(tasksByDate.entries())
      .map(([date, counts]) => ({
        date,
        'Tasks Created': counts.created,
        'Tasks Completed': counts.completed
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTasks]);

  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeRange: TimeRange | null,
  ) => {
    if (newTimeRange !== null) {
      setTimeRange(newTimeRange);
    }
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">
          Task Creation & Completion Rates
        </Typography>
        
        <ToggleButtonGroup
          size="small"
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
        >
          <ToggleButton value="week">
            Week
          </ToggleButton>
          <ToggleButton value="month">
            Month
          </ToggleButton>
          <ToggleButton value="all">
            All Time
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ flexGrow: 1, minHeight: 300 }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Tasks Created" fill="#8884d8" />
              <Bar dataKey="Tasks Completed" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">
              No task data available for selected time range
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default TaskProgressTimeline; 