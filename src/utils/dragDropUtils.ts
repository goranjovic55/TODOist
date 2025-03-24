import { Task, Group, Project } from '../stores/tasksSlice';

export type DraggableItem = Task | Group | Project;

// Define types for the drag data
export interface DragData {
  itemId: string;
  itemType: 'task' | 'group' | 'project';
}

// Handle the start of a drag operation
export const handleDragStart = (
  event: React.DragEvent<HTMLElement>, 
  item: DraggableItem
) => {
  // Determine the item type
  let itemType: 'task' | 'group' | 'project';
  
  if ('status' in item) {
    itemType = 'task';
  } else if ('parentId' in item) {
    itemType = 'group';
  } else {
    itemType = 'project';
  }
  
  // Set the drag data
  const dragData: DragData = {
    itemId: item.id,
    itemType
  };
  
  // Set the drag data as JSON string
  event.dataTransfer.setData('application/json', JSON.stringify(dragData));
  
  // Set a visual feedback during drag
  event.dataTransfer.effectAllowed = 'move';
};

// Handle a drag over event (used to indicate drop is allowed)
export const handleDragOver = (
  event: React.DragEvent<HTMLElement>,
  targetItem: DraggableItem
) => {
  event.preventDefault();
  
  // Get the drag data
  const dragDataJson = event.dataTransfer.getData('application/json');
  if (!dragDataJson) return;
  
  const dragData = JSON.parse(dragDataJson) as DragData;
  
  // Prevent dropping a parent onto its child
  if (dragData.itemId === targetItem.id) {
    event.dataTransfer.dropEffect = 'none';
    return;
  }
  
  // Set the visual indicator for a valid drop
  event.dataTransfer.dropEffect = 'move';
};

// Check if a drop is valid
export const isValidDrop = (
  draggedItem: DraggableItem,
  targetItem: DraggableItem
): boolean => {
  // Projects can't be dropped into anything
  if (!('parentId' in draggedItem)) {
    return false;
  }
  
  // Tasks can be dropped into groups or projects
  if ('status' in draggedItem) {
    return !('status' in targetItem);
  }
  
  // Groups can be dropped into projects
  if ('parentId' in draggedItem && !('status' in draggedItem)) {
    return !('parentId' in targetItem) || targetItem.parentId === undefined;
  }
  
  return false;
};

// Get parent ID for a target item
export const getTargetParentId = (targetItem: DraggableItem): string | undefined => {
  if ('status' in targetItem) {
    // Target is a task, use its parent ID
    return targetItem.parentId;
  } else if ('parentId' in targetItem) {
    // Target is a group, drop into this group
    return targetItem.id;
  } else {
    // Target is a project, drop directly into project
    return targetItem.id;
  }
}; 