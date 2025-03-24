import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  Grid,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';
import { getTasksInDateRange, getAssigneeStats, getWorkloadByAssignee } from '../../utils/taskStatsUtils';

/**
 * Component for generating PDF reports of task assignments and team metrics
 */
const TaskReportGenerator: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // State for report options
  const [reportTitle, setReportTitle] = useState('Task Assignment Report');
  const [timeRange, setTimeRange] = useState('month');
  const [includeOptions, setIncludeOptions] = useState({
    teamSummary: true,
    assigneeMetrics: true,
    taskList: true,
    statusChart: true,
    priorityChart: true
  });
  const [generating, setGenerating] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Get filtered tasks based on time range
  const filteredTasks = useMemo(() => {
    return getTasksInDateRange(tasks, timeRange as 'today' | 'week' | 'month' | 'all');
  }, [tasks, timeRange]);
  
  // Get assignee stats for report
  const assigneeStats = useMemo(() => {
    return getAssigneeStats(filteredTasks);
  }, [filteredTasks]);
  
  // Get workload distribution for report
  const workloadData = useMemo(() => {
    return getWorkloadByAssignee(filteredTasks);
  }, [filteredTasks]);
  
  // Handle option changes
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIncludeOptions({
      ...includeOptions,
      [event.target.name]: event.target.checked
    });
  };
  
  // Mock function to generate PDF (in a real app, would use a library like jsPDF or react-pdf)
  const generatePDF = () => {
    setGenerating(true);
    
    // Simulate PDF generation delay
    setTimeout(() => {
      setGenerating(false);
      setNotification({
        open: true,
        message: 'PDF report generated successfully! Download starting...',
        severity: 'success'
      });
      
      // In a real implementation, this would trigger the actual PDF download
      simulateDownload();
    }, 2000);
  };
  
  // Mock function to simulate file download
  const simulateDownload = () => {
    // In a real implementation, this would be the actual PDF blob
    const dummyContent = `Task Report: ${reportTitle}\n` +
      `Time Range: ${timeRange}\n` +
      `Total Tasks: ${filteredTasks.length}\n` +
      `Team Members: ${assigneeStats.filter(a => a.name !== 'Unassigned').length}\n`;
    
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportTitle.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Calculate report summary stats
  const reportSummary = useMemo(() => {
    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.status === 'completed').length;
    const overdueTasks = filteredTasks.filter(t => 
      t.status !== 'completed' && 
      t.endDate && 
      new Date(t.endDate) < new Date()
    ).length;
    const teamMembers = new Set(filteredTasks
      .map(t => t.assignedTo)
      .filter(a => a) // Filter out undefined/null
    ).size;
    
    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      teamMembers,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  }, [filteredTasks]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Task Report Generator
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Grid container spacing={3}>
        {/* Report Configuration */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Report Options
            </Typography>
            
            <TextField
              fullWidth
              label="Report Title"
              variant="outlined"
              size="small"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              margin="normal"
            />
            
            <FormControl fullWidth margin="normal">
              <FormLabel component="legend">Time Range</FormLabel>
              <TextField
                select
                size="small"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="today">Today</option>
                <option value="week">Current Week</option>
                <option value="month">Current Month</option>
                <option value="all">All Time</option>
              </TextField>
            </FormControl>
            
            <FormControl component="fieldset" margin="normal">
              <FormLabel component="legend">Include in Report</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={includeOptions.teamSummary} onChange={handleOptionChange} name="teamSummary" />}
                  label="Team Summary"
                />
                <FormControlLabel
                  control={<Checkbox checked={includeOptions.assigneeMetrics} onChange={handleOptionChange} name="assigneeMetrics" />}
                  label="Assignee Metrics"
                />
                <FormControlLabel
                  control={<Checkbox checked={includeOptions.taskList} onChange={handleOptionChange} name="taskList" />}
                  label="Task List"
                />
                <FormControlLabel
                  control={<Checkbox checked={includeOptions.statusChart} onChange={handleOptionChange} name="statusChart" />}
                  label="Status Distribution Chart"
                />
                <FormControlLabel
                  control={<Checkbox checked={includeOptions.priorityChart} onChange={handleOptionChange} name="priorityChart" />}
                  label="Priority Distribution Chart"
                />
              </FormGroup>
            </FormControl>
            
            <Box sx={{ mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                onClick={generatePDF}
                disabled={generating}
                fullWidth
              >
                {generating ? 'Generating Report...' : 'Generate PDF Report'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                sx={{ mt: 1 }}
                fullWidth
                disabled={generating}
              >
                Print Preview
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                sx={{ mt: 1 }}
                fullWidth
                disabled={generating}
              >
                Save Report Template
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Report Preview */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Report Preview
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="h5" align="center" gutterBottom>
              {reportTitle}
            </Typography>
            
            <Typography variant="subtitle2" align="center" gutterBottom color="text.secondary">
              Report Period: {timeRange === 'today' ? 'Today' : 
                timeRange === 'week' ? 'Current Week' : 
                timeRange === 'month' ? 'Current Month' : 'All Time'}
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Team Summary
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Tasks
                    </Typography>
                    <Typography variant="h5">
                      {reportSummary.totalTasks}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Completion Rate
                    </Typography>
                    <Typography variant="h5">
                      {reportSummary.completionRate}%
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Team Members
                    </Typography>
                    <Typography variant="h5">
                      {reportSummary.teamMembers}
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, bgcolor: 'background.default', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Overdue Tasks
                    </Typography>
                    <Typography variant="h5" color={reportSummary.overdueTasks > 0 ? 'error' : 'text.primary'}>
                      {reportSummary.overdueTasks}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
              
              {includeOptions.assigneeMetrics && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Top Assignees
                  </Typography>
                  
                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                    {assigneeStats
                      .filter(stats => stats.name !== 'Unassigned')
                      .slice(0, 5)
                      .map((assignee, index) => (
                        <Box key={assignee.name} sx={{ mb: index < 4 ? 1.5 : 0 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">
                              {assignee.name}
                            </Typography>
                            <Typography variant="body2" fontWeight="bold">
                              {assignee.total} tasks ({Math.round(assignee.completionRate)}% complete)
                            </Typography>
                          </Box>
                          <Box 
                            sx={{ 
                              height: 6, 
                              bgcolor: 'grey.300', 
                              borderRadius: 5, 
                              overflow: 'hidden' 
                            }}
                          >
                            <Box 
                              sx={{ 
                                height: '100%', 
                                width: `${assignee.completionRate}%`, 
                                bgcolor: assignee.completionRate >= 75 ? 'success.main' : 
                                        assignee.completionRate >= 50 ? 'primary.main' : 
                                        assignee.completionRate >= 25 ? 'warning.main' : 'error.main'
                              }} 
                            />
                          </Box>
                        </Box>
                      ))
                    }
                    
                    {assigneeStats.filter(stats => stats.name !== 'Unassigned').length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center">
                        No assignee data available
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              
              {includeOptions.taskList && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Task Summary (Preview)
                  </Typography>
                  
                  <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                    {filteredTasks.slice(0, 5).map((task, index) => (
                      <Box key={task.id} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        mb: index < 4 ? 1 : 0,
                        py: 0.5,
                        borderBottom: index < 4 ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}>
                        <Typography variant="body2" sx={{ 
                          maxWidth: '60%', 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.assignedTo || 'Unassigned'}
                        </Typography>
                      </Box>
                    ))}
                    
                    {filteredTasks.length > 5 && (
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        + {filteredTasks.length - 5} more tasks
                      </Typography>
                    )}
                    
                    {filteredTasks.length === 0 && (
                      <Typography variant="body2" color="text.secondary" align="center">
                        No task data available
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default TaskReportGenerator; 