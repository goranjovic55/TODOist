import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Alert,
  Stack,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  ViewKanban as KanbanIcon,
  DragIndicator as DragIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Today as TodayIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

// Mock interfaces for column types and KanbanItem
interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
  limit?: number;
  color?: string;
}

interface KanbanItem {
  id: string;
  taskId: string;
  columnId: string;
  order: number;
}

// Mock initial columns - in a real app, this would be in the Redux store
const initialColumns: KanbanColumn[] = [
  {
    id: 'col-1',
    title: 'To Do',
    taskIds: [],
    color: '#e0e0e0'
  },
  {
    id: 'col-2',
    title: 'In Progress',
    taskIds: [],
    limit: 5, // WIP Limit
    color: '#bbdefb'
  },
  {
    id: 'col-3',
    title: 'Review',
    taskIds: [],
    color: '#fff9c4'
  },
  {
    id: 'col-4',
    title: 'Done',
    taskIds: [],
    color: '#c8e6c9'
  }
];

const TaskKanbanBoard: React.FC = () => {
  const { tasks } = useSelector((state: RootState) => state.tasks);
  const dispatch = useDispatch();
  
  // State for columns
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [columnMenuAnchorEl, setColumnMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  
  // State for column editing
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null);
  const [columnFormData, setColumnFormData] = useState({
    title: '',
    color: '#e0e0e0',
    limit: 0
  });
  
  // State for task filtering
  const [filterMenuAnchorEl, setFilterMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState({
    assignee: null,
    priority: null,
    dueDate: null
  });
  
  // State for task information dialog
  const [taskInfoDialogOpen, setTaskInfoDialogOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Organize tasks into columns on component mount
  useEffect(() => {
    // Clear all column task IDs
    const updatedColumns = columns.map(col => ({ ...col, taskIds: [] }));
    
    // Distribute tasks to columns based on status
    tasks.forEach(task => {
      const status = task.status;
      
      // Map status to column
      let columnId: string;
      switch (status) {
        case 'not_started':
          columnId = 'col-1'; // To Do
          break;
        case 'in_progress':
          columnId = 'col-2'; // In Progress
          break;
        case 'blocked':
          columnId = 'col-3'; // Review
          break;
        case 'completed':
          columnId = 'col-4'; // Done
          break;
        default:
          columnId = 'col-1'; // Default to To Do
      }
      
      // Find the column and add the task ID
      const columnIndex = updatedColumns.findIndex(col => col.id === columnId);
      if (columnIndex !== -1) {
        updatedColumns[columnIndex].taskIds.push(task.id);
      }
    });
    
    setColumns(updatedColumns);
  }, [tasks]);
  
  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      let passesFilter = true;
      
      if (filters.assignee && task.assignedTo !== filters.assignee) {
        passesFilter = false;
      }
      
      if (filters.priority && task.priority !== filters.priority) {
        passesFilter = false;
      }
      
      if (filters.dueDate && task.endDate) {
        const dueDate = new Date(task.endDate);
        if (filters.dueDate === 'today' && !isToday(dueDate)) {
          passesFilter = false;
        } else if (filters.dueDate === 'tomorrow' && !isTomorrow(dueDate)) {
          passesFilter = false;
        } else if (filters.dueDate === 'overdue' && !(isPast(dueDate) && !isToday(dueDate))) {
          passesFilter = false;
        }
      }
      
      return passesFilter;
    });
  }, [tasks, filters]);
  
  // Count filtered tasks in each column
  const columnTaskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    columns.forEach(column => {
      counts[column.id] = column.taskIds.filter(taskId => 
        filteredTasks.some(task => task.id === taskId)
      ).length;
    });
    
    return counts;
  }, [columns, filteredTasks]);
  
  // Handle column menu open
  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLElement>, columnId: string) => {
    setColumnMenuAnchorEl(event.currentTarget);
    setActiveColumnId(columnId);
  };
  
  // Handle column menu close
  const handleColumnMenuClose = () => {
    setColumnMenuAnchorEl(null);
    setActiveColumnId(null);
  };
  
  // Handle add column
  const handleAddColumn = () => {
    setEditingColumn(null);
    setColumnFormData({
      title: '',
      color: '#e0e0e0',
      limit: 0
    });
    setColumnDialogOpen(true);
  };
  
  // Handle edit column
  const handleEditColumn = () => {
    if (!activeColumnId) return;
    
    const column = columns.find(col => col.id === activeColumnId);
    if (column) {
      setEditingColumn(column);
      setColumnFormData({
        title: column.title,
        color: column.color || '#e0e0e0',
        limit: column.limit || 0
      });
      setColumnDialogOpen(true);
    }
    
    handleColumnMenuClose();
  };
  
  // Handle delete column
  const handleDeleteColumn = () => {
    if (!activeColumnId) return;
    
    // Don't delete if it's the last column
    if (columns.length <= 1) {
      handleColumnMenuClose();
      return;
    }
    
    // Find column to delete
    const columnIndex = columns.findIndex(col => col.id === activeColumnId);
    if (columnIndex === -1) {
      handleColumnMenuClose();
      return;
    }
    
    // Get tasks from the column being deleted
    const tasksToMove = columns[columnIndex].taskIds;
    
    // Find next available column (prefer the one to the left)
    const nextColumnIndex = columnIndex > 0 ? columnIndex - 1 : columnIndex + 1;
    
    // Create updated columns array
    const updatedColumns = [...columns];
    
    // Move tasks to the next column
    updatedColumns[nextColumnIndex].taskIds.push(...tasksToMove);
    
    // Remove the deleted column
    updatedColumns.splice(columnIndex, 1);
    
    // Update state
    setColumns(updatedColumns);
    handleColumnMenuClose();
  };
  
  // Handle save column
  const handleSaveColumn = () => {
    if (columnFormData.title.trim() === '') {
      // Don't save if title is empty
      return;
    }
    
    if (editingColumn) {
      // Update existing column
      const updatedColumns = columns.map(col => 
        col.id === editingColumn.id
          ? {
              ...col,
              title: columnFormData.title,
              color: columnFormData.color,
              limit: columnFormData.limit > 0 ? columnFormData.limit : undefined
            }
          : col
      );
      setColumns(updatedColumns);
    } else {
      // Add new column
      const newColumn: KanbanColumn = {
        id: `col-${Date.now()}`,
        title: columnFormData.title,
        taskIds: [],
        color: columnFormData.color,
        limit: columnFormData.limit > 0 ? columnFormData.limit : undefined
      };
      
      setColumns([...columns, newColumn]);
    }
    
    setColumnDialogOpen(false);
  };
  
  // Handle filter menu open
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchorEl(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterMenuAnchorEl(null);
  };
  
  // Handle filter selection
  const handleFilterSelect = (filterType: string, value: string | null) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
    handleFilterMenuClose();
  };
  
  // Handle clear all filters
  const handleClearFilters = () => {
    setFilters({
      assignee: null,
      priority: null,
      dueDate: null
    });
    
    handleFilterMenuClose();
  };
  
  // Handle drag end
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId } = result;
    
    // Return if dropped outside a droppable area or dropped in the same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Find source and destination columns
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);
    
    if (!sourceColumn || !destColumn) return;
    
    // Check if destination column has a WIP limit and if it's already reached
    if (destColumn.limit && 
        destColumn.taskIds.length >= destColumn.limit && 
        sourceColumn.id !== destColumn.id) {
      // WIP limit reached, don't allow the move
      return;
    }
    
    // Create updated columns
    const updatedColumns = [...columns];
    
    // Find the source and destination column indexes
    const sourceColIndex = updatedColumns.findIndex(col => col.id === sourceColumn.id);
    const destColIndex = updatedColumns.findIndex(col => col.id === destColumn.id);
    
    // Create new taskIds arrays
    const sourceTaskIds = [...sourceColumn.taskIds];
    const destTaskIds = sourceColumn.id === destColumn.id 
      ? sourceTaskIds 
      : [...destColumn.taskIds];
    
    // Remove task from source
    const [taskId] = sourceTaskIds.splice(source.index, 1);
    
    // Add task to destination
    destTaskIds.splice(destination.index, 0, taskId);
    
    // Update columns
    if (sourceColumn.id === destColumn.id) {
      updatedColumns[sourceColIndex].taskIds = destTaskIds;
    } else {
      updatedColumns[sourceColIndex].taskIds = sourceTaskIds;
      updatedColumns[destColIndex].taskIds = destTaskIds;
      
      // Update task status based on column (in a real app, dispatch an action to update task status)
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        let newStatus;
        
        // Map column to status
        switch (destColumn.id) {
          case 'col-1': // To Do
            newStatus = 'not_started';
            break;
          case 'col-2': // In Progress
            newStatus = 'in_progress';
            break;
          case 'col-3': // Review
            newStatus = 'blocked';
            break;
          case 'col-4': // Done
            newStatus = 'completed';
            break;
          default:
            newStatus = task.status;
        }
        
        // In a real app, dispatch an action to update the task status
        console.log(`Task ${taskId} status updated to ${newStatus}`);
      }
    }
    
    setColumns(updatedColumns);
  };
  
  // Handle opening task info dialog
  const handleOpenTaskInfo = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskInfoDialogOpen(true);
  };
  
  // Get task by ID
  const getTaskById = (taskId: string) => {
    return tasks.find(task => task.id === taskId);
  };
  
  // Get task priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  
  // Format due date for display
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d');
    }
  };
  
  // Render task card
  const renderTaskCard = (taskId: string, index: number) => {
    const task = getTaskById(taskId);
    if (!task) return null;
    
    // Check if task passes the filters
    const isVisible = filteredTasks.some(t => t.id === taskId);
    if (!isVisible) return null;
    
    const isOverdue = task.endDate && isPast(new Date(task.endDate)) && !isToday(new Date(task.endDate)) && task.status !== 'completed';
    
    return (
      <Draggable draggableId={taskId} index={index} key={taskId}>
        {(provided, snapshot) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            sx={{
              mb: 1,
              backgroundColor: snapshot.isDragging ? 'rgba(200, 225, 255, 0.9)' : 'background.paper',
              opacity: task.status === 'completed' ? 0.7 : 1,
              boxShadow: snapshot.isDragging ? 4 : 1
            }}
          >
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                <Box {...provided.dragHandleProps} sx={{ mr: 1, color: 'action.disabled' }}>
                  <DragIcon fontSize="small" />
                </Box>
                <Typography variant="body2" sx={{ 
                  fontWeight: 'medium',
                  flexGrow: 1,
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none'
                }}>
                  {task.title}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                <Chip 
                  label={task.priority} 
                  size="small" 
                  color={getPriorityColor(task.priority)} 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
                
                {task.endDate && (
                  <Chip
                    icon={<TodayIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={formatDueDate(task.endDate)}
                    size="small"
                    color={isOverdue ? 'error' : 'default'}
                    variant="outlined"
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      borderColor: isOverdue ? 'error.main' : 'divider'
                    }}
                  />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {task.assignedTo ? (
                  <Chip
                    icon={<PersonIcon sx={{ fontSize: '0.9rem !important' }} />}
                    label={task.assignedTo}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem' }}
                  />
                ) : (
                  <Box /> // Empty box for alignment
                )}
                
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenTaskInfo(task.id)}
                  sx={{ p: 0.5 }}
                  data-testid="view-task-button"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" display="flex" alignItems="center">
          <KanbanIcon sx={{ mr: 1 }} />
          Kanban Board
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            size="small"
            onClick={handleAddColumn}
            sx={{ mr: 1 }}
          >
            Add Column
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            size="small"
            onClick={handleFilterMenuOpen}
            color={Object.values(filters).some(v => v !== null) ? 'primary' : 'inherit'}
          >
            Filter
            {Object.values(filters).filter(v => v !== null).length > 0 && (
              <Badge 
                badgeContent={Object.values(filters).filter(v => v !== null).length} 
                color="primary" 
                sx={{ ml: 1 }}
              />
            )}
          </Button>
          
          <Menu
            anchorEl={filterMenuAnchorEl}
            open={Boolean(filterMenuAnchorEl)}
            onClose={handleFilterMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="subtitle2">Filter Tasks</Typography>
            </MenuItem>
            <Divider />
            
            <MenuItem onClick={() => handleFilterSelect('assignee', 'John')}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Assigned to John {filters.assignee === 'John' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('assignee', 'Sarah')}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              Assigned to Sarah {filters.assignee === 'Sarah' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('assignee', null)}>
              <PersonIcon fontSize="small" sx={{ mr: 1 }} />
              All Assignees
            </MenuItem>
            <Divider />
            
            <MenuItem onClick={() => handleFilterSelect('priority', 'high')}>
              <FlagIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
              High Priority {filters.priority === 'high' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('priority', 'medium')}>
              <FlagIcon fontSize="small" sx={{ mr: 1, color: 'warning.main' }} />
              Medium Priority {filters.priority === 'medium' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('priority', 'low')}>
              <FlagIcon fontSize="small" sx={{ mr: 1, color: 'success.main' }} />
              Low Priority {filters.priority === 'low' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('priority', null)}>
              <FlagIcon fontSize="small" sx={{ mr: 1 }} />
              All Priorities
            </MenuItem>
            <Divider />
            
            <MenuItem onClick={() => handleFilterSelect('dueDate', 'today')}>
              <TodayIcon fontSize="small" sx={{ mr: 1 }} />
              Due Today {filters.dueDate === 'today' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('dueDate', 'tomorrow')}>
              <TodayIcon fontSize="small" sx={{ mr: 1 }} />
              Due Tomorrow {filters.dueDate === 'tomorrow' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('dueDate', 'overdue')}>
              <TodayIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
              Overdue {filters.dueDate === 'overdue' && <CheckIcon fontSize="small" sx={{ ml: 1 }} />}
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect('dueDate', null)}>
              <TodayIcon fontSize="small" sx={{ mr: 1 }} />
              All Due Dates
            </MenuItem>
            <Divider />
            
            <MenuItem onClick={handleClearFilters}>
              <FilterIcon fontSize="small" sx={{ mr: 1 }} />
              Clear All Filters
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {/* Kanban board */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Grid container spacing={2} sx={{ minHeight: '100%' }}>
            {columns.map(column => (
              <Grid item key={column.id} xs={12} sm={6} md={3}>
                <Paper 
                  elevation={0} 
                  variant="outlined" 
                  sx={{ 
                    height: '100%', 
                    bgcolor: column.color,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box 
                    sx={{ 
                      p: 1, 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle1">
                        {column.title}
                      </Typography>
                      <Chip 
                        label={columnTaskCounts[column.id]} 
                        size="small" 
                        sx={{ ml: 1, height: 20 }}
                      />
                      {column.limit && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                          / {column.limit}
                        </Typography>
                      )}
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleColumnMenuOpen(e, column.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        sx={{ 
                          p: 1, 
                          flexGrow: 1,
                          minHeight: 100,
                          backgroundColor: snapshot.isDraggingOver ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                          transition: 'background-color 0.2s ease',
                          overflow: 'auto'
                        }}
                      >
                        {column.taskIds.map((taskId, index) => renderTaskCard(taskId, index))}
                        {provided.placeholder}
                        
                        {column.limit && column.taskIds.length >= column.limit && (
                          <Alert severity="warning" variant="outlined" sx={{ mt: 1 }}>
                            WIP limit reached
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Droppable>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DragDropContext>
      </Box>
      
      {/* Column menu */}
      <Menu
        anchorEl={columnMenuAnchorEl}
        open={Boolean(columnMenuAnchorEl)}
        onClose={handleColumnMenuClose}
      >
        <MenuItem onClick={handleEditColumn}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Column
        </MenuItem>
        <MenuItem 
          onClick={handleDeleteColumn}
          disabled={columns.length <= 1}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Column
        </MenuItem>
      </Menu>
      
      {/* Column edit dialog */}
      <Dialog
        open={columnDialogOpen}
        onClose={() => setColumnDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {editingColumn ? 'Edit Column' : 'Add New Column'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Column Title"
              value={columnFormData.title}
              onChange={(e) => setColumnFormData({ ...columnFormData, title: e.target.value })}
              margin="normal"
              size="small"
              autoFocus
            />
            
            <TextField
              fullWidth
              label="Color"
              value={columnFormData.color}
              onChange={(e) => setColumnFormData({ ...columnFormData, color: e.target.value })}
              margin="normal"
              size="small"
              type="color"
              InputProps={{
                startAdornment: (
                  <Box 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      mr: 1, 
                      borderRadius: 1,
                      backgroundColor: columnFormData.color,
                      border: '1px solid',
                      borderColor: 'divider'
                    }} 
                  />
                )
              }}
            />
            
            <TextField
              fullWidth
              label="WIP Limit (0 for no limit)"
              value={columnFormData.limit}
              onChange={(e) => setColumnFormData({ 
                ...columnFormData, 
                limit: parseInt(e.target.value) || 0 
              })}
              margin="normal"
              size="small"
              type="number"
              inputProps={{ min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setColumnDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveColumn}
            variant="contained"
            color="primary"
            disabled={!columnFormData.title.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Task info dialog */}
      <Dialog
        open={taskInfoDialogOpen}
        onClose={() => setTaskInfoDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedTaskId && (
          <>
            {(() => {
              const task = getTaskById(selectedTaskId);
              
              if (!task) return null;
              
              const isOverdue = task.endDate && isPast(new Date(task.endDate)) && !isToday(new Date(task.endDate)) && task.status !== 'completed';
              
              return (
                <>
                  <DialogTitle>
                    Task Details
                  </DialogTitle>
                  <DialogContent>
                    <Box sx={{ pt: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {task.title}
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Description
                          </Typography>
                          <Typography variant="body2">
                            {task.description || 'No description provided.'}
                          </Typography>
                        </Box>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Status
                            </Typography>
                            <Chip 
                              label={task.status.replace('_', ' ')} 
                              color={
                                task.status === 'completed' ? 'success' :
                                task.status === 'in_progress' ? 'primary' :
                                task.status === 'blocked' ? 'error' : 
                                'default'
                              }
                            />
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Priority
                            </Typography>
                            <Chip 
                              label={task.priority} 
                              color={getPriorityColor(task.priority)} 
                            />
                          </Grid>
                        </Grid>
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Assigned To
                            </Typography>
                            <Typography variant="body2" display="flex" alignItems="center">
                              <PersonIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                              {task.assignedTo || 'Unassigned'}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Due Date
                            </Typography>
                            <Typography 
                              variant="body2" 
                              display="flex" 
                              alignItems="center"
                              color={isOverdue ? 'error.main' : 'text.primary'}
                            >
                              <TodayIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                              {task.endDate ? format(new Date(task.endDate), 'PPP') : 'No due date'}
                              {isOverdue && (
                                <Chip 
                                  label="Overdue" 
                                  color="error" 
                                  size="small" 
                                  sx={{ ml: 1, height: 20 }}
                                />
                              )}
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        {task.tags && task.tags.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Tags
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {task.tags.map(tag => (
                                <Chip 
                                  key={tag} 
                                  label={tag} 
                                  size="small" 
                                  variant="outlined"
                                />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setTaskInfoDialogOpen(false)}>Close</Button>
                  </DialogActions>
                </>
              );
            })()}
          </>
        )}
      </Dialog>
    </Paper>
  );
};

// Add missing CheckIcon since we need it for the menu checkmarks
const CheckIcon = (props: any) => {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" {...props}>
      <path
        fill="currentColor"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    </svg>
  );
};

export default TaskKanbanBoard; 