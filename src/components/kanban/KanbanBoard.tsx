import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  DragIndicator as DragIcon,
  Settings as SettingsIcon,
  ColorLens as ColorIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../stores/store';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Define types and interfaces
interface KanbanColumn {
  id: string;
  title: string;
  taskIds: string[];
  color: string;
  wipLimit?: number; // Work in Progress limit
}

interface KanbanBoard {
  columns: { [key: string]: KanbanColumn };
  columnOrder: string[];
}

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  assignee?: string;
}

const KanbanBoard: React.FC = () => {
  // State for kanban board
  const [board, setBoard] = useState<KanbanBoard>({
    columns: {
      'todo': {
        id: 'todo',
        title: 'To Do',
        taskIds: [],
        color: '#e0e0e0'
      },
      'in-progress': {
        id: 'in-progress',
        title: 'In Progress',
        taskIds: [],
        color: '#bbdefb',
        wipLimit: 5
      },
      'review': {
        id: 'review',
        title: 'Review',
        taskIds: [],
        color: '#fff9c4'
      },
      'done': {
        id: 'done',
        title: 'Done',
        taskIds: [],
        color: '#c8e6c9'
      }
    },
    columnOrder: ['todo', 'in-progress', 'review', 'done']
  });

  // State for dialog controls
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  
  // State for the currently active column/task for editing
  const [activeColumn, setActiveColumn] = useState<KanbanColumn | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // State for menu anchors
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [anchorColumnId, setAnchorColumnId] = useState<string | null>(null);
  const [anchorTaskId, setAnchorTaskId] = useState<string | null>(null);
  
  // State for new entities
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#e0e0e0');
  const [newColumnWipLimit, setNewColumnWipLimit] = useState<number | undefined>(undefined);
  
  // State for alerts
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  
  // Redux state
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const dispatch = useDispatch();
  
  // Load board from localStorage on mount
  useEffect(() => {
    const savedBoard = localStorage.getItem('kanban_board');
    if (savedBoard) {
      try {
        setBoard(JSON.parse(savedBoard));
      } catch (error) {
        console.error('Error loading kanban board:', error);
      }
    } else {
      // If no saved board, initialize with tasks from Redux
      initializeBoardWithTasks();
    }
  }, []);
  
  // Save board to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('kanban_board', JSON.stringify(board));
  }, [board]);
  
  // Initialize board with tasks from Redux
  const initializeBoardWithTasks = () => {
    const newBoard = { ...board };
    
    // Filter tasks into appropriate columns based on status
    tasks.forEach(task => {
      switch (task.status) {
        case 'todo':
          if (!newBoard.columns['todo'].taskIds.includes(task.id)) {
            newBoard.columns['todo'].taskIds.push(task.id);
          }
          break;
        case 'in-progress':
          if (!newBoard.columns['in-progress'].taskIds.includes(task.id)) {
            newBoard.columns['in-progress'].taskIds.push(task.id);
          }
          break;
        case 'review':
          if (!newBoard.columns['review'].taskIds.includes(task.id)) {
            newBoard.columns['review'].taskIds.push(task.id);
          }
          break;
        case 'done':
          if (!newBoard.columns['done'].taskIds.includes(task.id)) {
            newBoard.columns['done'].taskIds.push(task.id);
          }
          break;
        default:
          if (!newBoard.columns['todo'].taskIds.includes(task.id)) {
            newBoard.columns['todo'].taskIds.push(task.id);
          }
      }
    });
    
    setBoard(newBoard);
  };
  
  // Handle drag and drop
  const handleDragEnd = (result: any) => {
    const { destination, source, draggableId, type } = result;
    
    // If dropped outside a valid droppable area
    if (!destination) {
      return;
    }
    
    // If dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }
    
    // If reordering columns
    if (type === 'column') {
      const newColumnOrder = Array.from(board.columnOrder);
      newColumnOrder.splice(source.index, 1);
      newColumnOrder.splice(destination.index, 0, draggableId);
      
      setBoard({
        ...board,
        columnOrder: newColumnOrder
      });
      return;
    }
    
    // Check for WIP limit
    const destinationColumn = board.columns[destination.droppableId];
    if (
      destinationColumn.wipLimit && 
      destinationColumn.taskIds.length >= destinationColumn.wipLimit && 
      source.droppableId !== destination.droppableId
    ) {
      showSnackbar(`WIP limit reached for ${destinationColumn.title}`, 'warning');
      return;
    }
    
    // Handle task movement
    const sourceColumn = board.columns[source.droppableId];
    const destColumn = board.columns[destination.droppableId];
    
    if (sourceColumn === destColumn) {
      // Moving within the same column
      const newTaskIds = Array.from(sourceColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);
      
      const newColumn = {
        ...sourceColumn,
        taskIds: newTaskIds
      };
      
      setBoard({
        ...board,
        columns: {
          ...board.columns,
          [newColumn.id]: newColumn
        }
      });
      
      // Update task status if needed
      updateTaskStatus(draggableId, destColumn.id);
    } else {
      // Moving to a different column
      const sourceTaskIds = Array.from(sourceColumn.taskIds);
      sourceTaskIds.splice(source.index, 1);
      
      const destTaskIds = Array.from(destColumn.taskIds);
      destTaskIds.splice(destination.index, 0, draggableId);
      
      setBoard({
        ...board,
        columns: {
          ...board.columns,
          [sourceColumn.id]: {
            ...sourceColumn,
            taskIds: sourceTaskIds
          },
          [destColumn.id]: {
            ...destColumn,
            taskIds: destTaskIds
          }
        }
      });
      
      // Update task status
      updateTaskStatus(draggableId, destColumn.id);
    }
  };
  
  // Update task status in Redux when moved between columns
  const updateTaskStatus = (taskId: string, columnId: string) => {
    // This would normally dispatch an action to update the task in Redux
    // For now, we'll just log it
    console.log(`Task ${taskId} moved to column ${columnId}`);
    
    // In a real app with Redux:
    // dispatch(updateTask({ id: taskId, status: columnId }));
  };
  
  // Handle adding a new column
  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      showSnackbar('Column title cannot be empty', 'error');
      return;
    }
    
    const columnId = `column-${Date.now()}`;
    const newColumn: KanbanColumn = {
      id: columnId,
      title: newColumnTitle,
      taskIds: [],
      color: newColumnColor,
      wipLimit: newColumnWipLimit
    };
    
    setBoard({
      ...board,
      columns: {
        ...board.columns,
        [columnId]: newColumn
      },
      columnOrder: [...board.columnOrder, columnId]
    });
    
    setNewColumnTitle('');
    setNewColumnColor('#e0e0e0');
    setNewColumnWipLimit(undefined);
    setColumnDialogOpen(false);
    showSnackbar('Column added successfully', 'success');
  };
  
  // Handle editing a column
  const handleEditColumn = () => {
    if (!activeColumn) return;
    
    if (!newColumnTitle.trim()) {
      showSnackbar('Column title cannot be empty', 'error');
      return;
    }
    
    const updatedColumn: KanbanColumn = {
      ...activeColumn,
      title: newColumnTitle,
      color: newColumnColor,
      wipLimit: newColumnWipLimit
    };
    
    setBoard({
      ...board,
      columns: {
        ...board.columns,
        [activeColumn.id]: updatedColumn
      }
    });
    
    setActiveColumn(null);
    setNewColumnTitle('');
    setNewColumnColor('#e0e0e0');
    setNewColumnWipLimit(undefined);
    setColumnDialogOpen(false);
    showSnackbar('Column updated successfully', 'success');
  };
  
  // Handle deleting a column
  const handleDeleteColumn = (columnId: string) => {
    const column = board.columns[columnId];
    
    // Check if column has tasks
    if (column.taskIds.length > 0) {
      showSnackbar('Cannot delete column with tasks', 'error');
      return;
    }
    
    const newColumns = { ...board.columns };
    delete newColumns[columnId];
    
    const newColumnOrder = board.columnOrder.filter(id => id !== columnId);
    
    setBoard({
      columns: newColumns,
      columnOrder: newColumnOrder
    });
    
    setColumnMenuAnchor(null);
    showSnackbar('Column deleted successfully', 'success');
  };
  
  // Open column menu
  const handleColumnMenuOpen = (event: React.MouseEvent<HTMLElement>, columnId: string) => {
    setColumnMenuAnchor(event.currentTarget);
    setAnchorColumnId(columnId);
  };
  
  // Open column dialog for editing
  const handleColumnEditClick = () => {
    if (!anchorColumnId) return;
    
    const column = board.columns[anchorColumnId];
    setActiveColumn(column);
    setNewColumnTitle(column.title);
    setNewColumnColor(column.color);
    setNewColumnWipLimit(column.wipLimit);
    setColumnDialogOpen(true);
    setColumnMenuAnchor(null);
  };
  
  // Open column dialog for adding
  const handleAddColumnClick = () => {
    setActiveColumn(null);
    setNewColumnTitle('');
    setNewColumnColor('#e0e0e0');
    setNewColumnWipLimit(undefined);
    setColumnDialogOpen(true);
  };
  
  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Render column dialog
  const renderColumnDialog = () => (
    <Dialog open={columnDialogOpen} onClose={() => setColumnDialogOpen(false)}>
      <DialogTitle>
        {activeColumn ? 'Edit Column' : 'Add Column'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Column Title"
          fullWidth
          value={newColumnTitle}
          onChange={(e) => setNewColumnTitle(e.target.value)}
          variant="outlined"
        />
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Column Color
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: 1,
                mr: 1,
                backgroundColor: newColumnColor
              }}
            />
            <TextField
              size="small"
              value={newColumnColor}
              onChange={(e) => setNewColumnColor(e.target.value)}
              sx={{ width: 120 }}
            />
          </Box>
        </Box>
        <Box sx={{ mt: 2 }}>
          <TextField
            margin="dense"
            label="WIP Limit (optional)"
            type="number"
            fullWidth
            value={newColumnWipLimit || ''}
            onChange={(e) => setNewColumnWipLimit(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            variant="outlined"
            helperText="Maximum number of tasks allowed in this column"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setColumnDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={activeColumn ? handleEditColumn : handleAddColumn} 
          variant="contained"
        >
          {activeColumn ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
  
  // Render column menu
  const renderColumnMenu = () => (
    <Menu
      anchorEl={columnMenuAnchor}
      open={Boolean(columnMenuAnchor)}
      onClose={() => setColumnMenuAnchor(null)}
    >
      <MenuItem onClick={handleColumnEditClick}>
        <EditIcon fontSize="small" sx={{ mr: 1 }} />
        Edit Column
      </MenuItem>
      <MenuItem 
        onClick={() => {
          if (anchorColumnId) {
            handleDeleteColumn(anchorColumnId);
          }
        }}
      >
        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
        Delete Column
      </MenuItem>
    </Menu>
  );
  
  // Render a column header
  const renderColumnHeader = (column: KanbanColumn, index: number) => (
    <Box
      sx={{
        p: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: column.color,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="subtitle1" fontWeight="bold">
          {column.title}
        </Typography>
        {column.wipLimit && (
          <Chip
            size="small"
            label={`${column.taskIds.length}/${column.wipLimit}`}
            color={column.taskIds.length >= column.wipLimit ? "error" : "default"}
            sx={{ ml: 1 }}
          />
        )}
      </Box>
      <IconButton
        size="small"
        onClick={(e) => handleColumnMenuOpen(e, column.id)}
      >
        <MoreIcon fontSize="small" />
      </IconButton>
    </Box>
  );
  
  // Render a task card
  const renderTaskCard = (taskId: string, index: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    
    return (
      <Draggable draggableId={taskId} index={index} key={taskId}>
        {(provided) => (
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            sx={{ 
              mb: 1, 
              boxShadow: 1,
              '&:hover': { boxShadow: 3 }
            }}
          >
            <CardContent sx={{ py: 1 }}>
              <Typography variant="subtitle2">{task.title}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <Chip
                  label={task.priority}
                  size="small"
                  color={
                    task.priority === 'urgent' 
                      ? 'error' 
                      : task.priority === 'high'
                        ? 'warning'
                        : task.priority === 'medium'
                          ? 'info'
                          : 'default'
                  }
                  sx={{ mr: 1, textTransform: 'capitalize' }}
                />
                {task.dueDate && (
                  <Typography variant="caption" color="text.secondary">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };
  
  // Render a column
  const renderColumn = (columnId: string, index: number) => {
    const column = board.columns[columnId];
    
    return (
      <Draggable draggableId={columnId} index={index} key={columnId}>
        {(provided) => (
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            sx={{ 
              width: 280,
              mr: 2,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 2,
              bgcolor: 'background.paper',
              boxShadow: 2
            }}
          >
            <Box {...provided.dragHandleProps}>
              {renderColumnHeader(column, index)}
            </Box>
            
            <Droppable droppableId={columnId} type="task">
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    p: 1,
                    minHeight: 100,
                    flexGrow: 1,
                    backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'background.default',
                    transition: 'background-color 0.2s ease',
                    overflow: 'auto'
                  }}
                >
                  {column.taskIds.map((taskId, index) => 
                    renderTaskCard(taskId, index)
                  )}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Box>
        )}
      </Draggable>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Kanban Board</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddColumnClick}
            sx={{ mr: 1 }}
          >
            Add Column
          </Button>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setSettingsDialogOpen(true)}
          >
            Board Settings
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Drag and drop tasks between columns to update their status. Add new columns to customize your workflow.
        </Typography>
      </Paper>
      
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="all-columns" direction="horizontal" type="column">
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.droppableProps}
              sx={{ 
                display: 'flex',
                overflowX: 'auto',
                p: 1,
                minHeight: 'calc(100vh - 250px)'
              }}
            >
              {board.columnOrder.map((columnId, index) => 
                renderColumn(columnId, index)
              )}
              {provided.placeholder}
            </Box>
          )}
        </Droppable>
      </DragDropContext>
      
      {/* Column Dialog */}
      {renderColumnDialog()}
      
      {/* Column Menu */}
      {renderColumnMenu()}
      
      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default KanbanBoard; 