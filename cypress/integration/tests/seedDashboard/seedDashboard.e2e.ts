import { Given, Then } from "@badeball/cypress-cucumber-preprocessor/methods";
import { E2eApp } from "../../common/app.e2e";
import { UI_TIMEOUT } from "../../common/e2eConstants";

export class E2eSeedDashboard {
  public static waitForSeedIsLive(): void {
    cy.get("[data-test='seed-countdown']").within(() => {
      cy.get("[data-test='time-left-container']").contains("LIVE", {timeout: UI_TIMEOUT});
      // cy.waitUntil(() =>
      //   cy
      //     .get("[data-test='time-left-container']")
      //     .then(($timeLeftContainer) => {
      //       return cy.wrap($timeLeftContainer).should("have.text", "LIVE")
      //     }),
      // );
    });
  }

  /* prettier-ignore */
  public static getMaxContributeButton() { return cy.get("[data-test='max-contribute-button']").should("be.visible"); }
  /* prettier-ignore */
  public static getUnlockFundingTokensButton() { return cy.get("[data-test='unlock-funding-tokens-button']").should("be.visible"); }
  /* prettier-ignore */
  public static getContributeContainer() { return cy.get("[data-test='contribute-container']").should("be.visible"); }
  /* prettier-ignore */
  public static getContributeButton() { return cy.get("[data-test='contribute-button']").should("be.visible"); }

  /* prettier-ignore */
  public static getClaimContainer() { return cy.get("[data-test='claim-container']").should("be.visible"); }
  /* prettier-ignore */
  public static getMaxClaimButton() { return cy.get("[data-test='max-claim-button']").should("be.visible"); }
  /* prettier-ignore */
  public static getClaimButton() { return cy.get("[data-test='claim-button']").should("be.visible"); }

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

  public static maxClaim(): void {
    this.getClaimButton().should("have.attr", "disabled");
    this.getMaxClaimButton().click();
  }

  public static claim(): void {
    this.getClaimButton().should("not.have.attr", "disabled");
    this.getClaimButton().click();
  }
}

Given("I input the max amount to claim", () => {
  E2eSeedDashboard.maxClaim();
});

Given("I claim the amount", () => {
  E2eSeedDashboard.claim();
  E2eApp.confirmDialog();
});

Then("the max amount should be {string}", (maxAmount: number) => {
  E2eSeedDashboard.getContributeContainer().within(() => {
    cy.get("numeric-input input")
      .invoke("val")
      .then((inputValue) => {
        Object.keys(expect);
        expect(inputValue).to.be.equal(maxAmount.toString());
      });
  });
});
