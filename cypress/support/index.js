// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
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
// require('./commands');

Cypress.on('uncaught:exception', (err, runnable) => {
  /** When returning an object in cy.intercept, this error comes up. */
  if (typeof (error) === "string" && err.includes("> Unexpected token ':'")) return false;

  // returning false here prevents Cypress from
  // failing the test
  return false
})

// Hide fetch/XHR requests
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const hideStyles = app.document.createElement('style');
  hideStyles.innerHTML = `
    /** Hide URLs */
    .command-name-request,
    .command-name-new-url,
    .command-name-xhr {
      display: none;
    };

    /** Highlight steps */
    .command-name-step {
      color: red !important;
    }
  `
  hideStyles.setAttribute('data-hide-command-log-request', '');

  app.document.head.appendChild(hideStyles);

  const style = app.document.createElement('style');
  style.innerHTML = `
    /** Highlight steps */
    .command-name-step .command-method span {
      color: #f280ff !important;
      font-size: 16px;
    }
    .command-name-step .command-message .command-message-text {
      font-size: 14px;
      font-weight: 900;
    }
  `
  app.document.head.appendChild(style);

}
