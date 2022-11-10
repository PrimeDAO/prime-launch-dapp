import { When } from "@badeball/cypress-cucumber-preprocessor/methods";

When("DEV I pause", () => {
  cy.pause();
});
