import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  FormControlLabel,
  Checkbox,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CloneIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Label as TagIcon,
  Sort as SortIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { Task } from '../../stores/tasksSlice';

// Template interface - extends Task with template-specific fields
export interface TaskTemplate extends Omit<Task, 'id' | 'createdAt' | 'updatedAt'> {
  id: string;
  name: string;
  description: string;
  category: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const defaultTemplate: Omit<TaskTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  title: '',
  description: '',
  status: 'not_started',
  priority: 'medium',
  category: 'general',
  parentId: null,
  tags: [],
  isFavorite: false,
  usageCount: 0
};

const TemplateLibrary: React.FC = () => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editedTemplate, setEditedTemplate] = useState<TaskTemplate | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  
  const { projects, groups } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // Load templates from localStorage on mount
  useEffect(() => {
    const storedTemplates = localStorage.getItem('taskTemplates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
      // Initialize with some sample templates if none exist
      const sampleTemplates = getSampleTemplates();
      setTemplates(sampleTemplates);
      localStorage.setItem('taskTemplates', JSON.stringify(sampleTemplates));
    }
  }, []);
  
  // Save templates to localStorage whenever they change
  useEffect(() => {
    if (templates.length > 0) {
      localStorage.setItem('taskTemplates', JSON.stringify(templates));
    }
  }, [templates]);
  
  const handleCreateTemplate = () => {
    const newTemplate: TaskTemplate = {
      ...defaultTemplate,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setEditedTemplate(newTemplate);
    setEditMode(false);
    setCreateDialogOpen(true);
  };
  
  const handleEditTemplate = (template: TaskTemplate) => {
    setEditedTemplate({ ...template });
    setEditMode(true);
    setCreateDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setEditedTemplate(null);
  };
  
  const handleSaveTemplate = () => {
    if (!editedTemplate) return;
    
    if (editMode) {
      // Update existing template
      setTemplates(prevTemplates => 
        prevTemplates.map(t => 
          t.id === editedTemplate.id 
            ? { ...editedTemplate, updatedAt: new Date() } 
            : t
        )
      );
    } else {
      // Add new template
      setTemplates(prevTemplates => [...prevTemplates, editedTemplate]);
    }
    
    handleCloseDialog();
  };
  
  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }
  };
  
  const handleCloneTemplate = (template: TaskTemplate) => {
    const clonedTemplate: TaskTemplate = {
      ...template,
      id: Date.now().toString(),
      name: `${template.name} (Copy)`,
      isFavorite: false,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTemplates(prevTemplates => [...prevTemplates, clonedTemplate]);
  };
  
  const handleToggleFavorite = (template: TaskTemplate) => {
    setTemplates(prevTemplates => 
      prevTemplates.map(t => 
        t.id === template.id 
          ? { ...t, isFavorite: !t.isFavorite } 
          : t
      )
    );
  };
  
  const handleCreateTaskFromTemplate = (template: TaskTemplate) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: template.title,
      description: template.description,
      status: template.status,
      priority: template.priority,
      parentId: template.parentId,
      tags: [...template.tags],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // In a real implementation, would dispatch to Redux store
    // dispatch(addTask(newTask));
    
    // Update usage count for the template
    setTemplates(prevTemplates => 
      prevTemplates.map(t => 
        t.id === template.id 
          ? { ...t, usageCount: t.usageCount + 1, updatedAt: new Date() } 
          : t
      )
    );
    
    // Show a success message or redirect to the new task
    console.log('Task created from template:', newTask);
    alert(`Task "${newTask.title}" created successfully!`);
  };
  
  const handleSelectTemplate = (template: TaskTemplate) => {
    setSelectedTemplate(template);
  };
  
  const handleTemplateInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (editedTemplate && name) {
      setEditedTemplate({
        ...editedTemplate,
        [name]: value
      });
    }
  };
  
  const handlePriorityChange = (event: SelectChangeEvent) => {
    if (editedTemplate) {
      setEditedTemplate({
        ...editedTemplate,
        priority: event.target.value as 'high' | 'medium' | 'low'
      });
    }
  };
  
  const handleCategoryChange = (event: SelectChangeEvent) => {
    if (editedTemplate) {
      setEditedTemplate({
        ...editedTemplate,
        category: event.target.value
      });
    }
  };
  
  const handleSortChange = (event: SelectChangeEvent) => {
    setSortBy(event.target.value);
  };
  
  const handleCategoryFilterChange = (event: SelectChangeEvent) => {
    setCategoryFilter(event.target.value);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };
  
  const handleToggleFavoritesFilter = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };
  
  // Filter and sort templates
  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = searchText === '' || 
        template.name.toLowerCase().includes(searchText.toLowerCase()) ||
        template.description.toLowerCase().includes(searchText.toLowerCase());
        
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      
      const matchesFavorites = !showFavoritesOnly || template.isFavorite;
      
      return matchesSearch && matchesCategory && matchesFavorites;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'most_used':
          return b.usageCount - a.usageCount;
        default:
          return 0;
      }
    });
  
  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(templates.map(t => t.category)));
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Task Templates
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary">
          Create and manage reusable task templates to streamline your workflow.
        </Typography>
      </Box>
      
      {/* Search and filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Search Templates"
              variant="outlined"
              size="small"
              fullWidth
              value={searchText}
              onChange={handleSearchChange}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                id="category-filter"
                value={categoryFilter}
                label="Category"
                onChange={handleCategoryFilterChange}
              >
                <MenuItem value="all">All Categories</MenuItem>
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="sort-by-label">Sort By</InputLabel>
              <Select
                labelId="sort-by-label"
                id="sort-by"
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="oldest">Oldest</MenuItem>
                <MenuItem value="most_used">Most Used</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showFavoritesOnly}
                  onChange={handleToggleFavoritesFilter}
                  icon={<FavoriteBorderIcon />}
                  checkedIcon={<FavoriteIcon />}
                />
              }
              label="Favorites"
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Template Library ({filteredTemplates.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTemplate}
            >
              Create Template
            </Button>
          </Box>
          
          {filteredTemplates.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No templates match the current filters.
              </Typography>
            </Paper>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {filteredTemplates.map(template => (
                <Paper 
                  key={template.id} 
                  elevation={selectedTemplate?.id === template.id ? 3 : 1}
                  sx={{ 
                    mb: 2, 
                    border: selectedTemplate?.id === template.id ? 2 : 0,
                    borderColor: 'primary.main',
                    transition: 'all 0.2s'
                  }}
                >
                  <ListItem 
                    button 
                    onClick={() => handleSelectTemplate(template)}
                    sx={{ borderLeft: 4, borderColor: 
                      template.priority === 'high' ? 'error.main' : 
                      template.priority === 'medium' ? 'warning.main' : 
                      'success.main'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {template.name}
                          {template.isFavorite && (
                            <FavoriteIcon 
                              fontSize="small" 
                              color="error" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" noWrap>
                            {template.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            <Chip 
                              label={template.category} 
                              size="small" 
                              sx={{ height: 20 }}
                            />
                            {template.tags && template.tags.map(tag => (
                              <Chip 
                                key={tag} 
                                label={tag} 
                                size="small"
                                sx={{ height: 20 }}
                              />
                            ))}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              Used {template.usageCount} times
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleToggleFavorite(template)}
                        sx={{ mr: 1 }}
                      >
                        {template.isFavorite ? 
                          <FavoriteIcon color="error" /> : 
                          <FavoriteBorderIcon />
                        }
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleCloneTemplate(template)}
                        sx={{ mr: 1 }}
                      >
                        <CloneIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleEditTemplate(template)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Grid>
        
        <Grid item xs={12} md={5}>
          {selectedTemplate ? (
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6">
                    {selectedTemplate.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created: {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleCreateTaskFromTemplate(selectedTemplate)}
                >
                  Use Template
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Task Title
                </Typography>
                <Typography variant="body1">
                  {selectedTemplate.title}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">
                  {selectedTemplate.description || 'No description provided.'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Priority:</strong> {selectedTemplate.priority}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Status:</strong> {selectedTemplate.status.replace('_', ' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Category:</strong> {selectedTemplate.category}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Used:</strong> {selectedTemplate.usageCount} times
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedTemplate.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditTemplate(selectedTemplate)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CloneIcon />}
                  onClick={() => handleCloneTemplate(selectedTemplate)}
                >
                  Clone
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ 
              p: 3, 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Template Selected
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select a template from the library to view details
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleCreateTemplate}
              >
                Create New Template
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* Create/Edit Template Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          {editedTemplate && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Template Name"
                  fullWidth
                  value={editedTemplate.name}
                  onChange={handleTemplateInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="title"
                  label="Task Title"
                  fullWidth
                  value={editedTemplate.title}
                  onChange={handleTemplateInputChange}
                  required
                  helperText="This will be the title of tasks created from this template"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="description"
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={editedTemplate.description}
                  onChange={handleTemplateInputChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="template-priority-label">Priority</InputLabel>
                  <Select
                    labelId="template-priority-label"
                    id="template-priority"
                    value={editedTemplate.priority}
                    label="Priority"
                    onChange={handlePriorityChange}
                  >
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="template-category-label">Category</InputLabel>
                  <Select
                    labelId="template-category-label"
                    id="template-category"
                    value={editedTemplate.category}
                    label="Category"
                    onChange={handleCategoryChange}
                  >
                    <MenuItem value="general">General</MenuItem>
                    <MenuItem value="work">Work</MenuItem>
                    <MenuItem value="personal">Personal</MenuItem>
                    <MenuItem value="project">Project</MenuItem>
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="followup">Follow-up</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editedTemplate.isFavorite}
                      onChange={(e) => setEditedTemplate({
                        ...editedTemplate,
                        isFavorite: e.target.checked
                      })}
                      name="isFavorite"
                    />
                  }
                  label="Mark as Favorite"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained"
            disabled={!editedTemplate?.name || !editedTemplate?.title}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Sample templates for initial setup
const getSampleTemplates = (): TaskTemplate[] => [
  {
    id: '1',
    name: 'Meeting Notes',
    title: 'Meeting: [Meeting Title]',
    description: 'Notes and action items from the meeting',
    status: 'not_started',
    priority: 'medium',
    category: 'meeting',
    parentId: null,
    tags: ['meeting', 'notes'],
    isFavorite: true,
    usageCount: 15,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: '2',
    name: 'Bug Fix',
    title: 'Fix: [Bug Description]',
    description: 'Track and fix a software bug',
    status: 'not_started',
    priority: 'high',
    category: 'work',
    parentId: null,
    tags: ['bug', 'development'],
    isFavorite: false,
    usageCount: 8,
    createdAt: new Date('2023-02-20'),
    updatedAt: new Date('2023-02-20')
  },
  {
    id: '3',
    name: 'Weekly Review',
    title: 'Weekly Review: Week of [Date]',
    description: 'Review progress and plan for next week',
    status: 'not_started',
    priority: 'medium',
    category: 'personal',
    parentId: null,
    tags: ['review', 'planning'],
    isFavorite: true,
    usageCount: 25,
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2023-03-10')
  },
  {
    id: '4',
    name: 'Follow-up Email',
    title: 'Follow up with [Name] regarding [Topic]',
    description: 'Send a follow-up email about the discussion',
    status: 'not_started',
    priority: 'low',
    category: 'followup',
    parentId: null,
    tags: ['email', 'communication'],
    isFavorite: false,
    usageCount: 12,
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2023-04-05')
  },
  {
    id: '5',
    name: 'Project Milestone',
    title: '[Project Name]: [Milestone Description]',
    description: 'Track progress towards a project milestone',
    status: 'not_started',
    priority: 'high',
    category: 'project',
    parentId: null,
    tags: ['project', 'milestone'],
    isFavorite: false,
    usageCount: 5,
    createdAt: new Date('2023-05-12'),
    updatedAt: new Date('2023-05-12')
  }
];

export default TemplateLibrary; 