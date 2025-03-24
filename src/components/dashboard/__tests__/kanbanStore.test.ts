import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, { 
  addTask, 
  updateTask, 
  deleteTask, 
  moveTask, 
  fetchTasks,
  setFilter
} from '../../../store/slices/taskSlice';
import { mockTasks } from './helpers/test-utils';

// Mock API service
jest.mock('../../../services/taskService', () => ({
  getAllTasks: jest.fn().mockResolvedValue([]),
  updateTask: jest.fn().mockImplementation((id, updates) => Promise.resolve({ id, ...updates })),
  moveTask: jest.fn().mockImplementation((id, status) => Promise.resolve({ id, status }))
}));

const createTestStore = (preloadedState = {}) => {
  return configureStore({
    reducer: {
      tasks: tasksReducer
    },
    preloadedState
  });
};

describe('Kanban Redux Store', () => {
  let store: ReturnType<typeof createTestStore>;
  
  beforeEach(() => {
    store = createTestStore();
  });
  
  describe('Task Actions', () => {
    test('addTask should add a new task to the store', () => {
      const newTask = {
        id: 'new-task',
        title: 'New Task',
        description: 'New task description',
        status: 'not_started',
        priority: 'medium',
        endDate: null,
        assignedTo: null,
        tags: []
      };
      
      store.dispatch(addTask(newTask));
      
      const state = store.getState();
      expect(state.tasks.tasks).toContainEqual(newTask);
    });
    
    test('updateTask should update an existing task', () => {
      // Add a task first
      const task = {
        id: 'task-to-update',
        title: 'Original Title',
        description: 'Original description',
        status: 'not_started',
        priority: 'low',
        endDate: null,
        assignedTo: null,
        tags: []
      };
      
      store.dispatch(addTask(task));
      
      // Now update it
      const updates = {
        id: 'task-to-update',
        title: 'Updated Title',
        priority: 'high'
      };
      
      store.dispatch(updateTask(updates));
      
      const state = store.getState();
      const updatedTask = state.tasks.tasks.find(t => t.id === 'task-to-update');
      
      expect(updatedTask).toEqual({
        ...task,
        ...updates
      });
    });
    
    test('deleteTask should remove a task from the store', () => {
      // Add tasks
      mockTasks.forEach(task => {
        store.dispatch(addTask(task));
      });
      
      // Delete one
      store.dispatch(deleteTask('task-1'));
      
      const state = store.getState();
      
      expect(state.tasks.tasks).not.toContainEqual(
        expect.objectContaining({ id: 'task-1' })
      );
      expect(state.tasks.tasks.length).toBe(mockTasks.length - 1);
    });
    
    test('moveTask should update task status', () => {
      // Add a task
      const task = mockTasks[0];
      store.dispatch(addTask(task));
      
      // Move it to a different status
      store.dispatch(moveTask({ 
        taskId: task.id, 
        newStatus: 'in_progress',
        newPosition: 0
      }));
      
      const state = store.getState();
      const movedTask = state.tasks.tasks.find(t => t.id === task.id);
      
      expect(movedTask?.status).toBe('in_progress');
    });
    
    test('fetchTasks should populate the store with tasks', async () => {
      // Mock the API response
      require('../../../services/taskService').getAllTasks.mockResolvedValueOnce(mockTasks);
      
      // Dispatch the async thunk
      await store.dispatch(fetchTasks());
      
      const state = store.getState();
      
      expect(state.tasks.tasks).toEqual(mockTasks);
      expect(state.tasks.loading).toBe(false);
      expect(state.tasks.error).toBe(null);
    });
    
    test('fetchTasks should handle API errors', async () => {
      // Mock API error
      const errorMessage = 'Failed to fetch tasks';
      require('../../../services/taskService').getAllTasks.mockRejectedValueOnce(new Error(errorMessage));
      
      // Dispatch the async thunk
      await store.dispatch(fetchTasks());
      
      const state = store.getState();
      
      expect(state.tasks.tasks).toEqual([]);
      expect(state.tasks.loading).toBe(false);
      expect(state.tasks.error).toBe(errorMessage);
    });
  });
  
  describe('Filter Actions', () => {
    test('setFilter should update the active filters', () => {
      const filter = {
        status: 'in_progress',
        priority: 'high'
      };
      
      store.dispatch(setFilter(filter));
      
      const state = store.getState();
      
      expect(state.tasks.filters).toEqual(filter);
    });
    
    test('filtering should work with task display', () => {
      // Add tasks
      mockTasks.forEach(task => {
        store.dispatch(addTask(task));
      });
      
      // Set a filter
      store.dispatch(setFilter({ priority: 'high' }));
      
      const state = store.getState();
      
      // Get filtered tasks
      const filteredTasks = state.tasks.tasks.filter(task => 
        (!state.tasks.filters.status || task.status === state.tasks.filters.status) &&
        (!state.tasks.filters.priority || task.priority === state.tasks.filters.priority)
      );
      
      // Should only contain the high priority task
      expect(filteredTasks.length).toBe(1);
      expect(filteredTasks[0].priority).toBe('high');
    });
  });
  
  describe('Task State Selectors', () => {
    test('should select tasks by status', () => {
      // Add tasks
      mockTasks.forEach(task => {
        store.dispatch(addTask(task));
      });
      
      const state = store.getState();
      
      // Group tasks by status (simulating a selector)
      const tasksByStatus = {
        not_started: state.tasks.tasks.filter(task => task.status === 'not_started'),
        in_progress: state.tasks.tasks.filter(task => task.status === 'in_progress'),
        review: state.tasks.tasks.filter(task => task.status === 'review'),
        completed: state.tasks.tasks.filter(task => task.status === 'completed')
      };
      
      // Check correct grouping
      expect(tasksByStatus.not_started.length).toBe(1);
      expect(tasksByStatus.in_progress.length).toBe(1);
      expect(tasksByStatus.completed.length).toBe(1);
    });
  });
}); 