import { mockTasks } from './test-utils';

export const mockTaskService = {
  getAllTasks: jest.fn().mockResolvedValue(mockTasks),
  getTaskById: jest.fn().mockImplementation((id: string) => {
    const task = mockTasks.find(task => task.id === id);
    return Promise.resolve(task || null);
  }),
  createTask: jest.fn().mockImplementation((taskData: any) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...taskData,
      createdAt: new Date().toISOString()
    };
    return Promise.resolve(newTask);
  }),
  updateTask: jest.fn().mockImplementation((id: string, updates: any) => {
    const task = mockTasks.find(task => task.id === id);
    if (!task) return Promise.resolve(null);
    
    const updatedTask = { ...task, ...updates };
    return Promise.resolve(updatedTask);
  }),
  deleteTask: jest.fn().mockImplementation((id: string) => {
    return Promise.resolve({ success: true });
  }),
  moveTask: jest.fn().mockImplementation((taskId: string, newStatus: string, newPosition: number) => {
    const task = mockTasks.find(task => task.id === taskId);
    if (!task) return Promise.resolve(null);
    
    const updatedTask = { ...task, status: newStatus };
    return Promise.resolve(updatedTask);
  }),
  bulkUpdateTasks: jest.fn().mockImplementation((tasks: any[]) => {
    return Promise.resolve(tasks.map(task => ({ ...task, updatedAt: new Date().toISOString() })));
  }),
  getFilteredTasks: jest.fn().mockImplementation((filters: any) => {
    let filteredTasks = [...mockTasks];
    
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }
    
    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters.tags && filters.tags.length) {
      filteredTasks = filteredTasks.filter(task => 
        task.tags.some(tag => filters.tags.includes(tag))
      );
    }
    
    if (filters.assignedTo) {
      filteredTasks = filteredTasks.filter(task => task.assignedTo === filters.assignedTo);
    }
    
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(term) || 
        task.description.toLowerCase().includes(term)
      );
    }
    
    return Promise.resolve(filteredTasks);
  })
};

export const resetMocks = () => {
  // Clear all mock implementations and reset call history
  Object.values(mockTaskService).forEach((mockFn) => {
    if (typeof mockFn === 'function') {
      mockFn.mockClear();
    }
  });
}; 