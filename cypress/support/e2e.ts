// ***********************************************************
// This file is processed and loaded automatically before
// your test files.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
const app = window.top;
if (app) {
  const log = app.console.log;
  app.console.log = (...args) => {
    if (args.length && typeof args[0] === 'string' && args[0].includes('XHR')) {
      return;
    }
    log(...args);
  };
}

Cypress.on('uncaught:exception', (err) => {
  // returning false here prevents Cypress from failing the test
  // useful for handling errors from third-party libraries
  return false;
}); 