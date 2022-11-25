import { Given } from "@badeball/cypress-cucumber-preprocessor/methods";
import {
  CLASS_1_WITH_ALLOWLISTED_ADDRESSES,
  CLASS_2_WITH_ALLOWLISTED_ADDRESSES,
  MINIMUM_PERMISSIONED_SEED_WITH_CLASS,
} from "../../fixtures/seedFixtures";
import { E2eWallet } from "../tests/wallet.e2e";
import { E2eAdminDashboard } from "../tests/adminDashboard/adminDashboard.e2e";
import { E2eApi } from "./api.e2e";
import { E2eApp } from "./app.e2e";
import { HOMEPAGE_PATH, SEED_ADMIN_DASHBOARD_PATH } from "./e2eConstants";
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

  public static async findSeedByName(seedName: string) {
    await Cypress.SeedService.ensureAllSeedsInitialized();
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 25 ~ Cypress.SeedService.seedsArray', Cypress.SeedService.seedsArray)
    const targetSeed = Cypress.SeedService.seedsArray.find(
      (seed) => seed.metadata.general.projectName === seedName,
    );
    return targetSeed;
  }
}

export class E2eSeedDashboard {
  /* prettier-ignore */
  public static getMaxContributeButton() { return cy.get("[data-test='max-contribute-button']"); }
  /* prettier-ignore */
  public static getUnlockFundingTokensButton() { return cy.get("[data-test='unlock-funding-tokens-button']"); }
  /* prettier-ignore */
  public static getContributeContainer() { return cy.get("[data-test='contribute-container']"); }
  /* prettier-ignore */
  public static getContributeButton() { return cy.get("[data-test='contribute-button']"); }

  public static maxContribute(): void {
    this.getMaxContributeButton().click();
  }

  public static unlockFundingTokens() {
    this.getUnlockFundingTokensButton().click();
  }

  public static contribute(): void {
    this.getContributeButton().click();
  }

  public static unlockOrContribute(): void {
    this.getContributeContainer().within(() => {
      cy.get("button")
        .invoke("text")
        .then((buttonText) => {
          const cleanedText = buttonText.trim().toLowerCase();
          if (cleanedText === "contribute") {
            this.contribute();
          } else if (cleanedText === "unlock") {
            this.unlockFundingTokens();
          } else {
            throw `Unknown text: ${buttonText}`;
          }
        });
    });
  }
}

Given("1 seed", () => {
  return cy.wait(0).then(() => {
    return E2eApi.createSeed().then((response) => {
      const newSeedId = response.newSeed;
      /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 21 ~ newSeedId', newSeedId)
      E2eSeeds.currentSeedId = newSeedId;
      return newSeedId;
    });
  });
});

Given("1 permissioned seed", () => {
  return cy.wait(0).then(() => {
    return E2eApi.createSeed(MINIMUM_PERMISSIONED_SEED_WITH_CLASS).then(
      (response) => {
        const newSeedId = response.newSeed;
        /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 21 ~ newSeedId', newSeedId)
        E2eSeeds.currentSeedId = newSeedId;
        return newSeedId;
      },
    );
  });
});

Given("I'm the Admin of the Seed", () => {
  E2eNavigation.hasAppLoaded().then(() => {
    cy.waitUntil(() => !!Cypress.SeedService);
    cy.wait(0).then(async () => {
      // 1. Get seed
      Cypress.SeedService
      // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 105 ~ Cypress.SeedService', Cypress.SeedService)
      await Cypress.SeedService.ensureAllSeedsInitialized();
      const firstSeed = Cypress.SeedService.seedsArray[0];
      // 2. get seed admin address
      const adminAddress = firstSeed.admin;
      /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 108 ~ adminAddress', adminAddress)

      E2eWallet.currentWalletAddress = adminAddress;
      E2eSeeds.setSeed(firstSeed);
    });
  });
});

Given("the Seed has 2 Classes", () => {
  return cy.wait(0).then(() => {
    const seedId = E2eSeeds.currentSeedId;
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 49 ~ seedId', seedId)
    return E2eApi.addClassToSeed(
      seedId,
      CLASS_1_WITH_ALLOWLISTED_ADDRESSES,
    ).then((response) => {
      // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 48 ~ response', response)
      return E2eApi.addClassToSeed(
        seedId,
        CLASS_2_WITH_ALLOWLISTED_ADDRESSES,
      ).then((response) => {
        return true;
      });
    });
  });
});
// Given("the Seed has 1 contributor class", () => {});

Given(/^I navigate to the Seed "(.*)"$/, async (seedName: string) => {
  cy.window()
    .then((window) => {
      const { pathname } = window.location;
      /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 142 ~ pathname', pathname)
      if (pathname === HOMEPAGE_PATH) {
        E2eNavigation.navigateToSeedFromHomePage(seedName);
      } else if (pathname.includes(SEED_ADMIN_DASHBOARD_PATH)) {
        E2eAdminDashboard.goToSeedDashboard();
      }
    })
    .then(async () => {
      const seed = await E2eSeeds.findSeedByName(seedName);
      // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 94 ~ seed', seed)
      E2eSeeds.setSeed(seed);
    });
});

Given("I fund the Seed", () => {
  E2eAdminDashboard.fund();
  E2eApp.txWasConfirmed();
  E2eAdminDashboard.getFundingContainer().should("not.exist");
});

Given("I input the max amount", () => {
  E2eSeedDashboard.maxContribute();
});

Given("I unlock the amount", () => {
  E2eSeedDashboard.unlockFundingTokens();
  E2eApp.confirmDisclaimer();
  E2eApp.txWasConfirmed();
});

Given("I contribute the amount", () => {
  E2eSeedDashboard.contribute();
  E2eApp.txWasConfirmed();
  E2eApp.confirmDialog();
});

Given("I wait {int} seconds", (seconds: number) => {
  cy.wait(seconds*1000)
})


///// GOT SEED
/**
 * navigaet to it
 * then fund it,
 * do whole flow
 */
