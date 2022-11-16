import { Given } from "@badeball/cypress-cucumber-preprocessor/methods";
import { E2eWallet } from "../tests/wallet.e2e";
import { E2eApi } from "./api.e2e";
import { E2eNavigation } from "./navigate";

export class E2eSeeds {
  /** prevent direct setting of this currentSeed */
  public static currentSeed: any;
  public static currentSeedId: string;
  public static seedMap = new Map();

  public static setSeed(seed): void {
    this.currentSeed = seed;
    this.currentSeedId = seed.address;
  }
}

Given("1 seed", () => {
  return cy.then(() => {
    return E2eApi.createSeed().then((response) => {
      const newSeedId = response.newSeed;
      /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 21 ~ newSeedId', newSeedId)
      E2eSeeds.currentSeedId = newSeedId;
    });
  });
});

Given("I'm the Admin of the Seed", () => {
  E2eNavigation.hasAppLoaded().then(() => {
    cy.waitUntil(() => !!Cypress.SeedService);
    cy.wait(0).then(async () => {
      // 1. Get seed
      await Cypress.SeedService.ensureAllSeedsInitialized();
      const firstSeed = Cypress.SeedService.seedsArray[0];
      // 2. get seed admin address
      const adminAddress = firstSeed.admin;

      E2eWallet.currentWalletAddress = adminAddress;
      E2eSeeds.setSeed(firstSeed);
    });
  });
});

Given("the Seed has 2 Classes", () => {
  return cy.then(() => {
    const seedId = E2eSeeds.currentSeedId;
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 49 ~ seedId', seedId)
    return E2eApi.addClassToSeed(seedId).then((response) => {
      /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 48 ~ response', response)
      return true
    });
  });
});
// Given("the Seed has 1 contributor class", () => {});
