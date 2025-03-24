// Mock for react-beautiful-dnd
module.exports = {
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