# CI and End-to-End Testing Setup Guide

This document outlines how the continuous integration (CI) and end-to-end (E2E) testing is configured for the TODOist application.

## Table of Contents

- [CI Pipeline Overview](#ci-pipeline-overview)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Cypress E2E Testing](#cypress-e2e-testing)
- [Test Coverage](#test-coverage)
- [Troubleshooting](#troubleshooting)

## CI Pipeline Overview

The TODOist application uses a comprehensive CI pipeline to ensure code quality and prevent regressions. The pipeline consists of three main stages:

1. **Unit Tests**: Run Jest tests and collect coverage
2. **End-to-End Tests**: Run Cypress to test the complete application
3. **Deploy Preview**: Create a preview deployment for pull requests

The pipeline runs on every push to the `main` and `develop` branches, as well as on all pull requests to these branches.

## GitHub Actions Workflow

The workflow is defined in `.github/workflows/test.yml` and includes the following jobs:

### Unit Tests Job

```yaml
unit-tests:
  runs-on: ubuntu-latest
  
  steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run linting
      run: npm run lint
      
    - name: Run unit tests
      run: npm test -- --coverage
      
    - name: Upload unit test coverage
      uses: actions/upload-artifact@v3
      with:
        name: unit-test-coverage
        path: coverage/
```

### E2E Tests Job

```yaml
e2e-tests:
  runs-on: ubuntu-latest
  needs: unit-tests
  
  steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '16'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Build app
      run: npm run build
      
    - name: Cypress run
      uses: cypress-io/github-action@v5
      with:
        start: npm run start
        wait-on: 'http://localhost:3000'
        wait-on-timeout: 120
        browser: chrome
        record: false
```

### Deploy Preview Job

```yaml
deploy-preview:
  runs-on: ubuntu-latest
  needs: [unit-tests, e2e-tests]
  if: github.event_name == 'pull_request'
  
  steps:
    # Deployment steps...
    
    - name: Comment on PR
      uses: actions/github-script@v6
      with:
        github-token: ${{ secrets.GITHUB_TOKEN }}
        script: |
          const { issue: { number: issue_number }, repo: { owner, repo } } = context;
          github.rest.issues.createComment({
            owner,
            repo,
            issue_number,
            body: '🚀 Preview deployment is ready!'
          });
```

## Cypress E2E Testing

Cypress is configured to run end-to-end tests that validate the entire application from a user's perspective.

### Cypress Directory Structure

```
cypress/
  e2e/                  # End-to-end test files
    kanban-board.cy.ts  # Tests for Kanban Board
  fixtures/             # Test data files
  support/              # Support files
    commands.ts         # Custom commands
    e2e.ts              # Common test setup
```

### Custom Commands

We've created several custom Cypress commands to simplify testing:

- `cy.login(email, password)`: Login to the application
- `cy.openKanbanBoard()`: Navigate to the Kanban Board
- `cy.dragAndDrop(source, target)`: Drag and drop tasks between columns

### Example E2E Test

```typescript
describe('Kanban Board', () => {
  beforeEach(() => {
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
});
```

### Handling React DnD

Since Cypress has limitations with React-DnD, we use two approaches:

1. **Custom Drag and Drop Command**: Simulates drag and drop using mouse events
2. **Redux Action Dispatch**: Directly triggers the Redux actions that update the state

```typescript
// Option 1: Using custom command
cy.dragAndDrop('task-card-1', 'column-in-progress');

// Option 2: Direct Redux state update
cy.window().then((win) => {
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
```

## Test Coverage

We track test coverage using Jest's built-in coverage reporter, which generates HTML reports in the `coverage/` directory. The CI pipeline uploads these reports as artifacts.

### Coverage Targets

We aim for the following coverage targets:

- **Unit Tests**: 80% line coverage
- **Component Tests**: 80% component coverage
- **E2E Tests**: Cover all critical user flows

## Troubleshooting

### Common CI Issues

1. **Tests Failing in CI but Passing Locally**
   - Check for environment-specific issues
   - Verify that all dependencies are properly installed
   - Look for race conditions or timing issues

2. **Cypress Test Timeouts**
   - Increase the timeout in the Cypress configuration
   - Add more explicit waits for dynamic elements
   - Check for performance issues in the application

3. **Missing Test Coverage**
   - Identify untested components and functionality
   - Add tests for edge cases and error scenarios
   - Ensure all user flows are covered by E2E tests

### Getting Help

If you encounter issues with the CI pipeline or testing setup, contact the development team or consult the following resources:

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cypress Documentation](https://docs.cypress.io/)
- [Jest Documentation](https://jestjs.io/docs/getting-started) 