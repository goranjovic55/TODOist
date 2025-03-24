import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, EnhancedStore } from '@reduxjs/toolkit';

// Create a type for the task object to avoid 'any' types
export interface TestTask {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  endDate: string | null;
  assignedTo: string | null;
  tags: string[];
}

// Sample tasks for testing
export const mockTasks: TestTask[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Task 1 description',
    status: 'not_started',
    priority: 'medium',
    endDate: new Date().toISOString(),
    assignedTo: 'John',
    tags: ['frontend', 'bug']
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Task 2 description',
    status: 'in_progress',
    priority: 'high',
    endDate: new Date().toISOString(),
    assignedTo: 'Sarah',
    tags: ['backend']
  },
  {
    id: 'task-3',
    title: 'Task 3',
    description: 'Task 3 description',
    status: 'completed',
    priority: 'low',
    endDate: null,
    assignedTo: null,
    tags: []
  }
];

// Mock dispatch for testing Redux actions
export const mockDispatch = jest.fn();

interface MockStoreOptions {
  preloadedState?: Record<string, any>;
  middleware?: any[];
}

// Create a mock store with optional custom tasks
export const createMockStore = (customTasks = mockTasks, options: MockStoreOptions = {}): EnhancedStore => {
  const { preloadedState, middleware = [] } = options;
  
  return configureStore({
    reducer: {
      tasks: () => ({ tasks: customTasks })
    },
    preloadedState,
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware().concat([
        ...middleware,
        () => (next) => (action) => {
          mockDispatch(action);
          return next(action);
        }
      ])
  });
};

interface RenderWithProviderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: EnhancedStore;
}

// Helper function to render with Redux Provider
export const renderWithProvider = (
  ui: ReactElement,
  { store = createMockStore(), ...renderOptions }: RenderWithProviderOptions = {}
): RenderResult => {
  const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <Provider store={store}>{children}</Provider>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

interface DragDropResult {
  draggableId: string;
  source: {
    droppableId: string;
    index: number;
  };
  destination: {
    droppableId: string;
    index: number;
  };
}

// Helper function to create drag and drop result object
export const mockDragDrop = (
  sourceId: string, 
  destinationId: string, 
  draggableId: string,
  sourceIndex: number = 0,
  destinationIndex: number = 0
): DragDropResult => ({
  draggableId,
  source: {
    droppableId: sourceId,
    index: sourceIndex
  },
  destination: {
    droppableId: destinationId,
    index: destinationIndex
  }
}); 