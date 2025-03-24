import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskKanbanBoard from '../TaskKanbanBoard';
import { renderWithProvider, mockTasks, createMockStore } from './helpers/test-utils';
import { mockTaskService } from './helpers/mockServices';

// Mock the API service
jest.mock('../../../services/taskService', () => ({
  __esModule: true,
  default: mockTaskService
}));

describe('TaskKanbanBoard API Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('fetches tasks from API on initial load', async () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Wait for tasks to be loaded
    await waitFor(() => {
      expect(mockTaskService.getAllTasks).toHaveBeenCalledTimes(1);
    });
    
    // Check if tasks are rendered
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });
  
  test('updates task status via API when dragged to different column', async () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Wait for tasks to be loaded
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Simulate drag and drop
    fireEvent.click(screen.getByTestId('trigger-drag-end'));
    
    // Check if API was called to update the task
    await waitFor(() => {
      expect(mockTaskService.moveTask).toHaveBeenCalledWith(
        'task-1',
        'in_progress',
        expect.any(Number)
      );
    });
  });
  
  test('creates a new column and persists it via API', async () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Open column dialog
    fireEvent.click(screen.getByText('Add Column'));
    
    // Fill form
    const titleInput = screen.getByLabelText('Column Title');
    fireEvent.change(titleInput, { target: { value: 'API Test Column' } });
    
    // Save
    fireEvent.click(screen.getByText('Save'));
    
    // Check if column was added to UI
    expect(screen.getByText('API Test Column')).toBeInTheDocument();
    
    // Verify API was called to persist the column
    await waitFor(() => {
      expect(mockTaskService.updateTask).toHaveBeenCalled();
    });
  });
  
  test('applies filters and calls API with filter parameters', async () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Open filter menu
    fireEvent.click(screen.getByText('Filter'));
    
    // Apply high priority filter
    fireEvent.click(screen.getByText('High Priority'));
    
    // Check if API was called with correct filters
    await waitFor(() => {
      expect(mockTaskService.getFilteredTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'high'
        })
      );
    });
    
    // Check if only high priority task is visible
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
  });
  
  test('opens task details and loads additional task data from API', async () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Wait for tasks to be loaded
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Find and click view button for Task 1
    const viewButtons = screen.getAllByTestId('view-task-button');
    fireEvent.click(viewButtons[0]);
    
    // Check if API was called to get detailed task info
    await waitFor(() => {
      expect(mockTaskService.getTaskById).toHaveBeenCalledWith('task-1');
    });
    
    // Verify task details are shown
    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 1 description')).toBeInTheDocument();
  });
  
  test('handles API error gracefully when loading tasks', async () => {
    // Mock API failure
    mockTaskService.getAllTasks.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithProvider(<TaskKanbanBoard />);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText('Error loading tasks. Please try again.')).toBeInTheDocument();
    });
    
    // Verify retry button exists
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    // Reset mock to return success on retry
    mockTaskService.getAllTasks.mockResolvedValueOnce(mockTasks);
    
    // Click retry
    fireEvent.click(retryButton);
    
    // Verify tasks load on retry
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
  });
  
  test('handles API rate limiting by implementing retry with backoff', async () => {
    // Mock API rate limit error first, then success
    mockTaskService.getAllTasks
      .mockRejectedValueOnce({ status: 429, message: 'Too Many Requests' })
      .mockResolvedValueOnce(mockTasks);
    
    // Mock timer for testing backoff
    jest.useFakeTimers();
    
    renderWithProvider(<TaskKanbanBoard />);
    
    // Check for rate limit message
    await waitFor(() => {
      expect(screen.getByText('Rate limited. Retrying in a few seconds...')).toBeInTheDocument();
    });
    
    // Fast-forward timers to simulate backoff
    jest.advanceTimersByTime(3000);
    
    // Verify tasks load after backoff
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Restore real timers
    jest.useRealTimers();
  });
}); 