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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LinkOff as UnlinkIcon,
  Flag as GoalIcon,
  CheckCircle as CompletedIcon,
  Link as LinkIcon,
  BarChart as ChartIcon,
  EmojiEvents as AchievementIcon,
  Assignment as TaskIcon,
  MoreVert as MoreIcon,
  Visibility as ViewIcon,
  Category as CategoryIcon,
  CalendarToday as CalendarIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';

// Define interfaces
interface Goal {
  id: string;
  title: string;
  description: string;
  deadline?: string;
  category: string;
  progress: number;
  status: 'active' | 'completed' | 'archived';
  linkedTaskIds: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  color?: string;
}

interface GoalCategory {
  id: string;
  name: string;
  color: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// TabPanel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`goals-tabpanel-${index}`}
      aria-labelledby={`goals-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

// Main component
const GoalTracker: React.FC = () => {
  // State for goals and categories
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<GoalCategory[]>([
    { id: 'personal', name: 'Personal', color: '#3f51b5' },
    { id: 'work', name: 'Work', color: '#f44336' },
    { id: 'education', name: 'Education', color: '#4caf50' },
    { id: 'health', name: 'Health', color: '#ff9800' },
    { id: 'finance', name: 'Finance', color: '#9c27b0' }
  ]);
  
  // State for active tab
  const [activeTab, setActiveTab] = useState(0);
  
  // State for dialogs
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkTasksDialogOpen, setLinkTasksDialogOpen] = useState(false);
  
  // State for editing
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingCategory, setEditingCategory] = useState<GoalCategory | null>(null);
  
  // Form state
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('');
  const [newGoalColor, setNewGoalColor] = useState('');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3f51b5');
  
  // Menu state
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [contextGoal, setContextGoal] = useState<Goal | null>(null);
  
  // Selection state for linking tasks
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  
  // Redux state
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const dispatch = useDispatch();
  
  // Load goals and categories from localStorage on mount
  useEffect(() => {
    try {
      const savedGoals = localStorage.getItem('goals');
      if (savedGoals) {
        setGoals(JSON.parse(savedGoals));
      }
      
      const savedCategories = localStorage.getItem('goalCategories');
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error('Error loading goals or categories:', error);
    }
  }, []);
  
  // Save goals to localStorage when they change
  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);
  
  // Save categories to localStorage when they change
  useEffect(() => {
    localStorage.setItem('goalCategories', JSON.stringify(categories));
  }, [categories]);
  
  // Update goal progress based on linked tasks
  useEffect(() => {
    if (tasks.length === 0 || goals.length === 0) return;
    
    const updatedGoals = goals.map(goal => {
      if (goal.linkedTaskIds.length === 0) return goal;
      
      const linkedTasks = tasks.filter(task => goal.linkedTaskIds.includes(task.id));
      if (linkedTasks.length === 0) return goal;
      
      const completedTasks = linkedTasks.filter(task => task.status === 'completed');
      const progress = Math.round((completedTasks.length / linkedTasks.length) * 100);
      
      const updatedGoal = { ...goal, progress };
      
      // Check if the goal should be marked as completed
      if (progress === 100 && goal.status === 'active') {
        updatedGoal.status = 'completed';
        updatedGoal.completedAt = new Date().toISOString();
      }
      
      return updatedGoal;
    });
    
    setGoals(updatedGoals);
  }, [tasks]);
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle opening goal dialog for adding
  const handleOpenAddGoalDialog = () => {
    setEditingGoal(null);
    setNewGoalTitle('');
    setNewGoalDescription('');
    setNewGoalDeadline('');
    setNewGoalCategory(categories[0]?.id || '');
    setNewGoalColor('');
    setGoalDialogOpen(true);
  };
  
  // Handle opening goal dialog for editing
  const handleOpenEditGoalDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setNewGoalTitle(goal.title);
    setNewGoalDescription(goal.description);
    setNewGoalDeadline(goal.deadline || '');
    setNewGoalCategory(goal.category);
    setNewGoalColor(goal.color || '');
    setGoalDialogOpen(true);
    handleCloseMenu();
  };
  
  // Handle opening category dialog for adding
  const handleOpenAddCategoryDialog = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#3f51b5');
    setCategoryDialogOpen(true);
  };
  
  // Handle opening category dialog for editing
  const handleOpenEditCategoryDialog = (category: GoalCategory) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setCategoryDialogOpen(true);
  };
  
  // Handle opening delete confirmation dialog
  const handleOpenDeleteDialog = (goal: Goal) => {
    setContextGoal(goal);
    setDeleteDialogOpen(true);
    handleCloseMenu();
  };
  
  // Handle opening link tasks dialog
  const handleOpenLinkTasksDialog = (goal: Goal) => {
    setContextGoal(goal);
    setSelectedTaskIds([...goal.linkedTaskIds]);
    setLinkTasksDialogOpen(true);
    handleCloseMenu();
  };
  
  // Handle saving a goal (add or update)
  const handleSaveGoal = () => {
    if (!newGoalTitle.trim()) {
      showSnackbar('Goal title is required', 'error');
      return;
    }
    
    if (!newGoalCategory) {
      showSnackbar('Please select a category', 'error');
      return;
    }
    
    const now = new Date().toISOString();
    
    if (editingGoal) {
      // Update existing goal
      const updatedGoals = goals.map(goal => {
        if (goal.id === editingGoal.id) {
          return {
            ...goal,
            title: newGoalTitle,
            description: newGoalDescription,
            deadline: newGoalDeadline || undefined,
            category: newGoalCategory,
            color: newGoalColor || undefined,
            updatedAt: now
          };
        }
        return goal;
      });
      
      setGoals(updatedGoals);
      showSnackbar('Goal updated successfully', 'success');
    } else {
      // Add new goal
      const newGoal: Goal = {
        id: `goal-${Date.now()}`,
        title: newGoalTitle,
        description: newGoalDescription,
        deadline: newGoalDeadline || undefined,
        category: newGoalCategory,
        progress: 0,
        status: 'active',
        linkedTaskIds: [],
        color: newGoalColor || undefined,
        createdAt: now,
        updatedAt: now
      };
      
      setGoals([...goals, newGoal]);
      showSnackbar('Goal added successfully', 'success');
    }
    
    setGoalDialogOpen(false);
  };
  
  // Handle saving a category (add or update)
  const handleSaveCategory = () => {
    if (!newCategoryName.trim()) {
      showSnackbar('Category name is required', 'error');
      return;
    }
    
    if (editingCategory) {
      // Update existing category
      const updatedCategories = categories.map(category => {
        if (category.id === editingCategory.id) {
          return {
            ...category,
            name: newCategoryName,
            color: newCategoryColor
          };
        }
        return category;
      });
      
      setCategories(updatedCategories);
      showSnackbar('Category updated successfully', 'success');
    } else {
      // Add new category
      const newCategory: GoalCategory = {
        id: `category-${Date.now()}`,
        name: newCategoryName,
        color: newCategoryColor
      };
      
      setCategories([...categories, newCategory]);
      showSnackbar('Category added successfully', 'success');
    }
    
    setCategoryDialogOpen(false);
  };
  
  // Handle deleting a goal
  const handleDeleteGoal = () => {
    if (!contextGoal) return;
    
    const updatedGoals = goals.filter(goal => goal.id !== contextGoal.id);
    setGoals(updatedGoals);
    
    setDeleteDialogOpen(false);
    showSnackbar('Goal deleted successfully', 'success');
  };
  
  // Handle saving linked tasks
  const handleSaveLinkedTasks = () => {
    if (!contextGoal) return;
    
    const updatedGoals = goals.map(goal => {
      if (goal.id === contextGoal.id) {
        return {
          ...goal,
          linkedTaskIds: selectedTaskIds,
          updatedAt: new Date().toISOString()
        };
      }
      return goal;
    });
    
    setGoals(updatedGoals);
    setLinkTasksDialogOpen(false);
    showSnackbar('Linked tasks updated successfully', 'success');
  };
  
  // Handle toggling a task selection for linking
  const handleToggleTaskSelection = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };
  
  // Handle toggling goal status
  const handleToggleGoalStatus = (goal: Goal) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goal.id) {
        const newStatus = g.status === 'active' ? 'completed' : 'active';
        return {
          ...g,
          status: newStatus,
          completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return g;
    });
    
    setGoals(updatedGoals);
    showSnackbar(`Goal marked as ${goal.status === 'active' ? 'completed' : 'active'}`, 'success');
    handleCloseMenu();
  };
  
  // Handle archiving a goal
  const handleArchiveGoal = (goal: Goal) => {
    const updatedGoals = goals.map(g => {
      if (g.id === goal.id) {
        return {
          ...g,
          status: 'archived',
          updatedAt: new Date().toISOString()
        };
      }
      return g;
    });
    
    setGoals(updatedGoals);
    showSnackbar('Goal archived', 'success');
    handleCloseMenu();
  };
  
  // Menu handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, goal: Goal) => {
    setMenuAnchorEl(event.currentTarget);
    setContextGoal(goal);
  };
  
  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };
  
  // Snackbar handlers
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  
  // Filter goals based on active tab
  const getFilteredGoals = () => {
    switch (activeTab) {
      case 0: // Active goals
        return goals.filter(goal => goal.status === 'active');
      case 1: // Completed goals
        return goals.filter(goal => goal.status === 'completed');
      case 2: // Archived goals
        return goals.filter(goal => goal.status === 'archived');
      case 3: // All goals
        return goals;
      default:
        return goals.filter(goal => goal.status === 'active');
    }
  };
  
  // Get category by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || null;
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Check if a deadline is coming soon (within 7 days)
  const isDeadlineSoon = (dateString?: string) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };
  
  // Check if a deadline is overdue
  const isDeadlineOverdue = (dateString?: string) => {
    if (!dateString) return false;
    const deadline = new Date(dateString);
    const now = new Date();
    return deadline < now;
  };
  
  // Render goal cards
  const renderGoalCards = () => {
    const filteredGoals = getFilteredGoals();
    
    if (filteredGoals.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No goals found. Click the "Add Goal" button to create one.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {filteredGoals.map(goal => {
          const category = getCategoryById(goal.category);
          const linkedTaskCount = goal.linkedTaskIds.length;
          
          return (
            <Grid item xs={12} md={6} lg={4} key={goal.id}>
              <Card 
                sx={{ 
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: '4px solid',
                  borderColor: goal.color || category?.color || 'primary.main'
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ wordBreak: 'break-word' }}>
                      {goal.title}
                    </Typography>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleOpenMenu(e, goal)}
                      aria-label="goal options"
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {category && (
                      <Chip 
                        size="small" 
                        label={category.name}
                        sx={{ 
                          bgcolor: category.color, 
                          color: 'white',
                          mr: 1
                        }}
                      />
                    )}
                    
                    {goal.status === 'completed' && (
                      <Chip 
                        size="small"
                        icon={<CompletedIcon />}
                        label="Completed"
                        color="success"
                      />
                    )}
                    
                    {goal.status === 'archived' && (
                      <Chip 
                        size="small"
                        label="Archived"
                        color="default"
                      />
                    )}
                  </Box>
                  
                  {goal.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {goal.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 1 }} />
                      Deadline: {' '}
                      <span style={{ 
                        color: isDeadlineOverdue(goal.deadline) ? 'red' : 
                               isDeadlineSoon(goal.deadline) ? 'orange' : 
                               'inherit'
                      }}>
                        {formatDate(goal.deadline)}
                      </span>
                    </Typography>
                    
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                      <TaskIcon fontSize="small" sx={{ mr: 1 }} />
                      {linkedTaskCount} linked {linkedTaskCount === 1 ? 'task' : 'tasks'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Progress:</span>
                      <span>{goal.progress}%</span>
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={goal.progress} 
                      color={goal.progress === 100 ? "success" : "primary"}
                      sx={{ mt: 1, height: 8, borderRadius: 1 }}
                    />
                  </Box>
                </CardContent>
                
                <CardActions sx={{ pt: 0 }}>
                  <Button 
                    size="small" 
                    startIcon={<EditIcon />} 
                    onClick={() => handleOpenEditGoalDialog(goal)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<LinkIcon />} 
                    onClick={() => handleOpenLinkTasksDialog(goal)}
                  >
                    Link Tasks
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    );
  };
  
  // Render Goal dialog
  const renderGoalDialog = () => (
    <Dialog 
      open={goalDialogOpen} 
      onClose={() => setGoalDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {editingGoal ? 'Edit Goal' : 'Add New Goal'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Goal Title"
          fullWidth
          value={newGoalTitle}
          onChange={(e) => setNewGoalTitle(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={newGoalDescription}
          onChange={(e) => setNewGoalDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        
        <TextField
          margin="dense"
          label="Deadline"
          type="date"
          fullWidth
          value={newGoalDeadline}
          onChange={(e) => setNewGoalDeadline(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={newGoalCategory}
            onChange={(e) => setNewGoalCategory(e.target.value)}
            label="Category"
          >
            {categories.map(category => (
              <MenuItem key={category.id} value={category.id}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: 16, 
                      height: 16, 
                      borderRadius: '50%', 
                      bgcolor: category.color,
                      mr: 1 
                    }} 
                  />
                  {category.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <TextField
          margin="dense"
          label="Color (optional)"
          type="color"
          fullWidth
          value={newGoalColor}
          onChange={(e) => setNewGoalColor(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleSaveGoal}
          variant="contained"
        >
          {editingGoal ? 'Save Changes' : 'Add Goal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Render Category dialog
  const renderCategoryDialog = () => (
    <Dialog 
      open={categoryDialogOpen} 
      onClose={() => setCategoryDialogOpen(false)}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle>
        {editingCategory ? 'Edit Category' : 'Add New Category'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Category Name"
          fullWidth
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            margin="dense"
            label="Color"
            type="color"
            value={newCategoryColor}
            onChange={(e) => setNewCategoryColor(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ flexGrow: 1 }}
          />
          <Box 
            sx={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              bgcolor: newCategoryColor,
              ml: 2 
            }} 
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleSaveCategory}
          variant="contained"
        >
          {editingCategory ? 'Save Changes' : 'Add Category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Render Delete confirmation dialog
  const renderDeleteDialog = () => (
    <Dialog 
      open={deleteDialogOpen} 
      onClose={() => setDeleteDialogOpen(false)}
    >
      <DialogTitle>Delete Goal</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the goal "{contextGoal?.title}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleDeleteGoal}
          color="error"
          variant="contained"
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Render Link Tasks dialog
  const renderLinkTasksDialog = () => (
    <Dialog 
      open={linkTasksDialogOpen} 
      onClose={() => setLinkTasksDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Link Tasks to Goal</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" gutterBottom>
          Select tasks to link to "{contextGoal?.title}"
        </Typography>
        
        {tasks.length === 0 ? (
          <Typography color="text.secondary">
            No tasks available. Create some tasks first.
          </Typography>
        ) : (
          <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {tasks.map(task => (
              <ListItem
                key={task.id}
                button
                onClick={() => handleToggleTaskSelection(task.id)}
              >
                <ListItemIcon>
                  <Checkbox checked={selectedTaskIds.includes(task.id)} />
                </ListItemIcon>
                <ListItemText
                  primary={task.title}
                  secondary={
                    <Typography variant="body2" component="span">
                      Status: {task.status} | Priority: {task.priority}
                      {task.dueDate && ` | Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setLinkTasksDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={handleSaveLinkedTasks}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Custom checkbox component with proper types
  const Checkbox = ({ checked }: { checked: boolean }) => (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        width: 20,
        height: 20,
        borderRadius: 1,
        border: '1px solid',
        borderColor: checked ? 'primary.main' : 'grey.400',
        bgcolor: checked ? 'primary.main' : 'transparent',
        position: 'relative',
        '&::after': checked ? {
          content: '""',
          position: 'absolute',
          width: 5,
          height: 10,
          border: '2px solid white',
          borderWidth: '0 2px 2px 0',
          top: 3,
          left: 7,
          transform: 'rotate(45deg)'
        } : {}
      }}
    />
  );
  
  // Render goal context menu
  const renderGoalMenu = () => (
    <Menu
      anchorEl={menuAnchorEl}
      open={Boolean(menuAnchorEl)}
      onClose={handleCloseMenu}
    >
      <MenuItem onClick={() => contextGoal && handleOpenEditGoalDialog(contextGoal)}>
        <ListItemIcon>
          <EditIcon fontSize="small" />
        </ListItemIcon>
        Edit Goal
      </MenuItem>
      
      <MenuItem onClick={() => contextGoal && handleToggleGoalStatus(contextGoal)}>
        <ListItemIcon>
          {contextGoal?.status === 'active' ? (
            <CompletedIcon fontSize="small" />
          ) : (
            <GoalIcon fontSize="small" />
          )}
        </ListItemIcon>
        {contextGoal?.status === 'active' ? 'Mark as Completed' : 'Mark as Active'}
      </MenuItem>
      
      <MenuItem onClick={() => contextGoal && handleOpenLinkTasksDialog(contextGoal)}>
        <ListItemIcon>
          <LinkIcon fontSize="small" />
        </ListItemIcon>
        Link Tasks
      </MenuItem>
      
      {contextGoal?.status !== 'archived' && (
        <MenuItem onClick={() => contextGoal && handleArchiveGoal(contextGoal)}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          Archive Goal
        </MenuItem>
      )}
      
      <Divider />
      
      <MenuItem onClick={() => contextGoal && handleOpenDeleteDialog(contextGoal)}>
        <ListItemIcon>
          <DeleteIcon fontSize="small" color="error" />
        </ListItemIcon>
        <Typography color="error">Delete Goal</Typography>
      </MenuItem>
    </Menu>
  );
  
  // Render categories section
  const renderCategories = () => (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Categories</Typography>
        <Button
          startIcon={<AddIcon />}
          size="small"
          onClick={handleOpenAddCategoryDialog}
        >
          Add Category
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {categories.map(category => (
          <Chip 
            key={category.id}
            label={category.name}
            sx={{ 
              bgcolor: category.color, 
              color: 'white',
              '&:hover': { opacity: 0.9 }
            }}
            onClick={() => handleOpenEditCategoryDialog(category)}
          />
        ))}
      </Box>
    </Paper>
  );
  
  // Main render method
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Goal Tracker
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddGoalDialog}
        >
          Add Goal
        </Button>
      </Box>
      
      {/* Categories section */}
      {renderCategories()}
      
      {/* Tabs for filtering goals */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          aria-label="goal tabs"
        >
          <Tab label="Active" icon={<GoalIcon />} iconPosition="start" />
          <Tab label="Completed" icon={<CompletedIcon />} iconPosition="start" />
          <Tab label="Archived" icon={<ArchiveIcon />} iconPosition="start" />
          <Tab label="All Goals" icon={<ViewIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Goal cards */}
      <TabPanel value={activeTab} index={0}>
        {renderGoalCards()}
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        {renderGoalCards()}
      </TabPanel>
      <TabPanel value={activeTab} index={2}>
        {renderGoalCards()}
      </TabPanel>
      <TabPanel value={activeTab} index={3}>
        {renderGoalCards()}
      </TabPanel>
      
      {/* Dialogs */}
      {renderGoalDialog()}
      {renderCategoryDialog()}
      {renderDeleteDialog()}
      {renderLinkTasksDialog()}
      {renderGoalMenu()}
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GoalTracker; 