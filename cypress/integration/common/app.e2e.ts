import { confirmedMsg } from "./e2eConstants";
import { E2eSeeds } from "./seed.e2e";

export class E2eApp {
  public static getBanner(bannerMessage: string) {
    return cy.contains("[data-test='banner-message']", bannerMessage);
  }

  public static txWasConfirmed(): void {
    this.getBanner(confirmedMsg).should("be.visible");
  }

  public static getDialog() {
    return cy.get("ux-dialog");
  }

  public static confirmDialog() {
    this.getDialog().within(() => {
      cy.get("[data-test='confirm-dialog-button']").click()
    })
  }

  public static getDisclaimer() {
    const disclaimerClass = "disclaimer"
    return this.getDialog().then(($dialog) => {
      cy.wrap($dialog).should("have.class", disclaimerClass);
      return cy.wrap($dialog);
    });
  }

  public static confirmDisclaimer() {
    this.getDisclaimer().within(() => {
      cy.get("ux-dialog-footer label input").check()
      cy.get("[data-test='accept-disclaimer']").click()
    })

    this.getDisclaimer().should("not.exist")
  }
}
