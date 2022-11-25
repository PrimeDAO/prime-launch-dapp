import { Given } from "@badeball/cypress-cucumber-preprocessor/methods";
import { PAGE_LOADING_TIMEOUT } from "./test-constants";
import { PRIME_PAYMENTS_URL } from "../../../src/configurations/tokenLists";
import { E2eSeeds } from "./seed.e2e";
import { getRouterViewViewModel } from "./aurelia.e2e";
import { HOMEPAGE_PATH, SEED_DASHBOARD_PATH } from "./e2eConstants";

export class E2eNavigation {
  public static SEED_DASHBOARD_URL = "seed";
  public static ADMIN_DASHBOARD_URL = "admin/seeds/dashboard";

  public static navigateToHomePage() {
    cy.visit("/");
    cy.get("[data-test='home-page']", { timeout: PAGE_LOADING_TIMEOUT }).should(
      "be.visible",
    );
  }

  public static useNavbarForHomePage() {
    cy.contains(".navbar-container a", "Home").click();

    cy.get("[data-test='home-page']", { timeout: PAGE_LOADING_TIMEOUT }).should(
      "be.visible",
    );
  }

  public static isHome(pathName: string) {
    const homePaths = ["/", "/home"];
    return homePaths.includes(pathName);
  }

  public static hasAppLoaded() {
    return cy.window().then((window) => {
      const { pathname } = window.location;
      return pathname !== "blank"; // Cypress returns "blank" if app not loaded yet
    });
  }

  /**
   * SEED
   */
  public static navigateToSeedFromHomePage(seedName: string) {
    return cy.contains(
      "featuredlaunches [data-test='launch-card-title']",
      seedName,
    ).click();
  }
}

let counter = 0;

Given("I navigate to the Home page", () => {
  cy.visit("/");
  // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: navigate.ts ~ line 47 ~ Given')
  // // cy.intercept("*", {method: "GET"}, {statusCode: 200, body: { hhahaha: "mumumu" }});
  // // cy.intercept("*", {method: "POST"}, {statusCode: 200, body: { hhahaha: "mumumu" }});
  // cy.intercept("*", (req) => {
  //   if (req.url.includes("localhost:3330")) {
  //     req.continue()
  //     return;
  //   }

  //   // switch(req.url) {
  //   //   case PRIME_PAYMENTS_URL: {
  //   //     req.continue()
  //   //     return;
  //   //   }
  //   // }

  //   // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: navigate.ts ~ line 10 ~ req.url', req.url)
  //   // // req.reply({ statusCode: 200, body: JSON.stringify({works: "yay"}) });
  //   // req.reply({ statusCode: 200, body: '{"hi": "okay"}' });
  // });
  // cy.visit("/newSeed/stage3");
});

Given("I navigate to the Seed Dashboard", () => {
  const seed = E2eSeeds.currentSeed;
  const seedUrl = `/${E2eNavigation.SEED_DASHBOARD_URL}/${seed.address}`;
  cy.visit(seedUrl);

  cy.url().then((currentUrl) => {
    expect(currentUrl).to.include(seedUrl);
  });
});

Given("I navigate to the Admin Dashboard", () => {
  const seed = E2eSeeds.currentSeed;
  const seedName = seed.metadata.general.projectName;

  cy.window().then((window) => {
    const { pathname } = window.location;
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: navigate.ts ~ line 92 ~ pathname', pathname)
    /**
     * Click on Launch card on homepage for quickest navigation
     */
    if (pathname === HOMEPAGE_PATH) {
      cy.contains(
        "featuredlaunches [data-test='launch-card-title']",
        seedName,
      ).click();

      /** App does not hydrate classes fast enough */
      getRouterViewViewModel(".adminContainer").then((adminDashboard) => {
        adminDashboard;
        cy.waitUntil(() => adminDashboard.selectedSeed.classes.length !== 0)
      });
    } else if (pathname.includes(SEED_DASHBOARD_PATH)) {
      cy.contains("button", "access dashboard").click();
    }
    // const adminDashboardUrl = `admin/seeds/dashboard/${seed.address}`;
    // cy.visit(adminDashboardUrl);
  });
});
