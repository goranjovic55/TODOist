import { Task } from '../stores/tasksSlice';
import { 
  isToday, 
  isPast, 
  getStartOfDay, 
  getWeekRange, 
  getMonthRange 
} from './dateUtils';
import { StatusCounts, DueDateCounts, DayProductivity, WorkloadItem } from '../types/task';

/**
 * Calculate task status counts
 * @param tasks List of tasks
 * @returns Object with counts for each status
 */
export const getStatusCounts = (tasks: Task[]): StatusCounts => {
  const counts: StatusCounts = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    blocked: 0,
    total: tasks.length,
    completion_rate: 0
  };
  
  // Count tasks by status
  tasks.forEach((task: Task) => {
    const status = task.status as keyof Pick<StatusCounts, 'not_started' | 'in_progress' | 'completed' | 'blocked'>;
    if (status in counts) {
      counts[status]++;
    }
  });
  
  // Calculate completion rate
  counts.completion_rate = counts.total > 0 
    ? (counts.completed / counts.total) * 100 
    : 0;
  
  return counts;
};

/**
 * Get counts of due and overdue tasks
 * @param tasks List of tasks
 * @returns Object with counts for due today and overdue tasks
 */
export const getDueDateCounts = (tasks: Task[]): DueDateCounts => {
  let dueTodayCount = 0;
  let overdueCount = 0;

  tasks.forEach((task: Task) => {
    if (task.status !== 'completed' && task.endDate) {
      const dueDate = new Date(task.endDate);
      
      if (isToday(dueDate)) {
        dueTodayCount++;
      } else if (isPast(dueDate)) {
        overdueCount++;
      }
    }
  });

  return { dueTodayCount, overdueCount };
};

/**
 * Get tasks created/completed within a specific date range
 * @param tasks List of tasks
 * @param range Date range ('today', 'week', 'month', 'all')
 * @returns Object with filtered tasks and date range
 */
export const getTasksInDateRange = (tasks: Task[], range: 'today' | 'week' | 'month' | 'all') => {
  const now = new Date();
  let startDate: Date;
  let endDate = now;
  
  // Determine date range based on selected time range
  switch (range) {
    case 'today':
      startDate = getStartOfDay(now);
      break;
    case 'week':
      const weekRange = getWeekRange(now);
      startDate = weekRange.startDate;
      endDate = weekRange.endDate;
      break;
    case 'month':
      const monthRange = getMonthRange(now);
      startDate = monthRange.startDate;
      endDate = monthRange.endDate;
      break;
    case 'all':
    default:
      // Get the oldest task date for "all time" range
      const oldestTaskDate = tasks.reduce((oldest, task) => {
        const taskDate = new Date(task.createdAt);
        return taskDate < oldest ? taskDate : oldest;
      }, now);
      
      // Default to 6 months back if no tasks or all tasks are recent
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      startDate = oldestTaskDate < sixMonthsAgo ? oldestTaskDate : sixMonthsAgo;
      break;
  }
  
  // Filter tasks created within the selected date range
  const tasksInRange = tasks.filter((task: Task) => {
    const createdDate = new Date(task.createdAt);
    return createdDate >= startDate && createdDate <= endDate;
  });
  
  return tasksInRange;
};

/**
 * Calculate the average completion time in days
 * @param tasks List of completed tasks with completedAt dates
 * @returns Average completion time in days
 */
export const getAverageCompletionTime = (tasks: Task[]): number => {
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.completedAt);
  
  if (completedTasks.length === 0) {
    return 0;
  }
  
  let totalCompletionDays = 0;
  let tasksWithCompletionTime = 0;
  
  completedTasks.forEach((task: Task) => {
    if (task.completedAt && task.createdAt) {
      const completionTime = new Date(task.completedAt).getTime() - new Date(task.createdAt).getTime();
      const completionDays = completionTime / (1000 * 60 * 60 * 24);
      totalCompletionDays += completionDays;
      tasksWithCompletionTime++;
    }
  });
  
  return tasksWithCompletionTime > 0 
    ? totalCompletionDays / tasksWithCompletionTime 
    : 0;
};

/**
 * Get productivity data by day of week
 * @param tasks List of tasks
 * @returns Array of day names and task completion counts
 */
export const getProductivityByDayOfWeek = (tasks: Task[]): DayProductivity[] => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayCounts = Array(7).fill(0);
  
  // Count completed tasks by day of week
  tasks.forEach((task: Task) => {
    if (task.status === 'completed' && task.completedAt) {
      const date = new Date(task.completedAt);
      const dayIndex = date.getDay();
      dayCounts[dayIndex]++;
    }
  });
  
  return days.map((day, index) => ({
    day,
    count: dayCounts[index]
  }));
};

/**
 * Get the most productive day of week based on task completion
 * @param tasks List of tasks
 * @returns The name of the most productive day, or null if no completed tasks
 */
export const getMostProductiveDay = (tasks: Task[]): string | null => {
  const dayData = getProductivityByDayOfWeek(tasks);
  
  if (dayData.every(day => day.count === 0)) {
    return null;
  }
  
  const mostProductiveDay = dayData.reduce((most, current) => 
    current.count > most.count ? current : most
  , dayData[0]);
  
  return mostProductiveDay.day;
};

/**
 * Get high priority tasks that are not completed
 * @param tasks List of tasks
 * @returns Array of high priority active tasks
 */
export const getHighPriorityTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => task.priority === 'high' && task.status !== 'completed');
};

/**
 * Extract unique tags from all tasks
 * @param tasks List of tasks
 * @returns Array of unique tag strings
 */
export const getUniqueTags = (tasks: Task[]): string[] => {
  const tagSet = new Set<string>();
  
  tasks.forEach((task: Task) => {
    if (task.tags) {
      task.tags.forEach(tag => tagSet.add(tag));
    }
  });
  
  return Array.from(tagSet);
};

/**
 * Calculate workload distribution by assignee
 * @param tasks List of tasks
 * @returns Array of assignee workload stats
 */
export const getWorkloadByAssignee = (tasks: Task[]): WorkloadItem[] => {
  const workloadMap = new Map<string, WorkloadItem>();

  // Initialize with default for unassigned
  workloadMap.set('unassigned', {
    assignee: 'Unassigned',
    pending: 0,
    completed: 0,
    total: 0
  });

  // Count tasks by assignee
  tasks.forEach((task: Task) => {
    const assignee = task.assignedTo || 'unassigned';
    
    if (!workloadMap.has(assignee)) {
      workloadMap.set(assignee, {
        assignee: assignee === 'unassigned' ? 'Unassigned' : assignee,
        pending: 0,
        completed: 0,
        total: 0
      });
    }

    const entry = workloadMap.get(assignee)!;
    
    if (task.status === 'completed') {
      entry.completed++;
    } else {
      entry.pending++;
    }
    
    entry.total++;
    workloadMap.set(assignee, entry);
  });

  // Convert to array for chart
  return Array.from(workloadMap.values())
    .sort((a, b) => b.total - a.total);
};

/**
 * Interface for assignee stats
 */
export interface AssigneeStats {
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  blocked: number;
  completionRate: number;
}

/**
 * Calculate task assignment metrics by assignee
 * @param tasks List of tasks
 * @returns Array of assignee stats
 */
export const getAssigneeStats = (tasks: Task[]): AssigneeStats[] => {
  const assigneeMap = new Map<string, AssigneeStats>();
  
  // Process each task
  tasks.forEach((task: Task) => {
    const assignee = task.assignedTo || 'Unassigned';
    
    if (!assigneeMap.has(assignee)) {
      assigneeMap.set(assignee, {
        name: assignee,
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        blocked: 0,
        completionRate: 0
      });
    }
    
    const stats = assigneeMap.get(assignee)!;
    
    // Update counters
    stats.total++;
    
    if (task.status === 'completed') {
      stats.completed++;
    } else if (task.status === 'in_progress') {
      stats.inProgress++;
    } else if (task.status === 'not_started') {
      stats.notStarted++;
    } else if (task.status === 'blocked') {
      stats.blocked++;
    }
    
    // Calculate completion rate
    stats.completionRate = stats.total > 0 
      ? (stats.completed / stats.total) * 100 
      : 0;
    
    assigneeMap.set(assignee, stats);
  });
  
  // Sort by total tasks descending
  return Array.from(assigneeMap.values())
    .sort((a, b) => b.total - a.total);
};

/**
 * Generate task completion history data for reporting
 * @param tasks List of tasks
 * @param period Number of periods to include
 * @param interval 'day' | 'week' | 'month' for interval grouping
 * @returns Object with dates and completion counts for each period
 */
export const getTaskCompletionHistory = (
  tasks: Task[],
  period: number = 12,
  interval: 'day' | 'week' | 'month' = 'week'
): { dates: string[], completed: number[], created: number[] } => {
  const now = new Date();
  const dates: string[] = [];
  const completed: number[] = [];
  const created: number[] = [];
  
  // Generate date periods working backwards from now
  for (let i = period - 1; i >= 0; i--) {
    const currentDate = new Date(now);
    
    // Adjust date based on interval
    if (interval === 'day') {
      currentDate.setDate(currentDate.getDate() - i);
      dates.push(currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
    } else if (interval === 'week') {
      currentDate.setDate(currentDate.getDate() - (i * 7));
      const endOfWeek = new Date(currentDate);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      dates.push(`${currentDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`);
    } else if (interval === 'month') {
      currentDate.setMonth(currentDate.getMonth() - i);
      dates.push(currentDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short' }));
    }
    
    // Calculate period range
    let startOfPeriod: Date;
    let endOfPeriod: Date;
    
    if (interval === 'day') {
      startOfPeriod = new Date(currentDate.setHours(0, 0, 0, 0));
      endOfPeriod = new Date(currentDate.setHours(23, 59, 59, 999));
    } else if (interval === 'week') {
      // Start of week (current date - day of week)
      const dayOfWeek = currentDate.getDay();
      startOfPeriod = new Date(currentDate);
      startOfPeriod.setDate(startOfPeriod.getDate() - dayOfWeek);
      startOfPeriod.setHours(0, 0, 0, 0);
      
      // End of week (start + 6 days)
      endOfPeriod = new Date(startOfPeriod);
      endOfPeriod.setDate(endOfPeriod.getDate() + 6);
      endOfPeriod.setHours(23, 59, 59, 999);
    } else {
      // Start of month
      startOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1, 0, 0, 0, 0);
      // End of month
      endOfPeriod = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    // Count tasks created and completed in this period
    let completedCount = 0;
    let createdCount = 0;
    
    tasks.forEach(task => {
      // Check if task was completed in this period
      if (task.completedAt) {
        const completedDate = new Date(task.completedAt);
        if (completedDate >= startOfPeriod && completedDate <= endOfPeriod) {
          completedCount++;
        }
      }
      
      // Check if task was created in this period
      const createdDate = new Date(task.createdAt);
      if (createdDate >= startOfPeriod && createdDate <= endOfPeriod) {
        createdCount++;
      }
    });
    
    completed.push(completedCount);
    created.push(createdCount);
  }
  
  return { dates, completed, created };
}; 