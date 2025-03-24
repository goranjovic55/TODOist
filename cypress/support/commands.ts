// ***********************************************
// This file can be used to create various
// custom commands and overwrite existing ones.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Add Cypress types
/// <reference types="cypress" />

// Login command for authentication
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

// Command to open the Kanban board
Cypress.Commands.add('openKanbanBoard', () => {
  cy.visit('/dashboard');
  cy.get('[data-testid="kanban-tab"]').click();
  cy.get('[data-testid="kanban-board"]').should('be.visible');
});

// Command to drag and drop a task
Cypress.Commands.add('dragAndDrop', (source: string, target: string) => {
  cy.get(`[data-testid="${source}"]`)
    .trigger('mousedown', { which: 1 })
    .trigger('mousemove', { clientX: 100, clientY: 100 })
    .trigger('mouseup');
  
  cy.get(`[data-testid="${target}"]`)
    .trigger('mousemove')
    .trigger('mouseup');
});

// Declare namespace for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login to the application
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<Element>
      
      /**
       * Custom command to open the Kanban board
       * @example cy.openKanbanBoard()
       */
      openKanbanBoard(): Chainable<Element>
      
      /**
       * Custom command to drag and drop elements
       * @example cy.dragAndDrop('task-1', 'column-2')
       */
      dragAndDrop(source: string, target: string): Chainable<Element>
    }
  }
} 