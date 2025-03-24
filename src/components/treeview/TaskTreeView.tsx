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
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Assignment as TaskIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';

import { RootState, AppDispatch } from '../../stores/store';
import { toggleNodeExpansion, setSelectedItem } from '../../stores/uiSlice';
import { Project, Group, Task } from '../../stores/tasksSlice';

// Define a type for tree items (could be a project, group, or task)
type TreeItem = Project | Group | Task;

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
  const { expandedNodes, selectedItemId } = useSelector((state: RootState) => state.ui);
  const { projects, groups, tasks } = useSelector((state: RootState) => state.tasks);
  
  const itemType = getItemType(item);
  const isExpanded = expandedNodes.includes(item.id);
  const isSelected = selectedItemId === item.id;
  
  // Get children based on item type
  const getChildren = (): TreeItem[] => {
    switch (itemType) {
      case 'project':
        return [...groups.filter(g => g.parentId === item.id)];
      case 'group':
        return [
          ...groups.filter(g => g.parentId === item.id),
          ...tasks.filter(t => t.parentId === item.id)
        ];
      case 'task':
        return tasks.filter(t => t.parentId === item.id);
      default:
        return [];
    }
  };
  
  const children = getChildren();
  const hasChildren = children.length > 0;
  
  const handleToggleExpand = () => {
    dispatch(toggleNodeExpansion(item.id));
  };
  
  const handleSelect = () => {
    dispatch(setSelectedItem(item.id));
  };
  
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
              <TaskIcon />
            )}
          </ListItemIcon>
          <ListItemText
            primary={item.name || item.title}
            secondary={itemType === 'task' ? (item as Task).status : undefined}
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
  const { projects } = useSelector((state: RootState) => state.tasks);
  
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