import React, { useMemo } from 'react';
import { 
  Box, 
  Grid, 
  Paper, 
  Typography, 
  Chip,
  Divider,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { 
  Notifications as NotificationsIcon,
  DateRange as CalendarIcon,
  Timer as TimerIcon,
  ViewKanban
} from '@mui/icons-material';

import { RootState } from '../../stores/store';
import { getHighPriorityTasks, getUniqueTags } from '../../utils/taskStatsUtils';

// Import all dashboard components
import TaskStatusTracker from './TaskStatusTracker';
import TaskProgressTimeline from './TaskProgressTimeline';
import TaskProductivityAnalytics from './TaskProductivityAnalytics';
import TaskPriorityView from './TaskPriorityView';
import TaskCompletionHistory from './TaskCompletionHistory';
import ConfigurableTaskView from './ConfigurableTaskView';
import TaskWorkloadDistribution from './TaskWorkloadDistribution';
import TaskAssignmentTracker from './TaskAssignmentTracker';
import TaskAssignmentReport from './TaskAssignmentReport';
import TaskReportGenerator from './TaskReportGenerator';
import TaskNotificationCenter from './TaskNotificationCenter';
import TaskCalendarView from './TaskCalendarView';
import TaskTimeTracker from './TaskTimeTracker';
import TaskKanbanBoard from './TaskKanbanBoard';

// Dashboard tab types
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ pt: 2, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const [tabValue, setTabValue] = useState(0);
  
  // Get high priority tasks
  const highPriorityTasks = useMemo(() => {
    return getHighPriorityTasks(tasks);
  }, [tasks]);
  
  // Extract unique tags
  const uniqueTags = useMemo(() => {
    return getUniqueTags(tasks);
  }, [tasks]);
  
  // Project stats
  const projectStats = useMemo(() => {
    return {
      totalTasks: tasks.length,
      activeTasks: tasks.filter(task => task.status !== 'completed').length,
      completedTasks: tasks.filter(task => task.status === 'completed').length,
      highPriorityCount: highPriorityTasks.length,
      tagsCount: uniqueTags.length
    };
  }, [tasks, highPriorityTasks.length, uniqueTags.length]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Project Overview */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>Project Overview</Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle1" gutterBottom>Project Statistics</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                <Chip 
                  label={`Total Tasks: ${projectStats.totalTasks}`} 
                  variant="outlined" 
                  color="primary"
                />
                <Chip 
                  label={`Active Tasks: ${projectStats.activeTasks}`} 
                  variant="outlined" 
                  color="info"
                />
                <Chip 
                  label={`Completed: ${projectStats.completedTasks}`} 
                  variant="outlined" 
                  color="success"
                />
                <Chip 
                  label={`High Priority: ${projectStats.highPriorityCount}`} 
                  variant="outlined" 
                  color="error"
                />
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>Tags Summary</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {uniqueTags.slice(0, 12).map(tag => (
                <Chip 
                  key={tag} 
                  label={tag} 
                  size="small" 
                  variant="outlined"
                />
              ))}
              {uniqueTags.length > 12 && (
                <Chip 
                  label={`+${uniqueTags.length - 12} more`} 
                  size="small" 
                  variant="outlined" 
                  color="secondary"
                />
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Dashboard Tabs */}
      <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Overview" />
            <Tab label="Team Workload" />
            <Tab label="Assignment Report" />
            <Tab label="Task Views" />
            <Tab label="Reports" />
            <Tab 
              icon={
                <Badge 
                  badgeContent={5} 
                  color="error"
                  sx={{ '& .MuiBadge-badge': { fontSize: '0.5rem', height: '14px', minWidth: '14px' } }}
                >
                  <NotificationsIcon />
                </Badge>
              } 
              aria-label="notifications"
              iconPosition="start"
              label="Notifications"
            />
            <Tab
              icon={<CalendarIcon />}
              aria-label="calendar"
              iconPosition="start"
              label="Calendar"
            />
            <Tab
              icon={<TimerIcon />}
              aria-label="time-tracking"
              iconPosition="start"
              label="Time Tracking"
            />
            <Tab
              icon={<ViewKanban />}
              aria-label="kanban-board"
              iconPosition="start"
              label="Kanban Board"
            />
          </Tabs>
        </Box>
        
        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <TaskProductivityAnalytics />
            </Grid>
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <TaskStatusTracker />
            </Grid>
            <Grid item xs={12} md={7}>
              <TaskProgressTimeline />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Team Workload Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <TaskWorkloadDistribution />
            </Grid>
            <Grid item xs={12} md={5}>
              <TaskAssignmentTracker />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Assignment Report Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TaskAssignmentReport />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Task Views Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TaskPriorityView />
            </Grid>
            <Grid item xs={12} md={6}>
              <TaskCompletionHistory />
            </Grid>
          </Grid>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <ConfigurableTaskView />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Reports Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TaskReportGenerator />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TaskNotificationCenter />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Calendar Tab */}
        <TabPanel value={tabValue} index={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TaskCalendarView />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Time Tracking Tab */}
        <TabPanel value={tabValue} index={7}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TaskTimeTracker />
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Kanban Board Tab */}
        <TabPanel value={tabValue} index={8}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TaskKanbanBoard />
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Dashboard; 