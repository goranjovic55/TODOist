# TypeScript Configuration for Testing

This document explains how the TypeScript configuration is set up to support various testing frameworks in the TODOist application.

## Table of Contents

- [Overview](#overview)
- [Jest Configuration](#jest-configuration)
- [Cypress Configuration](#cypress-configuration)
- [Type Definitions](#type-definitions)
- [Common TypeScript Errors](#common-typescript-errors)
- [Best Practices](#best-practices)

## Overview

The TODOist application uses TypeScript for type safety and maintainability. To ensure testing tools work correctly with TypeScript, we've implemented specific configurations for each testing framework.

## Jest Configuration

### tsconfig.json

The main `tsconfig.json` is configured to support Jest:

```json
{
  "compilerOptions": {
    // ... other options ...
    "typeRoots": ["./node_modules/@types", "./src/types"],
    "types": ["jest", "node"]
  },
  "include": ["src"]
}
```

### jest.config.js

Jest is configured to work with TypeScript:

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }]
  }
  // ... other options ...
};
```

### Type Definitions

In `src/types/jest.d.ts`:

```typescript
/// <reference types="jest" />

declare global {
  // Add missing Jest global functions
  const describe: jest.Describe;
  const test: jest.It;
  const it: jest.It;
  const expect: jest.Expect;
  const beforeEach: jest.Lifecycle;
  const afterEach: jest.Lifecycle;
  const beforeAll: jest.Lifecycle;
  const afterAll: jest.Lifecycle;
  const jest: typeof import('jest');
}

export {};
```

## Cypress Configuration

### cypress/tsconfig.json

A separate `tsconfig.json` for Cypress:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["es5", "dom"],
    "types": ["cypress", "node"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["**/*.ts", "../src/types/cypress.d.ts"]
}
```

### cypress.config.ts

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000',
    // ... other options ...
  },
  // ... other options ...
});
```

### Type Definitions

In `src/types/cypress.d.ts`:

```typescript
/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    // Custom commands we've added to Cypress
    login(email: string, password: string): Chainable<Element>
    openKanbanBoard(): Chainable<Element>
    dragAndDrop(source: string, target: string): Chainable<Element>
  }
}

// Add global Cypress object
declare const cy: Cypress.Chainable;
declare const Cypress: Cypress.Cypress;
```

### Window Extensions

In `src/types/window.d.ts`:

```typescript
interface Window {
  // Add custom properties to Window interface
  __REDUX_STORE__: any;
  
  // Fix property 'console' does not exist on type 'Window'
  console: Console;
  
  // Any other custom properties your app might add to the window object
  top: Window;
}
```

## Common TypeScript Errors

### Jest Errors

1. **Cannot find name 'describe', 'it', 'test', etc.**
   - Solution: Add Jest type definitions or use the global declarations in `jest.d.ts`

2. **Property 'toBeInTheDocument' does not exist on type 'Assertion'**
   - Solution: Import `@testing-library/jest-dom` in setup file

### Cypress Errors

1. **Cannot find name 'cy' or 'Cypress'**
   - Solution: Add Cypress type definitions or use the global declarations in `cypress.d.ts`

2. **Property 'console' does not exist on type 'Window'**
   - Solution: Use the window extensions in `window.d.ts`

3. **Cannot find module 'cypress'**
   - Solution: Add Cypress to types array in tsconfig.json

## Best Practices

1. **Keep Type Definitions Organized**
   - Place custom type definitions in the `src/types` directory
   - Use separate files for different concerns (Jest, Cypress, etc.)

2. **Use Triple-Slash Directives**
   - Include `/// <reference types="jest" />` or `/// <reference types="cypress" />` at the top of relevant files

3. **Custom Commands**
   - Always define TypeScript interfaces for custom commands
   - Document the expected behavior with JSDoc comments

4. **Window Extensions**
   - Extend the Window interface for any global objects your application uses

5. **Multiple tsconfig Files**
   - Use separate tsconfig files for different parts of your application
   - This helps avoid conflicts between different testing frameworks 