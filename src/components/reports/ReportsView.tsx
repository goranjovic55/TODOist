import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  SelectChangeEvent,
  Button
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { useSelector } from 'react-redux';
import { RootState } from '../../stores/store';
import { Task, Project, Group } from '../../stores/tasksSlice';
import ReportsExport, { ExportOptions } from './ReportsExport';
import { Download as DownloadIcon } from '@mui/icons-material';
import { exportTasks } from '../../utils/exportUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ReportsView: React.FC = () => {
  const { tasks, projects, groups } = useSelector((state: RootState) => state.tasks);
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('week');
  const [selectedProject, setSelectedProject] = useState('all');
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };
  
  const handleProjectChange = (event: SelectChangeEvent) => {
    setSelectedProject(event.target.value);
  };
  
  // Filter tasks based on selected project
  const filteredTasks = useMemo(() => {
    if (selectedProject === 'all') {
      return tasks;
    }
    
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return [];
    
    // Get all group IDs that belong to this project
    const projectGroupIds = groups
      .filter(g => g.parentId === project.id)
      .map(g => g.id);
    
    // Filter tasks that belong to these groups
    return tasks.filter(task => 
      task.parentId && projectGroupIds.includes(task.parentId)
    );
  }, [tasks, groups, projects, selectedProject]);
  
  // Task status counts
  const statusCounts = useMemo(() => {
    const counts = {
      completed: 0,
      in_progress: 0,
      not_started: 0,
      blocked: 0
    };
    
    filteredTasks.forEach(task => {
      counts[task.status]++;
    });
    
    return counts;
  }, [filteredTasks]);
  
  // Calculate completion rate
  const completionRate = useMemo(() => {
    if (filteredTasks.length === 0) return 0;
    return (statusCounts.completed / filteredTasks.length) * 100;
  }, [filteredTasks, statusCounts]);
  
  // Priority distribution
  const priorityCounts = useMemo(() => {
    const counts = {
      high: 0,
      medium: 0,
      low: 0
    };
    
    filteredTasks.forEach(task => {
      counts[task.priority]++;
    });
    
    return counts;
  }, [filteredTasks]);
  
  // Data for the status distribution pie chart
  const statusPieData = [
    { name: 'Completed', value: statusCounts.completed, color: '#4caf50' },
    { name: 'In Progress', value: statusCounts.in_progress, color: '#2196f3' },
    { name: 'Not Started', value: statusCounts.not_started, color: '#9e9e9e' },
    { name: 'Blocked', value: statusCounts.blocked, color: '#f44336' }
  ];
  
  // Data for the priority distribution pie chart
  const priorityPieData = [
    { name: 'High', value: priorityCounts.high, color: '#f44336' },
    { name: 'Medium', value: priorityCounts.medium, color: '#ff9800' },
    { name: 'Low', value: priorityCounts.low, color: '#4caf50' }
  ];
  
  // Task completion over time (days of the week)
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const completionByDay = useMemo(() => {
    const counts = daysOfWeek.map(day => ({ name: day, completed: 0, created: 0 }));
    
    filteredTasks.forEach(task => {
      if (task.status === 'completed' && task.updatedAt) {
        const dayIndex = new Date(task.updatedAt).getDay();
        counts[dayIndex].completed++;
      }
      
      if (task.createdAt) {
        const dayIndex = new Date(task.createdAt).getDay();
        counts[dayIndex].created++;
      }
    });
    
    return counts;
  }, [filteredTasks]);
  
  // Project progress
  const projectProgress = useMemo(() => {
    return projects.map(project => {
      // Find groups for this project
      const projectGroups = groups.filter(g => g.parentId === project.id);
      const groupIds = projectGroups.map(g => g.id);
      
      // Find tasks for these groups
      const projectTasks = tasks.filter(t => t.parentId && groupIds.includes(t.parentId));
      
      // Calculate completion percentage
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
      const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      return {
        id: project.id,
        name: project.name,
        totalTasks,
        completedTasks,
        percentage
      };
    });
  }, [projects, groups, tasks]);
  
  // Calculate average completion time (in days)
  const averageCompletionTime = useMemo(() => {
    const completedTasks = filteredTasks.filter(t => 
      t.status === 'completed' && t.createdAt && t.updatedAt
    );
    
    if (completedTasks.length === 0) return 0;
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const createdDate = new Date(task.createdAt);
      const completedDate = new Date(task.updatedAt);
      const diffTime = Math.abs(completedDate.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return sum + diffDays;
    }, 0);
    
    return totalDays / completedTasks.length;
  }, [filteredTasks]);
  
  // Most productive tags
  const tagProductivity = useMemo(() => {
    const tagStats = new Map();
    
    filteredTasks.forEach(task => {
      if (task.tags && task.tags.length > 0) {
        task.tags.forEach(tag => {
          if (!tagStats.has(tag)) {
            tagStats.set(tag, { total: 0, completed: 0 });
          }
          
          const stats = tagStats.get(tag);
          stats.total++;
          
          if (task.status === 'completed') {
            stats.completed++;
          }
        });
      }
    });
    
    // Convert to array and calculate completion rate
    return Array.from(tagStats.entries())
      .map(([tag, stats]) => ({
        tag,
        total: stats.total,
        completed: stats.completed,
        completionRate: (stats.completed / stats.total) * 100
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);  // Top 5 tags
  }, [filteredTasks]);
  
  const handleExportClick = () => {
    setExportDialogOpen(true);
  };
  
  const handleExportClose = () => {
    setExportDialogOpen(false);
  };
  
  const handleExport = (options: ExportOptions) => {
    console.log('Exporting report with options:', options);
    
    // Use the exportTasks utility function
    exportTasks(options, tasks, projects, groups);
  };
  
  // Define available report sections for export
  const reportSections = [
    { id: 'summary', name: 'Summary Statistics' },
    { id: 'taskStatus', name: 'Task Status Distribution' },
    { id: 'priority', name: 'Priority Distribution' },
    { id: 'dayOfWeek', name: 'Activity by Day of Week' },
    { id: 'projects', name: 'Project Progress' },
    { id: 'tags', name: 'Tag Productivity' }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Reports & Analytics
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<DownloadIcon />}
          onClick={handleExportClick}
        >
          Export Report
        </Button>
      </Box>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Tasks
              </Typography>
              <Typography variant="h4">
                {filteredTasks.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completion Rate
              </Typography>
              <Typography variant="h4">
                {Math.round(completionRate)}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={completionRate} 
                color={
                  completionRate >= 75 ? 'success' :
                  completionRate >= 50 ? 'primary' :
                  completionRate >= 25 ? 'warning' : 'error'
                }
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Avg. Completion Time
              </Typography>
              <Typography variant="h4">
                {averageCompletionTime.toFixed(1)} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Projects
              </Typography>
              <Typography variant="h4">
                {projects.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="time-range-label">Time Range</InputLabel>
            <Select
              labelId="time-range-label"
              id="time-range"
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="quarter">Last Quarter</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="project-filter-label">Project</InputLabel>
            <Select
              labelId="project-filter-label"
              id="project-filter"
              value={selectedProject}
              label="Project"
              onChange={handleProjectChange}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map(project => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="report tabs">
          <Tab label="Overview" id="report-tab-0" aria-controls="report-tabpanel-0" />
          <Tab label="Tasks" id="report-tab-1" aria-controls="report-tabpanel-1" />
          <Tab label="Projects" id="report-tab-2" aria-controls="report-tabpanel-2" />
          <Tab label="Productivity" id="report-tab-3" aria-controls="report-tabpanel-3" />
        </Tabs>
        
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Task Status Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Priority Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Task Activity by Day of Week
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={completionByDay}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="created" name="Tasks Created" fill="#8884d8" />
                    <Bar dataKey="completed" name="Tasks Completed" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Task Status Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Completed</TableCell>
                      <TableCell align="right">{statusCounts.completed}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((statusCounts.completed / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>In Progress</TableCell>
                      <TableCell align="right">{statusCounts.in_progress}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((statusCounts.in_progress / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Not Started</TableCell>
                      <TableCell align="right">{statusCounts.not_started}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((statusCounts.not_started / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Blocked</TableCell>
                      <TableCell align="right">{statusCounts.blocked}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((statusCounts.blocked / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Task Priority Breakdown
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Priority</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>High</TableCell>
                      <TableCell align="right">{priorityCounts.high}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((priorityCounts.high / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Medium</TableCell>
                      <TableCell align="right">{priorityCounts.medium}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((priorityCounts.medium / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Low</TableCell>
                      <TableCell align="right">{priorityCounts.low}</TableCell>
                      <TableCell align="right">
                        {filteredTasks.length > 0 
                          ? `${((priorityCounts.low / filteredTasks.length) * 100).toFixed(1)}%` 
                          : '0%'}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Project Progress
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Project</TableCell>
                      <TableCell align="right">Tasks</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Progress</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projectProgress.map(project => (
                      <TableRow key={project.id}>
                        <TableCell>{project.name}</TableCell>
                        <TableCell align="right">{project.totalTasks}</TableCell>
                        <TableCell align="right">{project.completedTasks}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={project.percentage} 
                                color={
                                  project.percentage >= 75 ? 'success' :
                                  project.percentage >= 50 ? 'primary' :
                                  project.percentage >= 25 ? 'warning' : 'error'
                                }
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                {`${Math.round(project.percentage)}%`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Most Productive Tags
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tag</TableCell>
                      <TableCell align="right">Tasks</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Completion Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tagProductivity.map(tag => (
                      <TableRow key={tag.tag}>
                        <TableCell>{tag.tag}</TableCell>
                        <TableCell align="right">{tag.total}</TableCell>
                        <TableCell align="right">{tag.completed}</TableCell>
                        <TableCell align="right">{`${Math.round(tag.completionRate)}%`}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Productivity Trends
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={completionByDay}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completed" 
                      name="Tasks Completed" 
                      stroke="#82ca9d" 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
      
      <ReportsExport
        open={exportDialogOpen}
        onClose={handleExportClose}
        onExport={handleExport}
        availableSections={reportSections}
      />
    </Box>
  );
};

export default ReportsView; 