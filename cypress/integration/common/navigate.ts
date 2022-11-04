import { Given } from "@badeball/cypress-cucumber-preprocessor/methods";
import { PAGE_LOADING_TIMEOUT } from "./test-constants";

export class E2eNavigation {
  public static navigateToHomePage() {
    cy.visit("/");
    cy.get("[data-test='home-page']", {timeout: PAGE_LOADING_TIMEOUT}).should("be.visible");
  }

  public static useNavbarForHomePage() {
    cy.contains(".navbar-container a", "Home").click();

    cy.get("[data-test='home-page']", {timeout: PAGE_LOADING_TIMEOUT}).should("be.visible");
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
}

let counter = 0;

Given("I navigate to the Deals home page", () => {
  // cy.intercept("*", {method: "GET"}, {statusCode: 200, body: { hhahaha: "mumumu" }});
  // cy.intercept("*", {method: "POST"}, {statusCode: 200, body: { hhahaha: "mumumu" }});
  cy.intercept("*", (req) => {
    // /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: navigate.ts ~ line 10 ~ req.url', req.url)
    // return;
    // const letThrough = 113;
    // if (counter < letThrough) {
    //   counter++;
    //   /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: navigate.ts ~ line 12 ~ counter', counter)
    //   req.continue();
    //   return;
    // }
    if (req.url.includes("localhost:3330")) {
      req.continue()
      return;
    }

    // req.reply({ statusCode: 200, body: JSON.stringify({works: "yay"}) });
    req.reply({ statusCode: 200, body: '{"hi": "okay"}' });
  });
  cy.visit("/newSeed/stage3");
  // cy.visit("/");
});
