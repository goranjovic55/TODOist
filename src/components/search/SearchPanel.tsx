import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Collapse
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as NotStartedIcon,
  MoreHoriz as InProgressIcon,
  Block as BlockedIcon,
  Flag as PriorityIcon,
  CalendarToday as DateIcon,
  Label as TagIcon,
  Description as DescriptionIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Bookmark as BookmarkIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { Task, Project, Group } from '../../stores/tasksSlice';
import { format } from 'date-fns';

interface SearchPanelProps {
  onSelectTask: (taskId: string) => void;
}

interface SearchQuery {
  text: string;
  status: string[];
  priority: string[];
  tags: string[];
  projects: string[];
  dateRange: {
    from: string;
    to: string;
  };
}

interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onSelectTask }) => {
  const { tasks, projects, groups } = useSelector((state: RootState) => state.tasks);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({
    text: '',
    status: [],
    priority: [],
    tags: [],
    projects: [],
    dateRange: {
      from: '',
      to: ''
    }
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [searchResults, setSearchResults] = useState<Task[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedSearchName, setSavedSearchName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Collect all unique tags from tasks
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    tasks.forEach(task => {
      if (task.tags) {
        task.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [tasks]);

  // Effect to perform search when query changes
  useEffect(() => {
    const results = tasks.filter(task => {
      // Text search in title and description
      const textMatch = !searchQuery.text || 
        task.title.toLowerCase().includes(searchQuery.text.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.text.toLowerCase()));
      
      // Status filter
      const statusMatch = searchQuery.status.length === 0 || searchQuery.status.includes(task.status);
      
      // Priority filter
      const priorityMatch = searchQuery.priority.length === 0 || searchQuery.priority.includes(task.priority);
      
      // Tag filter
      const tagMatch = searchQuery.tags.length === 0 || 
        (task.tags && task.tags.some(tag => searchQuery.tags.includes(tag)));
      
      // Project filter
      let projectMatch = true;
      if (searchQuery.projects.length > 0) {
        // First find which group the task belongs to
        if (task.parentId) {
          const group = groups.find(g => g.id === task.parentId);
          if (group && group.parentId) {
            // Check if the project is in the filter
            projectMatch = searchQuery.projects.includes(group.parentId);
          } else {
            projectMatch = false;
          }
        } else {
          projectMatch = false;
        }
      }
      
      // Date range filter
      let dateMatch = true;
      if (searchQuery.dateRange.from || searchQuery.dateRange.to) {
        const taskDate = new Date(task.updatedAt || task.createdAt);
        
        if (searchQuery.dateRange.from) {
          const fromDate = new Date(searchQuery.dateRange.from);
          dateMatch = dateMatch && taskDate >= fromDate;
        }
        
        if (searchQuery.dateRange.to) {
          const toDate = new Date(searchQuery.dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          dateMatch = dateMatch && taskDate <= toDate;
        }
      }
      
      return textMatch && statusMatch && priorityMatch && tagMatch && projectMatch && dateMatch;
    });
    
    setSearchResults(results);
  }, [searchQuery, tasks, groups]);

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery({ ...searchQuery, text: event.target.value });
  };

  const handleFilterChange = (field: keyof SearchQuery, value: any) => {
    setSearchQuery({ ...searchQuery, [field]: value });
  };

  const handleStatusChange = (event: SelectChangeEvent<string[]>) => {
    handleFilterChange('status', event.target.value);
  };

  const handlePriorityChange = (event: SelectChangeEvent<string[]>) => {
    handleFilterChange('priority', event.target.value);
  };

  const handleTagsChange = (event: SelectChangeEvent<string[]>) => {
    handleFilterChange('tags', event.target.value);
  };

  const handleProjectsChange = (event: SelectChangeEvent<string[]>) => {
    handleFilterChange('projects', event.target.value);
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    setSearchQuery({
      ...searchQuery,
      dateRange: {
        ...searchQuery.dateRange,
        [field]: value
      }
    });
  };

  const handleClearSearch = () => {
    setSearchQuery({
      text: '',
      status: [],
      priority: [],
      tags: [],
      projects: [],
      dateRange: {
        from: '',
        to: ''
      }
    });
  };

  const handleToggleFilters = () => {
    setFiltersExpanded(!filtersExpanded);
  };

  const handleSaveSearch = () => {
    if (savedSearchName.trim()) {
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name: savedSearchName,
        query: { ...searchQuery }
      };
      
      setSavedSearches([...savedSearches, newSearch]);
      setSavedSearchName('');
      setSaveDialogOpen(false);
      
      // Save to localStorage
      const existingSearches = JSON.parse(localStorage.getItem('savedSearches') || '[]');
      localStorage.setItem('savedSearches', JSON.stringify([...existingSearches, newSearch]));
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setSearchQuery(search.query);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CompletedIcon color="success" />;
      case 'in_progress':
        return <InProgressIcon color="primary" />;
      case 'blocked':
        return <BlockedIcon color="error" />;
      case 'not_started':
      default:
        return <NotStartedIcon color="disabled" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
      default:
        return 'success';
    }
  };

  // Load saved searches from localStorage on mount
  useEffect(() => {
    const storedSearches = localStorage.getItem('savedSearches');
    if (storedSearches) {
      setSavedSearches(JSON.parse(storedSearches));
    }
  }, []);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Search Tasks
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          placeholder="Search by title or description..."
          value={searchQuery.text}
          onChange={handleTextChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery.text && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery({ ...searchQuery, text: '' })}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Box>
      
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          size="small"
          onClick={handleToggleFilters}
          startIcon={filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        >
          Advanced Filters
        </Button>
        
        <Box>
          <Button 
            size="small" 
            onClick={handleClearSearch} 
            startIcon={<ClearIcon />} 
            disabled={!searchQuery.text && 
              searchQuery.status.length === 0 && 
              searchQuery.priority.length === 0 && 
              searchQuery.tags.length === 0 && 
              searchQuery.projects.length === 0 && 
              !searchQuery.dateRange.from && 
              !searchQuery.dateRange.to}
          >
            Clear
          </Button>
          <Button 
            size="small" 
            onClick={() => setSaveDialogOpen(true)} 
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </Box>
      </Box>
      
      <Collapse in={filtersExpanded}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                multiple
                value={searchQuery.status}
                onChange={handleStatusChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={value.replace('_', ' ')} 
                        size="small" 
                        icon={getStatusIcon(value)}
                      />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="not_started">Not Started</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="priority-filter-label">Priority</InputLabel>
              <Select
                labelId="priority-filter-label"
                id="priority-filter"
                multiple
                value={searchQuery.priority}
                onChange={handlePriorityChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip 
                        key={value} 
                        label={value} 
                        size="small"
                        color={getPriorityColor(value) as any}
                      />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="tags-filter-label">Tags</InputLabel>
              <Select
                labelId="tags-filter-label"
                id="tags-filter"
                multiple
                value={searchQuery.tags}
                onChange={handleTagsChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {allTags.map(tag => (
                  <MenuItem key={tag} value={tag}>{tag}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel id="projects-filter-label">Projects</InputLabel>
              <Select
                labelId="projects-filter-label"
                id="projects-filter"
                multiple
                value={searchQuery.projects}
                onChange={handleProjectsChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => {
                      const project = projects.find(p => p.id === value);
                      return (
                        <Chip 
                          key={value} 
                          label={project ? project.name : value} 
                          size="small" 
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>{project.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="From Date"
              type="date"
              fullWidth
              size="small"
              value={searchQuery.dateRange.from}
              onChange={(e) => handleDateChange('from', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="To Date"
              type="date"
              fullWidth
              size="small"
              value={searchQuery.dateRange.to}
              onChange={(e) => handleDateChange('to', e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Collapse>
      
      {savedSearches.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Saved Searches
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {savedSearches.map(search => (
              <Chip
                key={search.id}
                label={search.name}
                icon={<BookmarkIcon />}
                onClick={() => handleLoadSearch(search)}
                size="small"
              />
            ))}
          </Box>
        </Box>
      )}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Typography variant="subtitle2" gutterBottom>
          {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
        </Typography>
        
        {searchResults.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">
              No tasks match your search criteria
            </Typography>
          </Box>
        ) : (
          <List>
            {searchResults.map(task => (
              <ListItem 
                key={task.id}
                divider
                button
                onClick={() => onSelectTask(task.id)}
              >
                <ListItemIcon>
                  {getStatusIcon(task.status)}
                </ListItemIcon>
                <ListItemText 
                  primary={task.title}
                  secondary={
                    <Box>
                      {task.description && (
                        <Typography variant="body2" noWrap>
                          {task.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip 
                          label={task.priority} 
                          size="small" 
                          color={getPriorityColor(task.priority) as any}
                          sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                        />
                        
                        {task.tags && task.tags.map(tag => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small"
                            sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                          />
                        ))}
                        
                        <Chip
                          icon={<DateIcon sx={{ fontSize: '0.8rem' }} />}
                          label={format(new Date(task.updatedAt || task.createdAt), 'MMM d, yyyy')}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0 } }}
                        />
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
      
      {/* Save Search Dialog */}
      <Collapse in={saveDialogOpen}>
        <Box sx={{ mt: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Save Current Search
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Enter search name"
              value={savedSearchName}
              onChange={(e) => setSavedSearchName(e.target.value)}
            />
            <Button 
              variant="contained" 
              onClick={handleSaveSearch}
              disabled={!savedSearchName.trim()}
            >
              Save
            </Button>
            <Button onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default SearchPanel; 