// jest-dom adds custom jest matchers for asserting on DOM nodes.
// It allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
import '@testing-library/jest-dom';

// Create simplified mocks for react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => {
  return {
    DragDropContext: jest.fn().mockImplementation(({ children }) => children),
    Droppable: jest.fn().mockImplementation(({ children }) => 
      children({
        innerRef: jest.fn(),
        droppableProps: {},
        placeholder: null
      }, { isDraggingOver: false })
    ),
    Draggable: jest.fn().mockImplementation(({ children }) => 
      children({
        innerRef: jest.fn(),
        draggableProps: {},
        dragHandleProps: {}
      }, { isDragging: false })
    )
  };
}); 