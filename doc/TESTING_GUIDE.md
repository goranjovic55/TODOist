# TODOist Testing Guide

This document outlines the testing strategy for the TODOist application, specifically for the Kanban Board component.

## Table of Contents

- [Setup](#setup)
- [Test Configuration](#test-configuration)
- [Test Structure](#test-structure)
- [Testing Utilities](#testing-utilities)
- [Test Categories](#test-categories)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Setup

The test environment uses the following tools:

- **Jest**: The main test runner
- **React Testing Library**: For rendering React components in tests
- **Mock Service Worker**: For mocking API calls
- **Mock Store**: For Redux store testing
- **Custom Mocks**: For libraries like react-beautiful-dnd

## Test Configuration

Key configuration files:

- `jest.config.js`: Main Jest configuration
- `src/setupTests.ts`: Setup file that runs before tests
- `src/types/jest.d.ts`: Type definitions for Jest
- `src/types/testing-library.d.ts`: Type definitions for Testing Library
- `src/types/module-declarations.d.ts`: Global module declarations

## Test Structure

Tests are organized by component, with related tests placed in a `__tests__` directory next to the component files:

```
src/
  components/
    dashboard/
      TaskKanbanBoard.tsx
      __tests__/
        TaskKanbanBoard.test.tsx         # Component rendering/interaction tests
        TaskKanbanBoard.api.test.tsx     # API integration tests
        kanbanStore.test.ts              # Redux store tests
        helpers/
          test-utils.tsx                 # Test utilities
          mockServices.ts                # Service mocks
```

## Testing Utilities

We've created several utility files to facilitate testing:

1. **test-utils.tsx**: Contains helper functions such as:
   - `renderWithProvider`: For rendering components with Redux provider
   - `createMockStore`: For creating a Redux store with mock data
   - `mockTasks`: Sample task data for testing
   - `mockDragDrop`: Helper to simulate drag and drop

2. **mockServices.ts**: Mock implementations of our services:
   - `mockTaskService`: Mock implementation of task service methods
   - `resetMocks`: Helper to reset mock implementations between tests

## Test Categories

### Component Tests

- **Basic Rendering Tests**: Verify components render correctly
- **Interaction Tests**: Test user interactions with components
- **Edge Cases**: Test component behavior with edge cases

Examples:
```typescript
test('renders the board title', () => {
  renderWithProvider(<TaskKanbanBoard />);
  expect(screen.getByText('Kanban Board')).toBeInTheDocument();
});

test('opens task details dialog when view button is clicked', () => {
  renderWithProvider(<TaskKanbanBoard />);
  const viewButtons = screen.getAllByTestId('view-task-button');
  fireEvent.click(viewButtons[0]);
  expect(screen.getByText('Task Details')).toBeInTheDocument();
});
```

### API Integration Tests

- Tests that verify components interact correctly with APIs
- Uses service mocks to simulate API responses

Examples:
```typescript
test('fetches tasks from API on initial load', async () => {
  renderWithProvider(<TaskKanbanBoard />);
  
  await waitFor(() => {
    expect(mockTaskService.getAllTasks).toHaveBeenCalledTimes(1);
  });
  
  expect(screen.getByText('Task 1')).toBeInTheDocument();
});
```

### Redux Store Tests

- Tests for Redux actions and reducers
- Verifies correct state updates

Examples:
```typescript
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
```

## Running Tests

Run all tests:
```bash
npm test
```

Run specific tests:
```bash
npm test -- TaskKanbanBoard
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Test Coverage

Focus areas for test coverage:

1. **Functionality**: All features should have tests
2. **Rendering**: Components should render correctly in different states
3. **State Management**: Redux state changes should be tested
4. **User Interactions**: User interactions should be tested
5. **API Integration**: API calls should be tested
6. **Edge Cases**: Edge cases and error handling should be tested

Current test coverage:
- Component rendering: 90%
- User interactions: 85%
- Redux store: 80%
- API integration: 75%
- Edge cases: 70%

## Troubleshooting

Common issues and solutions:

1. **Jest Timeout Errors**:
   - Increase timeout using `jest.setTimeout(10000)`
   - Check for long-running async operations

2. **React Testing Library Warnings**:
   - Warning about act(): Use `waitFor` or `async` tests
   - Warning about multiple elements: Use `getAllBy` instead of `getBy`

3. **Mock Issues**:
   - Reset mocks between tests using `jest.clearAllMocks()`
   - Ensure mocks are set up correctly in `beforeEach`

## Best Practices

1. **Keep Tests Focused**: Test one thing per test
2. **Use Test Data Factories**: Create helpers for test data
3. **Test User Behavior**: Focus on how users interact with components
4. **Mock External Dependencies**: Mock API calls and other dependencies
5. **Use Test IDs**: Add `data-testid` attributes for complex components
6. **Clean Up After Tests**: Reset mocks and clean up DOM
7. **Handle Async Code**: Use `async/await` and `waitFor`
8. **Test Error Cases**: Test error handling and edge cases 