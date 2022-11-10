import "reflect-metadata";
import { Given, Then } from "@badeball/cypress-cucumber-preprocessor/methods";
import { E2E_ADDRESSES } from "../../fixtures/walletFixtures";
import { Utils } from "../../../src/services/utils";
import { E2eNavigation } from "../common/navigate";
import { PAGE_LOADING_TIMEOUT } from "../common/test-constants";
import { E2eSeed } from "../common/seed.e2e";

const UserTypes = ["Anonymous", "Connected Public", "Main Testing"] as const;
export type UserType = typeof UserTypes[number]

export class E2eWallet {
  public static isLead = true;

  private static _currentWalletAddress: string | undefined = "";
  public static get currentWalletAddress(): string | undefined {
    if (this._currentWalletAddress === "") {
      const errorMessage = "[Test] Wallet address expected. Please use a step, that specifies an address.\n\n" +
        "Quickest way to fix this, is to set:\n" +
        "E2eWallet.currentWalletAddress = <myAddress>.\n\n" +
        "If you wanted to test the \"Anonymous User case\", then test code likely has a bug.";
      throw new Error(errorMessage);
    }

    return this._currentWalletAddress;
  }
  public static set currentWalletAddress(newAddress: string | undefined) {
    if (!newAddress) {
      throw new Error("[E2E] No address for wallet given")
    }

    localStorage.setItem("PRIME_E2E_ADDRESS", newAddress);
    this._currentWalletAddress = newAddress;
  }

  public static getSmallHexAddress() {
    return Utils.smallHexString(E2eWallet.currentWalletAddress ?? "");
  }

  public static reset() {
    this.currentWalletAddress = undefined;
    this.isLead = true;
  }
}

export class E2eNavbar {
  public static getConnectWalletButton() {
    return cy.contains("navbar button", "Connect to a Wallet");
  }

  public static getUserAddress() {
    return cy.get("[data-test='connect-button-container'] usersaddress");
  }

  public static connectToWallet(address: string = E2E_ADDRESSES.ProposalLead) {
    cy.log("connectToWallet");

    localStorage.setItem("PRIME_E2E_ADDRESS", address);
    E2eWallet.currentWalletAddress = address;

    cy.get("[data-test='connectButton']").then(connectButton => {
      // 1. Check if already connected
      const text = connectButton.text().trim();
      if (text !== "Connect to a Wallet") {
        return;
      }

      // 2. If not, connect
      cy.contains("div", "Connect to a Wallet").click();

      this.acceptDisclaimer();

      // cy.get("[data-test='modelContent']").should("be.visible");
      // cy.get("[data-test='modelContent']").should("not.be.visible");
    });
  }

  public static acceptDisclaimer() {
    cy.get("ux-dialog-container").within(() => {
      cy.get(".checkbox").click();
      cy.contains("button", "Accept").click();
    });

    cy.get(".navbar-container").within(() => {
      cy.get("[data-test='connectButton'] smallusersaddress", {timeout: PAGE_LOADING_TIMEOUT}).should("be.visible");
    });
  }

  public static disconnectWallet() {
    cy.log("disconnectWallet");

    cy.get("[data-test='connectButton']").click();
    cy.get("[data-test='diconnect-button']").click();
    this.getConnectWalletButton().should("be.visible");
  }
}

Given("I'm the Admin of the Seed", () => {
  E2eNavigation.hasAppLoaded().then(() => {
    cy.waitUntil(() => !!Cypress.SeedService)
    cy.wait(0).then(async () => {

      // 1. Get seed
      await Cypress.SeedService.ensureAllSeedsInitialized()
      const firstSeed = Cypress.SeedService.seedsArray[0]
      // 2. get seed admin address
      const adminAddress = firstSeed.admin

      E2eWallet.currentWalletAddress = adminAddress
      E2eSeed.currentSeed = firstSeed
    })
  })

})

Given("I connect to the wallet with address {string}", (address: string) => {
  E2eNavbar.connectToWallet(address);
});

Given("I'm connected to the app", () => {
  E2eNavbar.connectToWallet(E2eWallet.currentWalletAddress);
});

Given("I change the address to {string}", (address: string) => {
  E2eWallet.currentWalletAddress = address;
  // @ts-ignore - Hack to access firestore inside Cypress
  Cypress.eventAggregator.publish("accountsChanged", address);

});

Given("I'm a Connected Public user", () => {
  givenImAConnectedPublicUser();
});

Given(/^I'm an? "(.*)" user$/, (userType: UserType) => {
  switch (userType) {
    case "Anonymous": {
      givenImAnAnonymousUser();
      break;
    }
    case "Main Testing": {
      givenImAConnectedToMainTestingAccount();
      break;
    }
    default: {
      throw new Error("[TEST] No such user type. Available: " + UserTypes.join(", "));
    }
  }
});

Given("I'm connected to my wallet", () => {
  E2eNavbar.connectToWallet(E2eWallet.currentWalletAddress);
});

Given("I'm not connected to a wallet", () => {
  E2eNavbar.getConnectWalletButton().should("be.visible");
  E2eNavbar.getUserAddress().should("not.exist");
});

Given("I'm a Public viewer", () => {
  E2eNavbar.getConnectWalletButton().should("be.visible");
  E2eNavbar.getUserAddress().should("not.exist");
});

Then("I'm connected to my wallet with address {string}", (address: string) => {
  E2eNavbar.getUserAddress().should("be.visible").contains(address);
});

function givenImAnAnonymousUser() {
  E2eNavigation.hasAppLoaded().then(hasLoaded => {
    E2eWallet.currentWalletAddress = undefined;
    E2eWallet.isLead = false;

    if (hasLoaded) {
      cy.get("[data-test='connectButton']").then(connectButton => {
        const isConnected = connectButton.text().trim() !== "Connect to a Wallet";
        if (isConnected) {
          E2eNavbar.disconnectWallet();
        }

        E2eNavbar.getConnectWalletButton().should("be.visible");
        E2eNavbar.getUserAddress().should("not.exist");
      });
    }
  });
}

function givenImAConnectedPublicUser() {
  E2eNavigation.hasAppLoaded().then(hasLoaded => {
    E2eWallet.currentWalletAddress = E2E_ADDRESSES.ProposalLead;
    E2eWallet.isLead = false;

    if (hasLoaded) {
      // If app loaded, then try to connect
      cy.get("[data-test='connectButton']").then(connectButton => {
        const isConnected = connectButton.text().trim() !== "Connect to a Wallet";
        if (isConnected) {
          E2eNavbar.disconnectWallet();
        } else {
          E2eNavbar.connectToWallet(E2eWallet.currentWalletAddress);
        }
      });
    }
  });
}

function givenImAConnectedToMainTestingAccount() {
  E2eNavigation.hasAppLoaded().then(hasLoaded => {
    E2eWallet.currentWalletAddress = E2E_ADDRESSES.CurveLabsMainLaunch;
    E2eWallet.isLead = true;

    if (hasLoaded) {
      // If app loaded, then try to connect
      cy.get("[data-test='connectButton']").then(connectButton => {
        const isConnected = connectButton.text().trim() !== "Connect to a Wallet";
        if (isConnected) {
          E2eNavbar.disconnectWallet();
        } else {
          E2eNavbar.connectToWallet(E2eWallet.currentWalletAddress);
        }
      });
    }
  });
}
