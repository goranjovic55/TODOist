// Task status types
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';

// Task priority types
export type TaskPriority = 'low' | 'medium' | 'high';

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  startDate?: string;
  endDate?: string;
  parentId?: string;
  projectId?: string;
  groupId?: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
}

// Productivity by day of week
export interface DayProductivity {
  day: string;
  count: number;
}

// Project stats interface
export interface ProjectStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  highPriorityCount: number;
  tagsCount: number;
}

// Status counts interface
export interface StatusCounts {
  not_started: number;
  in_progress: number;
  completed: number;
  blocked: number;
  total: number;
  completion_rate: number;
}

// Due date counts interface
export interface DueDateCounts {
  dueTodayCount: number;
  overdueCount: number;
}

// Workload distribution by assignee
export interface WorkloadItem {
  assignee: string;
  pending: number;
  completed: number;
  total: number;
} 