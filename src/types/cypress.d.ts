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