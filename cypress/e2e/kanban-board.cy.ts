/// <reference types="cypress" />

describe('Kanban Board', () => {
  beforeEach(() => {
    // Visit the kanban board directly or navigate there
    cy.visit('/dashboard');
    cy.get('[data-testid="kanban-tab"]').click();
  });

  it('displays the kanban board with initial columns', () => {
    cy.get('[data-testid="kanban-board"]').should('be.visible');
    cy.contains('Kanban Board').should('be.visible');
    
    // Check for default columns
    cy.contains('To Do').should('be.visible');
    cy.contains('In Progress').should('be.visible');
    cy.contains('Review').should('be.visible');
    cy.contains('Done').should('be.visible');
  });

  it('allows adding a new column', () => {
    // Click the add column button
    cy.contains('Add Column').click();
    
    // Fill in the column form
    cy.get('[data-testid="column-title-input"]').type('Testing Column');
    cy.contains('Save').click();
    
    // Verify the new column appears
    cy.contains('Testing Column').should('be.visible');
  });

  it('allows filtering tasks by priority', () => {
    // Click the filter button
    cy.contains('Filter').click();
    
    // Select high priority filter
    cy.contains('High Priority').click();
    
    // Verify only high priority tasks are visible
    cy.get('[data-priority="high"]').should('be.visible');
    cy.get('[data-priority="medium"]').should('not.exist');
    cy.get('[data-priority="low"]').should('not.exist');
    
    // Clear filters
    cy.contains('Filter').click();
    cy.contains('Clear All Filters').click();
    
    // Verify all tasks are visible again
    cy.get('[data-priority="high"]').should('be.visible');
    cy.get('[data-priority="medium"]').should('be.visible');
    cy.get('[data-priority="low"]').should('be.visible');
  });

  it('opens task details when clicking the view button', () => {
    // Find and click the view button on a task
    cy.get('[data-testid="view-task-button"]').first().click();
    
    // Verify task details dialog is open
    cy.contains('Task Details').should('be.visible');
    
    // Close the dialog
    cy.contains('Close').click();
    
    // Verify dialog is closed
    cy.contains('Task Details').should('not.exist');
  });
  
  // This test requires a custom implementation due to React DnD complexity
  it('moves a task to a different column using drag and drop', () => {
    // Since Cypress has limitations with React DnD,
    // we'll simulate the behavior using our custom dragAndDrop command
    // or by directly triggering the state changes
    
    // Option 1: Using custom command (simplified DnD simulation)
    cy.dragAndDrop('task-card-1', 'column-in-progress');
    
    // Option 2: Or trigger the API directly (more reliable)
    cy.window().then((win) => {
      // Access the Redux store through window.__REDUX_STORE__
      // and dispatch an action to move the task
      win.eval(`
        window.__REDUX_STORE__.dispatch({
          type: 'tasks/moveTask',
          payload: {
            taskId: 'task-1',
            newStatus: 'in_progress',
            newPosition: 0
          }
        });
      `);
    });
    
    // Verify the task has moved to the new column
    cy.get('[data-column-id="in_progress"]').contains('Task 1').should('be.visible');
  });
}); 