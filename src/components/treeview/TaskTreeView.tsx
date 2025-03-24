import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton, 
  Collapse, 
  IconButton, 
  Box,
  Paper,
  Typography,
  Tooltip,
  Divider,
  Badge,
  Chip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Assignment as TaskIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../stores/store';
import { toggleNodeExpansion, setSelectedItem, resetFilters } from '../../stores/uiSlice';
import { Project, Group, Task as TaskType, updateTask } from '../../stores/tasksSlice';
import { filterTasks, countTasksByStatus } from '../../utils/filterUtils';
import Task from './Task';
import { handleDragStart, handleDragOver, getTargetParentId, DragData, DraggableItem } from '../../utils/dragDropUtils';

// Define a type for tree items (could be a project, group, or task)
type TreeItem = Project | Group | TaskType;

interface TreeNodeProps {
  item: TreeItem;
  depth: number;
}

const getItemType = (item: TreeItem): 'project' | 'group' | 'task' => {
  if ('status' in item) {
    return 'task';
  } else if ('parentId' in item) {
    return 'group';
  } else {
    return 'project';
  }
};

const TreeNode: React.FC<TreeNodeProps> = ({ item, depth }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { expandedNodes, selectedItemId, filters } = useSelector((state: RootState) => state.ui);
  const { projects, groups, tasks } = useSelector((state: RootState) => state.tasks);
  
  const itemType = getItemType(item);
  const isExpanded = expandedNodes.includes(item.id);
  const isSelected = selectedItemId === item.id;
  
  // Get children based on item type
  const getChildren = (): TreeItem[] => {
    switch (itemType) {
      case 'project':
        return [...groups.filter(g => g.parentId === item.id)];
      case 'group': {
        const groupChildren = [...groups.filter(g => g.parentId === item.id)];
        // Get filtered tasks for this group
        let taskChildren = tasks.filter(t => t.parentId === item.id);
        
        // Apply filters to tasks
        if (Object.values(filters).some(val => 
          Array.isArray(val) ? val.length > 0 : Boolean(val)
        )) {
          taskChildren = filterTasks(taskChildren, filters);
        }
        
        return [...groupChildren, ...taskChildren];
      }
      case 'task':
        return tasks.filter(t => t.parentId === item.id);
      default:
        return [];
    }
  };
  
  const children = getChildren();
  const hasChildren = children.length > 0;
  
  // Get task counts for badges (if this is a project or group)
  const getTaskCounts = () => {
    if (itemType === 'task') {
      return null;
    }
    
    let tasksInScope: TaskType[] = [];
    
    // For projects, get all tasks in all child groups
    if (itemType === 'project') {
      const childGroupIds = groups
        .filter(g => g.parentId === item.id)
        .map(g => g.id);
      
      tasksInScope = tasks.filter(t => 
        childGroupIds.includes(t.parentId || '')
      ) as TaskType[];
    } 
    // For groups, get all tasks in this group
    else if (itemType === 'group') {
      tasksInScope = tasks.filter(t => t.parentId === item.id) as TaskType[];
    }
    
    return countTasksByStatus(tasksInScope);
  };
  
  const taskCounts = getTaskCounts();
  
  const handleToggleExpand = () => {
    dispatch(toggleNodeExpansion(item.id));
  };
  
  const handleSelect = () => {
    dispatch(setSelectedItem(item.id));
  };
  
  // Handle drop events
  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    
    // Get the drag data
    const dragDataJson = event.dataTransfer.getData('application/json');
    if (!dragDataJson) return;
    
    const dragData = JSON.parse(dragDataJson) as DragData;
    
    // Find the dragged item
    let draggedItem: DraggableItem | undefined;
    
    switch (dragData.itemType) {
      case 'task':
        draggedItem = tasks.find(t => t.id === dragData.itemId);
        break;
      case 'group':
        draggedItem = groups.find(g => g.id === dragData.itemId);
        break;
      case 'project':
        draggedItem = projects.find(p => p.id === dragData.itemId);
        break;
    }
    
    if (!draggedItem) return;
    
    // Get the new parent ID
    const newParentId = getTargetParentId(item);
    
    // Skip if parent hasn't changed
    if (dragData.itemType !== 'project' && 'parentId' in draggedItem && draggedItem.parentId === newParentId) {
      return;
    }
    
    // Update the item with new parent
    if (dragData.itemType === 'task' && newParentId) {
      dispatch(updateTask({
        id: dragData.itemId,
        parentId: newParentId
      }));
    }
    // Add similar handling for groups if needed
  };
  
  // Handle drag starting from this node
  const onDragStart = (event: React.DragEvent<HTMLElement>) => {
    handleDragStart(event, item);
  };
  
  // Handle dragover on this node
  const onDragOver = (event: React.DragEvent<HTMLElement>) => {
    handleDragOver(event, item);
  };
  
  // If this is a task, render the Task component
  if (itemType === 'task') {
    return (
      <>
        <Task 
          task={item as TaskType}
          depth={depth}
          hasChildren={hasChildren}
          onToggleExpand={handleToggleExpand}
          isExpanded={isExpanded}
          onDrop={handleDrop}
        />
        
        {hasChildren && isExpanded && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {children.map((child) => (
                <TreeNode
                  key={child.id}
                  item={child}
                  depth={depth + 1}
                />
              ))}
            </List>
          </Collapse>
        )}
      </>
    );
  }
  
  // Render project/group node
  return (
    <>
      <ListItem
        disablePadding
        secondaryAction={
          <IconButton edge="end" size="small">
            <AddIcon fontSize="small" />
          </IconButton>
        }
        sx={{ pl: depth * 2 }}
        draggable={itemType !== 'project'} // Projects cannot be dragged
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={handleDrop}
      >
        <ListItemButton
          selected={isSelected}
          onClick={handleSelect}
          dense
        >
          <ListItemIcon onClick={hasChildren ? handleToggleExpand : undefined}>
            {hasChildren ? (
              isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />
            ) : (
              <Box sx={{ width: 24 }} /> // Empty space for alignment
            )}
          </ListItemIcon>
          <ListItemIcon>
            {itemType === 'project' || itemType === 'group' ? (
              isExpanded ? <FolderOpenIcon /> : <FolderIcon />
            ) : (
              <TaskIcon color={
                (item as TaskType).status === 'completed' ? 'success' :
                (item as TaskType).status === 'blocked' ? 'error' :
                (item as TaskType).status === 'in_progress' ? 'primary' :
                'default'
              } />
            )}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: itemType === 'task' && (item as TaskType).status === 'completed'
                      ? 'line-through'
                      : 'none',
                    fontWeight: isSelected ? 'bold' : 'normal'
                  }}
                >
                  {item.name || (item as TaskType).title}
                </Typography>
                
                {itemType !== 'task' && taskCounts && taskCounts.total > 0 && (
                  <Box sx={{ ml: 1, display: 'flex', gap: 0.5 }}>
                    {taskCounts.completed > 0 && (
                      <Chip size="small" label={taskCounts.completed} color="success" 
                        variant="outlined" sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }} />
                    )}
                    {taskCounts.in_progress > 0 && (
                      <Chip size="small" label={taskCounts.in_progress} color="primary" 
                        variant="outlined" sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }} />
                    )}
                    {taskCounts.blocked > 0 && (
                      <Chip size="small" label={taskCounts.blocked} color="error" 
                        variant="outlined" sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }} />
                    )}
                  </Box>
                )}
              </Box>
            }
            secondary={
              itemType === 'task' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  {(item as TaskType).priority === 'high' && (
                    <Chip size="small" label="High" color="error" 
                      variant="outlined" sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }} />
                  )}
                  {(item as TaskType).tags.map(tag => (
                    <Chip
                      key={tag}
                      size="small"
                      label={tag}
                      sx={{ height: 18, '& .MuiChip-label': { p: 0.5 } }}
                    />
                  ))}
                </Box>
              )
            }
          />
        </ListItemButton>
      </ListItem>
      
      {hasChildren && isExpanded && (
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child) => (
              <TreeNode
                key={child.id}
                item={child}
                depth={depth + 1}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
};

const TaskTreeView: React.FC = () => {
  const dispatch = useDispatch();
  const { projects } = useSelector((state: RootState) => state.tasks);
  const { filters } = useSelector((state: RootState) => state.ui);
  
  const filtersActive = Object.values(filters).some(val => 
    Array.isArray(val) ? val.length > 0 : Boolean(val)
  );
  
  const handleClearFilters = () => {
    dispatch(resetFilters());
  };
  
  return (
    <Paper sx={{ height: '100%', overflow: 'auto', borderRadius: 0 }}>
      {projects.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No projects yet. Click the + button to create one.
          </Typography>
        </Box>
      ) : (
        <List>
          <ListItem>
            <ListItemText
              primary={<Typography variant="subtitle1" fontWeight="bold">Projects</Typography>}
            />
            {filtersActive && (
              <Tooltip title="Clear Filters">
                <IconButton edge="end" onClick={handleClearFilters} size="small" sx={{ mr: 1 }}>
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Badge color="primary" variant="dot" invisible={!filtersActive}>
              <Tooltip title={filtersActive ? "Filters Active" : "Filter"}>
                <IconButton edge="end">
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Badge>
            <Tooltip title="Add Project">
              <IconButton edge="end">
                <AddIcon />
              </IconButton>
            </Tooltip>
          </ListItem>
          <Divider />
          {projects.map((project) => (
            <TreeNode key={project.id} item={project} depth={0} />
          ))}
        </List>
      )}
    </Paper>
  );
};

export default TaskTreeView; 