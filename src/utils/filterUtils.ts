import { Task } from '../stores/tasksSlice';
import { TaskFilters } from '../stores/uiSlice';

/**
 * Filters tasks based on the provided filter criteria
 * @param tasks Array of tasks to filter
 * @param filters Filter criteria to apply
 * @returns Filtered tasks array
 */
export const filterTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  if (!tasks || !filters) {
    return tasks;
  }
  
  return tasks.filter(task => {
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Project and group filters (parent ID)
    if (
      (filters.projectIds.length > 0 || filters.groupIds.length > 0) && 
      !filters.groupIds.includes(task.parentId || '')
    ) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0 && !task.tags.some(tag => filters.tags.includes(tag))) {
      return false;
    }
    
    // Start date filters
    if (task.startDate) {
      const startDate = new Date(task.startDate);
      
      // Start date from filter
      if (filters.startDateFrom && new Date(filters.startDateFrom) > startDate) {
        return false;
      }
      
      // Start date to filter
      if (filters.startDateTo && new Date(filters.startDateTo) < startDate) {
        return false;
      }
    }
    
    // End date filters
    if (task.endDate) {
      const endDate = new Date(task.endDate);
      
      // End date from filter
      if (filters.endDateFrom && new Date(filters.endDateFrom) > endDate) {
        return false;
      }
      
      // End date to filter
      if (filters.endDateTo && new Date(filters.endDateTo) < endDate) {
        return false;
      }
    }
    
    // Search text filter
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchText);
      const descriptionMatch = task.description.toLowerCase().includes(searchText);
      const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(searchText));
      const noteMatch = task.notes.some(note => note.content.toLowerCase().includes(searchText));
      
      if (!(titleMatch || descriptionMatch || tagMatch || noteMatch)) {
        return false;
      }
    }
    
    // If the task passed all filters, include it
    return true;
  });
};

/**
 * Counts tasks by status
 * @param tasks Array of tasks to count
 * @returns Object with counts by status
 */
export const countTasksByStatus = (tasks: Task[]) => {
  const counts = {
    total: tasks.length,
    not_started: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0
  };
  
  tasks.forEach(task => {
    counts[task.status] += 1;
  });
  
  return counts;
};

/**
 * Calculates statistics about the tasks
 * @param tasks Array of tasks
 * @returns Object with task statistics
 */
export const getTaskStatistics = (tasks: Task[]) => {
  const statusCounts = countTasksByStatus(tasks);
  const overdueTasks = tasks.filter(task => {
    if (!task.endDate || task.status === 'completed') {
      return false;
    }
    
    const endDate = new Date(task.endDate);
    const now = new Date();
    return endDate < now;
  });
  
  const dueSoonTasks = tasks.filter(task => {
    if (!task.endDate || task.status === 'completed') {
      return false;
    }
    
    const endDate = new Date(task.endDate);
    const now = new Date();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    return endDate >= now && endDate <= new Date(now.getTime() + oneDayMs);
  });
  
  const highPriorityTasks = tasks.filter(task => task.priority === 'high');
  
  return {
    statusCounts,
    overdueTasks: overdueTasks.length,
    dueSoonTasks: dueSoonTasks.length,
    highPriorityTasks: highPriorityTasks.length,
    completionRate: tasks.length > 0 ? statusCounts.completed / tasks.length : 0
  };
}; 