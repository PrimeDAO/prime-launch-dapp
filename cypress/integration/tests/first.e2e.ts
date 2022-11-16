import { Given, Then } from "@badeball/cypress-cucumber-preprocessor/methods";

// import type { SeedService } from "../../../src/services/SeedService"
// import type { Seed } from "../../../src/entities/Seed"

declare global {
  namespace Cypress {
    interface Cypress {
      // SeedService: SeedService;
      SeedService: any;
    }
  }
}

Given("network testing", () => {});

Then("I can view all my Seeds", () => {
  // Cypress.SeedService;
  // cy.wait(1000).then(() => {
  //   /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: first.e2e.ts ~ line 15 ~ Cypress.SeedService;', Cypress.SeedService)
  //   const seeds = Cypress.SeedService.seeds;
  //   /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: first.e2e.ts ~ line 19 ~ seeds', seeds)
  // })
});
