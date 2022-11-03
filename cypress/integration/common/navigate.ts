import { Given } from "@badeball/cypress-cucumber-preprocessor/methods";

Given("I navigate to the Deals home page", () => {
  cy.visit("/");
});
