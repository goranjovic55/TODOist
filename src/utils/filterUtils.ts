import { Task } from '../stores/tasksSlice';
import { TaskFilters } from '../stores/uiSlice';

/**
 * Filters tasks based on the provided filter criteria
 * @param tasks Array of tasks to filter
 * @param filters Filter criteria to apply
 * @returns Filtered tasks array
 */
export const filterTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  return tasks.filter(task => {
    // Filter by status
    if (filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Filter by priority
    if (filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Filter by parent group
    if (filters.groupIds.length > 0 && (!task.parentId || !filters.groupIds.includes(task.parentId))) {
      return false;
    }
    
    // Filter by tags (any match)
    if (filters.tags.length > 0 && !task.tags.some(tag => filters.tags.includes(tag))) {
      return false;
    }
    
    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descMatch = task.description.toLowerCase().includes(searchLower);
      const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!titleMatch && !descMatch && !tagMatch) {
        return false;
      }
    }
    
    // Filter by start date range
    if (filters.startDateFrom && task.startDate) {
      const startFrom = new Date(filters.startDateFrom);
      const taskStart = new Date(task.startDate);
      if (taskStart < startFrom) {
        return false;
      }
    }
    
    if (filters.startDateTo && task.startDate) {
      const startTo = new Date(filters.startDateTo);
      const taskStart = new Date(task.startDate);
      if (taskStart > startTo) {
        return false;
      }
    }
    
    // Filter by end date range
    if (filters.endDateFrom && task.endDate) {
      const endFrom = new Date(filters.endDateFrom);
      const taskEnd = new Date(task.endDate);
      if (taskEnd < endFrom) {
        return false;
      }
    }
    
    if (filters.endDateTo && task.endDate) {
      const endTo = new Date(filters.endDateTo);
      const taskEnd = new Date(task.endDate);
      if (taskEnd > endTo) {
        return false;
      }
    }
    
    // Task passed all filters
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
    counts[task.status]++;
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

// Sort tasks by various criteria
export enum SortCriteria {
  PRIORITY = 'priority',
  DUE_DATE = 'dueDate',
  CREATED_DATE = 'createdDate',
  TITLE = 'title',
  STATUS = 'status'
}

interface SortOptions {
  criteria: SortCriteria;
  ascending: boolean;
}

export const sortTasks = (tasks: Task[], options: SortOptions): Task[] => {
  const { criteria, ascending } = options;
  const multiplier = ascending ? 1 : -1;
  
  return [...tasks].sort((a, b) => {
    switch (criteria) {
      case SortCriteria.PRIORITY: {
        const priorityMap = { high: 0, medium: 1, low: 2 };
        return multiplier * (priorityMap[a.priority] - priorityMap[b.priority]);
      }
      
      case SortCriteria.DUE_DATE: {
        if (!a.endDate && !b.endDate) return 0;
        if (!a.endDate) return multiplier * 1;
        if (!b.endDate) return multiplier * -1;
        return multiplier * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
      }
      
      case SortCriteria.CREATED_DATE:
        return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      case SortCriteria.TITLE:
        return multiplier * a.title.localeCompare(b.title);
      
      case SortCriteria.STATUS: {
        const statusMap = { blocked: 0, in_progress: 1, not_started: 2, completed: 3 };
        return multiplier * (statusMap[a.status] - statusMap[b.status]);
      }
      
      default:
        return 0;
    }
  });
}; 