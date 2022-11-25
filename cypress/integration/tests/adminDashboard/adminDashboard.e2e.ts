import { Then, When } from "@badeball/cypress-cucumber-preprocessor/methods";
// import { NumberService } from "services/NumberService";
import { NumberService } from "../../../../src/services/NumberService";
import { E2eApp } from "../../common/app.e2e";
import { getRouterViewViewModel } from "../../common/aurelia.e2e";
import {
  e2eClassName,
  e2eClassCap,
  e2eIndividualCap,
  e2eClassVestedFor,
  e2eClassCliffOf,
  confirmedMsg,
} from "../../common/e2eConstants";

type ClassModalFields =
  | "class-name"
  | "class-purchase-limit"
  | "project-token-purchase-limit"
  | "vesting-vested-for"
  | "vesting-cliff-of"
  | "allowlist";

export class E2eFields {
  public static addToField(additionalValue: string | number): void {
    cy.get("input, textarea").then(($input) => {
      cy.wrap($input)
        .invoke("val")
        .then((currentValue) => {
          const newValue = currentValue + additionalValue.toString();
          cy.wrap($input)
            .invoke("val", newValue)
            .trigger("change", { data: newValue })
            /**
             * focus then blur to trigger validation (we are validating on blur)
             */
            .focus()
            .blur();
        });
    });
  }

  public static changeField(value: string | number): void {
    cy.get("input, textarea")
      .invoke("val", value)
      .trigger("change", { data: value })
      /**
       * focus then blur to trigger validation (we are validating on blur)
       */
      .focus()
      .blur();
  }
}

export class E2eClassModal {
  public static save(): void {
    cy.contains("[data-test='save-button']", "Save").click();
  }

  public static addToField(
    fieldName: ClassModalFields,
    additionalValue: string | number,
  ): void {
    cy.get(`[data-test='${fieldName}-field']`).within(() => {
      E2eFields.addToField(additionalValue);
    });
  }
}

export class E2eAdminDashboard {
  public static getFundingContainer() {
    return cy.get("[data-test='funding-container']");
  }

  public static fund() {
    this.getFundingContainer().should("be.visible");
    cy.get("[data-test='fund-button']").click();
  }

  public static goToSeedDashboard() {
    cy.get("[data-test='go-to-dashboard']").click();
  }

  static getCancelClasses() {
    return cy.get("[data-test='cancel-classes']");
  }
  public static getConfirmClasses() {
    return cy.get("[data-test='confirm-classes']");
  }
  public static confirmClasses() {
    this.getConfirmClasses().click();
  }

  public static getManyClassRows() {
    return cy.get("[data-test='class-row']");
  }

  public static getClassRow({ className }: { className?: string }) {
    if (className) {
      return cy
        .contains("[data-test='class-name']", className)
        .closest("[data-test='class-row']");
    }

    return cy.get("[data-test='class-row']").first();
  }

  public static getFirstClassRow() {
    return cy.get("[data-test='class-row']").first(); // enough to check first class for this step
  }

  public static getClassName() {
    return cy.get("[data-test='class-name']");
  }
  public static getClassCap() {
    return cy.get("[data-test='class-cap']");
  }
  public static getIndividualCap() {
    return cy.get("[data-test='individual-cap']");
  }
  public static getClassVested() {
    return cy.get("[data-test='class-vested']");
  }

  public static editClass(): void {
    this.getFirstClassRow().within(() => {
      cy.get("[data-test='edit-class-button']").click();
    });

    cy.contains("ux-dialog-header", "Edit class").should("be.visible");
  }
}

When("I edit a Class", () => {
  E2eAdminDashboard.editClass();
  const newValue = "newnew";
  E2eClassModal.addToField("class-name", newValue);
  E2eClassModal.save();
  E2eAdminDashboard.getFirstClassRow().within(() => {
    cy.get("[data-test='class-name']")
      .invoke("text")
      .then((text) => {
        expect(text).to.include(newValue);
      });
  });
});

When("I want to add a Class", () => {
  cy.get("[data-test='add-class-button']").click();
  cy.get("ux-dialog").should("be.visible");
});

When("fill out the Class informations", () => {
  E2eClassModal.addToField("class-name", e2eClassName);
  E2eClassModal.addToField("class-purchase-limit", e2eClassCap);
  E2eClassModal.addToField("project-token-purchase-limit", e2eIndividualCap);
  E2eClassModal.addToField("vesting-vested-for", e2eClassVestedFor);
  E2eClassModal.addToField("vesting-cliff-of", e2eClassCliffOf);
  E2eClassModal.save();
  // E2eClassModal.addToField("allowlist", );
});

When("the information is displayed in the Classes overview", () => {
  // Num of classes
  getRouterViewViewModel(".adminContainer").then((adminDashboard) => {
    const numOfClasses = adminDashboard.selectedSeed.classes.length;
    E2eAdminDashboard.getManyClassRows().should("have.length", numOfClasses);
  });

  const ns = new NumberService();

  // Each field
  E2eAdminDashboard.getClassRow({ className: e2eClassName }).within(() => {
    E2eAdminDashboard.getClassName().should("have.text", e2eClassName);
    const classCapString = ns.toString(e2eClassCap, { mantissa: 1 });
    E2eAdminDashboard.getClassCap().should("have.text", classCapString);
    const indivCapStr = ns.toString(e2eIndividualCap, { mantissa: 1 });
    E2eAdminDashboard.getIndividualCap().should("have.text", indivCapStr);
    E2eAdminDashboard.getClassVested().should("have.text", e2eClassVestedFor);
  });
});

When("I confirm the Class addition", () => {
  E2eAdminDashboard.confirmClasses();
});

Then("the new Class should be added", () => {
  E2eApp.getBanner(confirmedMsg).should("be.visible");
  E2eAdminDashboard.getConfirmClasses().should("have.class", "disabled");
  E2eAdminDashboard.getCancelClasses().should("have.class", "disabled");
});

Then("the changes to the Class should be reflected", () => {
  E2eAdminDashboard.getClassRow({ className: e2eClassName });
});

Then("adding new Classes should be disabled", () => {
  cy.get("[data-test='add-class-button']").should("have.class", "disabled");
});
