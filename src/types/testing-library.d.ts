// Type definitions for Testing Library
declare module '@testing-library/react' {
  export function render(
    ui: React.ReactElement,
    options?: any
  ): any;

  export const screen: {
    getByText: (text: string, options?: any) => HTMLElement;
    queryByText: (text: string, options?: any) => HTMLElement | null;
    getByTestId: (testId: string, options?: any) => HTMLElement;
    queryByTestId: (testId: string, options?: any) => HTMLElement | null;
    getByRole: (role: string, options?: any) => HTMLElement;
    queryByRole: (role: string, options?: any) => HTMLElement | null;
  };

  export const fireEvent: {
    click: (element: HTMLElement) => boolean;
    change: (element: HTMLElement, options?: any) => boolean;
  };

  export function within(element: HTMLElement): typeof screen;
}

declare module '@testing-library/jest-dom' {
  // This just imports the library, no need to define specific methods
}

declare module 'react-beautiful-dnd' {
  export const DragDropContext: React.ComponentType<any>;
  export const Droppable: React.ComponentType<any>;
  export const Draggable: React.ComponentType<any>;
} 