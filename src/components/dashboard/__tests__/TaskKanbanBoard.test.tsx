import React from 'react';
import { screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskKanbanBoard from '../TaskKanbanBoard';
import { renderWithProvider, mockTasks, mockDispatch, createMockStore, mockDragDrop } from './helpers/test-utils';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children, onDragEnd }: any) => {
    const handleDragEnd = (result: any) => {
      if (onDragEnd) {
        onDragEnd(result);
      }
    };
    
    return (
      <div data-testid="drag-context">
        {children}
        <button 
          data-testid="trigger-drag-end" 
          onClick={() => handleDragEnd(mockDragDrop('col-1', 'col-2', 'task-1'))}
        >
          Trigger Drag
        </button>
      </div>
    );
  },
  Droppable: ({ children, droppableId }: any) => (
    <div data-testid={`droppable-${droppableId}`}>
      {children({
        innerRef: () => {},
        droppableProps: {},
        placeholder: null,
      }, { isDraggingOver: false })}
    </div>
  ),
  Draggable: ({ children, draggableId }: any) => (
    <div data-testid={`draggable-${draggableId}`}>
      {children({
        innerRef: () => {},
        draggableProps: {},
        dragHandleProps: {},
      }, { isDragging: false })}
    </div>
  ),
}));

describe('TaskKanbanBoard', () => {
  beforeEach(() => {
    // Clear mock dispatch before each test
    mockDispatch.mockClear();
  });

  // Basic Rendering Tests
  
  test('renders the board title', () => {
    renderWithProvider(<TaskKanbanBoard />);
    expect(screen.getByText('Kanban Board')).toBeInTheDocument();
  });
  
  test('renders all initial columns', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
  
  test('renders the Add Column button', () => {
    renderWithProvider(<TaskKanbanBoard />);
    expect(screen.getByText('Add Column')).toBeInTheDocument();
  });

  // Column Management Tests
  
  test('opens column dialog when Add Column button is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    fireEvent.click(screen.getByText('Add Column'));
    expect(screen.getByText('Add New Column')).toBeInTheDocument();
  });
  
  test('closes column dialog when Cancel button is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Open dialog
    fireEvent.click(screen.getByText('Add Column'));
    expect(screen.getByText('Add New Column')).toBeInTheDocument();
    
    // Close dialog
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Add New Column')).not.toBeInTheDocument();
  });
  
  test('saves new column when form is filled and Save is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Open dialog
    fireEvent.click(screen.getByText('Add Column'));
    
    // Fill form
    const titleInput = screen.getByLabelText('Column Title');
    fireEvent.change(titleInput, { target: { value: 'New Test Column' } });
    
    // Save
    fireEvent.click(screen.getByText('Save'));
    
    // Check if new column appears
    expect(screen.getByText('New Test Column')).toBeInTheDocument();
  });

  // Filter Tests
  
  test('opens filter menu when Filter button is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    fireEvent.click(screen.getByText('Filter'));
    expect(screen.getByText('Filter Tasks')).toBeInTheDocument();
  });
  
  test('applies high priority filter when selected', async () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Open filter menu
    fireEvent.click(screen.getByText('Filter'));
    
    // Click high priority filter
    fireEvent.click(screen.getByText('High Priority'));
    
    // Check if only high priority task is visible
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
  });
  
  test('clears filters when Clear All Filters is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Open filter menu and apply filter
    fireEvent.click(screen.getByText('Filter'));
    fireEvent.click(screen.getByText('High Priority'));
    
    // Open filter menu again and clear filters
    fireEvent.click(screen.getByText('Filter'));
    fireEvent.click(screen.getByText('Clear All Filters'));
    
    // Check if all tasks are visible again
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  // Task Detail Tests
  
  test('opens task details dialog when view button is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Find and click the view button for Task 1
    const viewButtons = screen.getAllByTestId('view-task-button');
    fireEvent.click(viewButtons[0]);
    
    // Check if task details dialog is open
    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 1 description')).toBeInTheDocument();
  });
  
  test('closes task details dialog when Close button is clicked', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Open task details
    const viewButtons = screen.getAllByTestId('view-task-button');
    fireEvent.click(viewButtons[0]);
    
    // Close dialog
    fireEvent.click(screen.getByText('Close'));
    
    // Check if dialog is closed
    expect(screen.queryByText('Task Details')).not.toBeInTheDocument();
  });

  // Drag and Drop Tests
  
  test('updates task status when dragged to a different column', () => {
    renderWithProvider(<TaskKanbanBoard />);
    
    // Trigger mock drag end event
    fireEvent.click(screen.getByTestId('trigger-drag-end'));
    
    // Check if the task moved to the appropriate column
    const inProgressColumn = screen.getByTestId('droppable-col-2');
    expect(within(inProgressColumn).getByText('Task 1')).toBeInTheDocument();
  });

  // Edge Cases
  
  test('renders empty state properly when no tasks are available', () => {
    // Create store with empty tasks array
    const emptyStore = createMockStore([]);
    
    renderWithProvider(<TaskKanbanBoard />, { store: emptyStore });
    
    // Check that columns are still rendered
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
    
    // No tasks should be rendered
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Task 3')).not.toBeInTheDocument();
  });
}); 