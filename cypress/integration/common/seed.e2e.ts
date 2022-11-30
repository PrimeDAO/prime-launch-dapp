import { Given } from "@badeball/cypress-cucumber-preprocessor/methods";
import {
  CLASS_1_WITH_ALLOWLISTED_ADDRESSES,
  CLASS_2_WITH_ALLOWLISTED_ADDRESSES,
  MINIMUM_PERMISSIONED_SEED_WITH_CLASS,
  _27_KOLEKTIVO_CELO_TEST_SEED,
  _27_KOLEKTIVO_SEED_CLASS,
} from "../../fixtures/seedFixtures";
import { E2eWallet } from "../tests/wallet.e2e";
import { E2eAdminDashboard } from "../tests/adminDashboard/adminDashboard.e2e";
import { E2eApi } from "./api.e2e";
import { E2eApp } from "./app.e2e";
import { HOMEPAGE_PATH, SEED_ADMIN_DASHBOARD_PATH } from "./e2eConstants";
import { E2eNavigation } from "./navigate";
import { E2eSeedDashboard } from "../tests/seedDashboard/seedDashboard.e2e";
import { secondsToMilliSeconds, TEN_SECONDS } from "../../../src/shared/shared";

export class E2eSeeds {
  /** prevent direct setting of this currentSeed */
  public static currentSeed: any;
  public static currentSeedId: string;
  public static seedMap = new Map();

  public static setSeed(seed): void {
    this.currentSeed = seed;
    this.currentSeedId = seed.address;
  }

  /**
   * NOTE: The latest one will be chosen
   */
  public static async findSeedByName(seedName: string) {
    await Cypress.SeedService.ensureAllSeedsInitialized();
    // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 25 ~ Cypress.SeedService.seedsArray', Cypress.SeedService.seedsArray)
    const seedByStartTimes = Cypress.SeedService.seedsArray.map(
      (seed) => new Date(seed.startTime),
    );
    // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 32 ~ seedByStartTimes', seedByStartTimes)

    const { seedsArray } = Cypress.SeedService;
    if (seedsArray.length === 1) {
      return seedsArray[0];
    }

    const seedsByName = seedsArray.filter(
      (seed) => seed.metadata.general.projectName === seedName,
    );
    const mapName = seedsByName.map((seed) => seed.address);
    // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 46 ~ mapName', mapName)

    const latestFirst = seedsByName.sort((seedA, seedB) => {
      const sorted = Date.parse(seedB.startTime) - Date.parse(seedA.startTime);
      return sorted;
    });
    const mapName1 = latestFirst.map((seed) => seed.address);
    // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 46 ~ mapName1', mapName1)

    const targetSeed = latestFirst[0];
    // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 58 ~ targetSeed.address', targetSeed.address)
    return targetSeed;
  }

  public static getCurrentSeedId(): string {
    const seedId = this.currentSeed.address;
    return seedId;
  }

  public static getCurrentSeedName(): string {
    const seedName = this.currentSeed.metadata.general.projectName;
    return seedName;
  }
}

Given(/^1 seed$/, () => {
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
        E2eSeeds.currentSeedId = newSeedId;
        return newSeedId;
      },
    );
  });
});

Given(/^1 permissioned seed named "(.*)"$/, (seedName: string) => {
  /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 98 ~ seedName', seedName)
  return cy.wait(0).then(() => {
    let seedJson;
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 101 ~ seedName', seedName)
    switch (seedName) {
      case "_27_KOLEKTIVO_CELO_TEST_SEED": {
        seedJson = _27_KOLEKTIVO_CELO_TEST_SEED;
        break;
      }
      default: {
        seedJson = MINIMUM_PERMISSIONED_SEED_WITH_CLASS;
        break;
      }
    }

    return E2eApi.createSeed(seedJson).then((response) => {
      const newSeedId = response.newSeed;
      /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 21 ~ newSeedId', newSeedId)
      E2eSeeds.currentSeedId = newSeedId;
      return newSeedId;
    });
  });
});

Given("I'm the Admin of the Seed", () => {
  E2eNavigation.hasAppLoaded().then(() => {
    cy.waitUntil(() => !!Cypress.SeedService);
    cy.wait(0).then(async () => {
      // 1. Get seed
      Cypress.SeedService;
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

Given(/^the Seed has 1 Class named "(.*)"$/, (className: string) => {
  let classData;
  switch (className) {
    case "_27_KOLEKTIVO_SEED_CLASS": {
      classData = _27_KOLEKTIVO_SEED_CLASS;
      break;
    }
    default: {
      classData = CLASS_1_WITH_ALLOWLISTED_ADDRESSES;
    }
  }

  return cy.wait(0).then(() => {
    const seedId = E2eSeeds.currentSeedId;
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: seed.e2e.ts ~ line 49 ~ seedId', seedId)
    return E2eApi.addClassToSeed(seedId, classData).then(() => true);
  });
});

// Given("the Seed has 1 contributor class", () => {});

Given(/^I navigate to the Seed "(.*)"$/, async (seedName: string) => {
  cy.then(async () => {
    const seed = await E2eSeeds.findSeedByName(seedName);
    await seed.ensureInitialized();
    E2eSeeds.setSeed(seed);
  })
    .window()
    .then((window) => {
      const { pathname } = window.location;
      if (pathname === HOMEPAGE_PATH) {
        const seedId = E2eSeeds.getCurrentSeedId();
        E2eNavigation.navigateToSeedFromHomePage(seedId);
      } else if (pathname.includes(SEED_ADMIN_DASHBOARD_PATH)) {
        E2eAdminDashboard.goToSeedDashboard();
      }
    });
});

Given("I fund the Seed", () => {
  E2eAdminDashboard.fund();
  E2eApp.txWasConfirmed();
  E2eAdminDashboard.getFundingContainer().should("not.exist");
});

Given("I input the max amount to contribute", () => {
  E2eSeedDashboard.waitForSeedIsLive();
  E2eSeedDashboard.maxContribute();
});

Given("I unlock the amount", () => {
  // cy.clock();
  // cy.tick(secondsToMilliSeconds(100));
  // cy.pause()
  // cy.wait(8000)

  if (!E2eSeeds.currentSeed.hasLegalDisclaimer) {
    return;
  }

  E2eSeedDashboard.unlockFundingTokens();
  E2eApp.confirmDisclaimer();
  E2eApp.txWasConfirmed();
});

Given("I contribute the amount", () => {
  E2eSeedDashboard.contribute();
  E2eApp.txWasConfirmed();
  E2eApp.confirmDialog();
});

///// GOT SEED
/**
 * navigaet to it
 * then fund it,
 * do whole flow
 */
