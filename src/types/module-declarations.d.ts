// React module declaration
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

// React Redux module declaration
declare module 'react-redux' {
  import * as ReactRedux from 'react-redux';
  export = ReactRedux;
  export as namespace ReactRedux;
}

// Redux Toolkit module declaration
declare module '@reduxjs/toolkit' {
  import * as ReduxToolkit from '@reduxjs/toolkit';
  export = ReduxToolkit;
  export as namespace ReduxToolkit;
}

// Material UI module declarations
declare module '@mui/material' {
  import * as MaterialUI from '@mui/material';
  export = MaterialUI;
  export as namespace MaterialUI;
}

declare module '@mui/icons-material' {
  import * as MaterialIcons from '@mui/icons-material';
  export = MaterialIcons;
  export as namespace MaterialIcons;
}

// React Beautiful DnD module declaration
declare module 'react-beautiful-dnd' {
  import * as ReactBeautifulDnd from 'react-beautiful-dnd';
  export = ReactBeautifulDnd;
  export as namespace ReactBeautifulDnd;
}

// Testing Library module declaration
declare module '@testing-library/react' {
  import * as TestingLibrary from '@testing-library/react';
  export = TestingLibrary;
  export as namespace TestingLibrary;
  
  export interface RenderOptions {
    container?: HTMLElement;
    baseElement?: HTMLElement;
    hydrate?: boolean;
    wrapper?: React.ComponentType<{children: React.ReactNode}>;
    queries?: any;
  }
  
  export interface RenderResult {
    container: HTMLElement;
    baseElement: HTMLElement;
    debug: (baseElement?: HTMLElement | DocumentFragment) => void;
    rerender: (ui: React.ReactElement) => void;
    unmount: () => boolean;
    asFragment: () => DocumentFragment;
    findByLabelText: any;
    findAllByLabelText: any;
    findByPlaceholderText: any;
    findAllByPlaceholderText: any;
    findByText: any;
    findAllByText: any;
    findByAltText: any;
    findAllByAltText: any;
    findByTitle: any;
    findAllByTitle: any;
    findByDisplayValue: any;
    findAllByDisplayValue: any;
    findByRole: any;
    findAllByRole: any;
    findByTestId: any;
    findAllByTestId: any;
    getByLabelText: any;
    getAllByLabelText: any;
    getByPlaceholderText: any;
    getAllByPlaceholderText: any;
    getByText: any;
    getAllByText: any;
    getByAltText: any;
    getAllByAltText: any;
    getByTitle: any;
    getAllByTitle: any;
    getByDisplayValue: any;
    getAllByDisplayValue: any;
    getByRole: any;
    getAllByRole: any;
    getByTestId: any;
    getAllByTestId: any;
    queryByLabelText: any;
    queryAllByLabelText: any;
    queryByPlaceholderText: any;
    queryAllByPlaceholderText: any;
    queryByText: any;
    queryAllByText: any;
    queryByAltText: any;
    queryAllByAltText: any;
    queryByTitle: any;
    queryAllByTitle: any;
    queryByDisplayValue: any;
    queryAllByDisplayValue: any;
    queryByRole: any;
    queryAllByRole: any;
    queryByTestId: any;
    queryAllByTestId: any;
  }
}

declare module '@testing-library/jest-dom' {
  import * as JestDom from '@testing-library/jest-dom';
  export = JestDom;
  export as namespace JestDom;
}

// Date-fns module declaration
declare module 'date-fns' {
  import * as DateFns from 'date-fns';
  export = DateFns;
  export as namespace DateFns;
} 