import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Divider,
  SelectChangeEvent,
  IconButton,
  Grid,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { setFilters, resetFilters } from '../../stores/uiSlice';
import { TaskFilters as TaskFiltersType } from '../../stores/uiSlice';

const TaskFilters: React.FC = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector((state: RootState) => state.ui);
  const { projects, groups } = useSelector((state: RootState) => state.tasks);
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Local state for filter values
  const [searchText, setSearchText] = useState(filters.searchText || '');
  const [status, setStatus] = useState<string[]>(filters.status || []);
  const [priority, setPriority] = useState<string[]>(filters.priority || []);
  const [selectedProjects, setSelectedProjects] = useState<string[]>(filters.projectIds || []);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(filters.groupIds || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [startDateFrom, setStartDateFrom] = useState<Date | null>(
    filters.startDateFrom ? new Date(filters.startDateFrom) : null
  );
  const [startDateTo, setStartDateTo] = useState<Date | null>(
    filters.startDateTo ? new Date(filters.startDateTo) : null
  );
  const [endDateFrom, setEndDateFrom] = useState<Date | null>(
    filters.endDateFrom ? new Date(filters.endDateFrom) : null
  );
  const [endDateTo, setEndDateTo] = useState<Date | null>(
    filters.endDateTo ? new Date(filters.endDateTo) : null
  );
  
  // Handle changes to filter values
  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    setStatus(event.target.value as string[]);
  };
  
  const handlePriorityChange = (event: SelectChangeEvent<string[]>) => {
    setPriority(event.target.value as string[]);
  };
  
  const handleProjectsChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedProjects(event.target.value as string[]);
  };
  
  const handleGroupsChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedGroups(event.target.value as string[]);
  };
  
  const handleTagsChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedTags(event.target.value as string[]);
  };
  
  // Apply the filters
  const applyFilters = () => {
    const newFilters: TaskFiltersType = {
      searchText,
      status,
      priority,
      projectIds: selectedProjects,
      groupIds: selectedGroups,
      tags: selectedTags,
      startDateFrom: startDateFrom ? startDateFrom.toISOString() : null,
      startDateTo: startDateTo ? startDateTo.toISOString() : null,
      endDateFrom: endDateFrom ? endDateFrom.toISOString() : null,
      endDateTo: endDateTo ? endDateTo.toISOString() : null
    };
    
    dispatch(setFilters(newFilters));
  };
  
  // Reset all filters
  const clearAllFilters = () => {
    setSearchText('');
    setStatus([]);
    setPriority([]);
    setSelectedProjects([]);
    setSelectedGroups([]);
    setSelectedTags([]);
    setStartDateFrom(null);
    setStartDateTo(null);
    setEndDateFrom(null);
    setEndDateTo(null);
    
    dispatch(resetFilters());
  };
  
  // Toggle advanced filters visibility
  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };
  
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Search tasks..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchText && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchText('')}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{ mr: 2 }}
        />
        
        <Button
          variant="outlined"
          startIcon={showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          onClick={toggleAdvancedFilters}
        >
          Filters
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={clearAllFilters}
          sx={{ ml: 1 }}
        >
          Clear
        </Button>
        
        <Button
          variant="contained"
          onClick={applyFilters}
          sx={{ ml: 1 }}
        >
          Apply
        </Button>
      </Box>
      
      <Collapse in={showAdvancedFilters}>
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={status}
                onChange={handleStatusChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value.replace('_', ' ')} size="small" />
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
          </Grid>
          
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                multiple
                value={priority}
                onChange={handlePriorityChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
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
          </Grid>
          
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Projects</InputLabel>
              <Select
                multiple
                value={selectedProjects}
                onChange={handleProjectsChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const project = projects.find(p => p.id === value);
                      return project ? (
                        <Chip key={value} label={project.name} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
                label="Projects"
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Groups</InputLabel>
              <Select
                multiple
                value={selectedGroups}
                onChange={handleGroupsChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const group = groups.find(g => g.id === value);
                      return group ? (
                        <Chip key={value} label={group.name} size="small" />
                      ) : null;
                    })}
                  </Box>
                )}
                label="Groups"
              >
                {groups.map(group => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Date Range Filters
            </Typography>
          </Grid>
          
          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date From"
                value={startDateFrom}
                onChange={(date) => setStartDateFrom(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date To"
                value={startDateTo}
                onChange={(date) => setStartDateTo(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date From"
                value={endDateFrom}
                onChange={(date) => setEndDateFrom(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date To"
                value={endDateTo}
                onChange={(date) => setEndDateTo(date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Collapse>
    </Paper>
  );
};

export default TaskFilters; 