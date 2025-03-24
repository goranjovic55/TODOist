import React, { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Chip,
  SelectChangeEvent,
  Box,
  Typography,
  Grid,
  TextField,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useDispatch, useSelector } from 'react-redux';

import { RootState } from '../../stores/store';
import { setFilters } from '../../stores/uiSlice';

interface TaskFiltersProps {
  open: boolean;
  onClose: () => void;
}

const TaskFilters: React.FC<TaskFiltersProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { projects, groups, tasks } = useSelector((state: RootState) => state.tasks);
  const currentFilters = useSelector((state: RootState) => state.ui.filters);
  
  // Filter states
  const [status, setStatus] = useState<string[]>(currentFilters.status || []);
  const [priority, setPriority] = useState<string[]>(currentFilters.priority || []);
  const [projectIds, setProjectIds] = useState<string[]>(currentFilters.projectIds || []);
  const [groupIds, setGroupIds] = useState<string[]>(currentFilters.groupIds || []);
  const [tags, setTags] = useState<string[]>(currentFilters.tags || []);
  const [startDateFrom, setStartDateFrom] = useState<Date | null>(
    currentFilters.startDateFrom ? new Date(currentFilters.startDateFrom) : null
  );
  const [startDateTo, setStartDateTo] = useState<Date | null>(
    currentFilters.startDateTo ? new Date(currentFilters.startDateTo) : null
  );
  const [endDateFrom, setEndDateFrom] = useState<Date | null>(
    currentFilters.endDateFrom ? new Date(currentFilters.endDateFrom) : null
  );
  const [endDateTo, setEndDateTo] = useState<Date | null>(
    currentFilters.endDateTo ? new Date(currentFilters.endDateTo) : null
  );
  const [searchText, setSearchText] = useState<string>(currentFilters.searchText || '');
  
  // Extract all unique tags from tasks
  const allTags = Array.from(new Set(tasks.flatMap(task => task.tags)));
  
  // Handle status filter change
  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setStatus(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle priority filter change
  const handlePriorityChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setPriority(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle project filter change
  const handleProjectChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selectedProjects = typeof value === 'string' ? value.split(',') : value;
    setProjectIds(selectedProjects);
    
    // If a project is deselected, also remove its groups
    if (currentFilters.projectIds?.length > selectedProjects.length) {
      const removedProjects = currentFilters.projectIds.filter(id => !selectedProjects.includes(id));
      const groupsToRemove = groups
        .filter(group => removedProjects.includes(group.parentId || ''))
        .map(group => group.id);
      
      setGroupIds(prev => prev.filter(id => !groupsToRemove.includes(id)));
    }
  };
  
  // Handle group filter change
  const handleGroupChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setGroupIds(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Handle tag filter change
  const handleTagsChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    setTags(newValue);
  };
  
  // Get filtered groups based on selected projects
  const filteredGroups = projectIds.length > 0
    ? groups.filter(group => projectIds.includes(group.parentId || ''))
    : groups;
  
  // Apply filters
  const handleApplyFilters = () => {
    dispatch(setFilters({
      status,
      priority,
      projectIds,
      groupIds,
      tags,
      startDateFrom: startDateFrom?.toISOString(),
      startDateTo: startDateTo?.toISOString(),
      endDateFrom: endDateFrom?.toISOString(),
      endDateTo: endDateTo?.toISOString(),
      searchText
    }));
    onClose();
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setStatus([]);
    setPriority([]);
    setProjectIds([]);
    setGroupIds([]);
    setTags([]);
    setStartDateFrom(null);
    setStartDateTo(null);
    setEndDateFrom(null);
    setEndDateTo(null);
    setSearchText('');
    
    dispatch(setFilters({
      status: [],
      priority: [],
      projectIds: [],
      groupIds: [],
      tags: [],
      startDateFrom: null,
      startDateTo: null,
      endDateFrom: null,
      endDateTo: null,
      searchText: ''
    }));
    
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Filter Tasks</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Text search */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search Text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search in task title and description"
                margin="normal"
              />
            </Grid>
            
            {/* Status filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  multiple
                  value={status}
                  onChange={handleStatusChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value.replace('_', ' ')} 
                          variant="outlined" 
                          size="small" 
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Priority filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="priority-label">Priority</InputLabel>
                <Select
                  labelId="priority-label"
                  id="priority"
                  multiple
                  value={priority}
                  onChange={handlePriorityChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          variant="outlined" 
                          size="small"
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Project filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="project-label">Projects</InputLabel>
                <Select
                  labelId="project-label"
                  id="project"
                  multiple
                  value={projectIds}
                  onChange={handleProjectChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const project = projects.find(p => p.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={project?.name || value} 
                            variant="outlined" 
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Group filter */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="group-label">Groups</InputLabel>
                <Select
                  labelId="group-label"
                  id="group"
                  multiple
                  value={groupIds}
                  onChange={handleGroupChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const group = groups.find(g => g.id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={group?.name || value} 
                            variant="outlined" 
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {filteredGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Tag filter */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                Tags
              </Typography>
              <Autocomplete
                multiple
                id="tags-filter"
                options={allTags}
                value={tags}
                onChange={handleTagsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Select tags"
                    fullWidth
                  />
                )}
                renderTags={(tagValue, getTagProps) =>
                  tagValue.map((option, index) => (
                    <Chip 
                      variant="outlined" 
                      label={option} 
                      size="small" 
                      {...getTagProps({ index })} 
                    />
                  ))
                }
              />
            </Grid>
            
            {/* Date filters */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Date Range
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" gutterBottom>
                      Start Date
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <DatePicker
                        label="From"
                        value={startDateFrom}
                        onChange={(newValue) => setStartDateFrom(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            margin: 'dense'
                          }
                        }}
                      />
                      <DatePicker
                        label="To"
                        value={startDateTo}
                        onChange={(newValue) => setStartDateTo(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            margin: 'dense'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" gutterBottom>
                      Due Date
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <DatePicker
                        label="From"
                        value={endDateFrom}
                        onChange={(newValue) => setEndDateFrom(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            margin: 'dense'
                          }
                        }}
                      />
                      <DatePicker
                        label="To"
                        value={endDateTo}
                        onChange={(newValue) => setEndDateTo(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            size: 'small',
                            margin: 'dense'
                          }
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </LocalizationProvider>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClearFilters} color="inherit">
          Clear Filters
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleApplyFilters} variant="contained" color="primary">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaskFilters; 