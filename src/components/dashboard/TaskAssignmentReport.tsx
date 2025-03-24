import React, { useMemo, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  FormControl,
  Select,
  InputLabel
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';
import { getTasksInDateRange, getAssigneeStats, AssigneeStats } from '../../utils/taskStatsUtils';

// Task status colors
const statusColors = {
  'not_started': 'default',
  'in_progress': 'primary',
  'completed': 'success',
  'blocked': 'error'
};

// Interface for task assignment report row
interface TaskAssignmentRow {
  id: string;
  title: string;
  assignee: string;
  status: string;
  priority: string;
  createdAt: string;
  dueDate?: string;
}

// Sort order type
type Order = 'asc' | 'desc';

/**
 * Task Assignment Report component that displays detailed assignment information
 * and allows filtering, sorting, and exporting data
 */
const TaskAssignmentReport: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  
  // State for sorting
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof TaskAssignmentRow>('assignee');
  
  // State for filtering
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  
  // Get filtered tasks (last month by default)
  const recentTasks = useMemo(() => {
    return getTasksInDateRange(tasks, 'month');
  }, [tasks]);
  
  // Get unique assignees for filter dropdown
  const uniqueAssignees = useMemo(() => {
    const assignees = new Set<string>();
    recentTasks.forEach(task => {
      assignees.add(task.assignedTo || 'Unassigned');
    });
    return Array.from(assignees);
  }, [recentTasks]);
  
  // Transform tasks to table rows
  const taskRows = useMemo(() => {
    return recentTasks.map(task => ({
      id: task.id,
      title: task.title,
      assignee: task.assignedTo || 'Unassigned',
      status: task.status,
      priority: task.priority,
      createdAt: new Date(task.createdAt).toLocaleDateString(),
      dueDate: task.endDate ? new Date(task.endDate).toLocaleDateString() : undefined
    }));
  }, [recentTasks]);
  
  // Apply filters
  const filteredRows = useMemo(() => {
    return taskRows.filter(row => {
      // Text search
      const matchesSearch = searchQuery === '' || 
        row.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.assignee.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      
      // Assignee filter
      const matchesAssignee = assigneeFilter === 'all' || row.assignee === assigneeFilter;
      
      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [taskRows, searchQuery, statusFilter, assigneeFilter]);
  
  // Sort rows
  const sortedRows = useMemo(() => {
    const comparator = (a: TaskAssignmentRow, b: TaskAssignmentRow) => {
      // Handle special cases like dates and priorities
      if (orderBy === 'dueDate') {
        if (!a.dueDate) return order === 'asc' ? 1 : -1;
        if (!b.dueDate) return order === 'asc' ? -1 : 1;
        
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return order === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }
      
      if (orderBy === 'priority') {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        const valueA = priorityOrder[a.priority as keyof typeof priorityOrder];
        const valueB = priorityOrder[b.priority as keyof typeof priorityOrder];
        return order === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // Default string comparison
      const valueA = a[orderBy];
      const valueB = b[orderBy];
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return order === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return 0;
    };
    
    return [...filteredRows].sort(comparator);
  }, [filteredRows, order, orderBy]);
  
  // Handle sort request
  const handleRequestSort = (property: keyof TaskAssignmentRow) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handle filter menu
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };
  
  // Handle export to CSV
  const handleExport = () => {
    // Create CSV content
    const headers = ['Title', 'Assignee', 'Status', 'Priority', 'Created', 'Due Date'];
    const csvContent = [
      headers.join(','),
      ...sortedRows.map(row => [
        `"${row.title}"`,
        row.assignee,
        row.status,
        row.priority,
        row.createdAt,
        row.dueDate || ''
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'task_assignments.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredRows.length;
    const byStatus = {
      not_started: filteredRows.filter(row => row.status === 'not_started').length,
      in_progress: filteredRows.filter(row => row.status === 'in_progress').length,
      completed: filteredRows.filter(row => row.status === 'completed').length,
      blocked: filteredRows.filter(row => row.status === 'blocked').length
    };
    
    const byAssignee = filteredRows.reduce((acc, row) => {
      acc[row.assignee] = (acc[row.assignee] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, byStatus, byAssignee };
  }, [filteredRows]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Task Assignment Report
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            size="small" 
            startIcon={<ExportIcon />}
            onClick={handleExport}
            variant="outlined"
          >
            Export
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tasks or assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Assignee</InputLabel>
              <Select
                value={assigneeFilter}
                label="Assignee"
                onChange={(e) => setAssigneeFilter(e.target.value)}
              >
                <MenuItem value="all">All Assignees</MenuItem>
                {uniqueAssignees.map(assignee => (
                  <MenuItem key={assignee} value={assignee}>
                    {assignee}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Showing {filteredRows.length} tasks
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                size="small" 
                label={`Not Started: ${summary.byStatus.not_started}`} 
                color="default" 
                variant="outlined" 
              />
              <Chip 
                size="small" 
                label={`In Progress: ${summary.byStatus.in_progress}`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                size="small" 
                label={`Completed: ${summary.byStatus.completed}`} 
                color="success" 
                variant="outlined" 
              />
              <Chip 
                size="small" 
                label={`Blocked: ${summary.byStatus.blocked}`} 
                color="error" 
                variant="outlined" 
              />
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'title'}
                  direction={orderBy === 'title' ? order : 'asc'}
                  onClick={() => handleRequestSort('title')}
                >
                  Task
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'assignee'}
                  direction={orderBy === 'assignee' ? order : 'asc'}
                  onClick={() => handleRequestSort('assignee')}
                >
                  Assignee
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'status'}
                  direction={orderBy === 'status' ? order : 'asc'}
                  onClick={() => handleRequestSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'priority'}
                  direction={orderBy === 'priority' ? order : 'asc'}
                  onClick={() => handleRequestSort('priority')}
                >
                  Priority
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'createdAt'}
                  direction={orderBy === 'createdAt' ? order : 'asc'}
                  onClick={() => handleRequestSort('createdAt')}
                >
                  Created
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'dueDate'}
                  direction={orderBy === 'dueDate' ? order : 'asc'}
                  onClick={() => handleRequestSort('dueDate')}
                >
                  Due Date
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.title}</TableCell>
                <TableCell>{row.assignee}</TableCell>
                <TableCell>
                  <Chip 
                    size="small"
                    label={row.status.replace('_', ' ')}
                    color={statusColors[row.status as keyof typeof statusColors] as 'default' | 'primary' | 'success' | 'error'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    size="small"
                    label={row.priority}
                    color={row.priority === 'high' ? 'error' : row.priority === 'medium' ? 'warning' : 'default'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{row.createdAt}</TableCell>
                <TableCell>{row.dueDate || '-'}</TableCell>
              </TableRow>
            ))}
            {sortedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No tasks found matching the filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TaskAssignmentReport; 