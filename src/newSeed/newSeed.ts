import "./newSeed.scss";
import { PLATFORM } from "aurelia-pal";
import { singleton, computedFrom } from "aurelia-framework";
import { ISeedConfig, SeedConfig } from "./seedConfig";
import { Router, RouterConfiguration, RouteConfig } from "aurelia-router";
import { IStageState, IWizardState } from "newSeed/baseStage";

/**
 * this is the max "real" stage that gathers input from the user and requires
 * validatation of inputs. Reminder that stages are one-indexed.
 */
const maxStage = 5;

@singleton(false)
export class NewSeed {
  router: Router;

  seedConfig: ISeedConfig;
  stageStates: Array<IStageState>;
  wizardState: IWizardState;
  sideBar: HTMLElement;

  @computedFrom("router.currentInstruction")
  get currentStage(): RouteConfig {
    return this.router.currentInstruction.config;
  }

  constructor() {
    if (!this.seedConfig) {
      this.seedConfig = new SeedConfig();
      this.wizardState = {};
      /**
       * stageStates is 1-based, indexed by stage number
       */
      this.stageStates = [
        undefined,
        {
          verified: false,
          title: "General Information",
        },
        {
          verified: false,
          title: "Project Details",
        },
        {
          verified: false,
          title: "Token Details",
        },
        {
          verified: false,
          title: "SEED Details",
        },
        {
          verified: false,
          title: "Contact Details",
        },
        {
          verified: true,
          title: "Seed Summary",
        },
        {
          verified: true,
          title: "Ready to Go!",
        },
        {
          verified: true,
          title: "Thank you!",
        },
      ];
    }
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    const routes = [
      {
        route: ["", "stage1"],
        nav: true,
        moduleId: PLATFORM.moduleName("./stage1"),
        name: "stage1",
        title: this.stageStates[1].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 1,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage2"],
        nav: true,
        moduleId: PLATFORM.moduleName("./stage2"),
        name: "stage2",
        title: this.stageStates[2].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 2,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage3"],
        nav: true,
        moduleId: PLATFORM.moduleName("./stage3"),
        name: "stage3",
        title: this.stageStates[3].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 3,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage4"],
        nav: true,
        moduleId: PLATFORM.moduleName("./stage4"),
        name: "stage4",
        title: this.stageStates[4].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 4,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage5"],
        nav: true,
        moduleId: PLATFORM.moduleName("./stage5"),
        name: "stage5",
        title: this.stageStates[5].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 5,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage6"],
        nav: false,
        moduleId: PLATFORM.moduleName("./stage6"),
        name: "stage6",
        title: this.stageStates[6].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 6,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage7"],
        nav: false,
        moduleId: PLATFORM.moduleName("./stage7"),
        name: "stage7",
        title: this.stageStates[7].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 7,
          maxStage,
          wizardState: this.wizardState },
      },
      {
        route: ["stage8"],
        nav: false,
        moduleId: PLATFORM.moduleName("./stage8"),
        name: "stage8",
        title: this.stageStates[8].title,
        settings: {
          seedConfig: this.seedConfig,
          stageStates: this.stageStates,
          stageNumber: 8,
          maxStage,
          wizardState: this.wizardState },
      },
    ];

    config.map(routes);

    this.router = router;
  }

  setStage(route: string): void {
    this.router.navigate(route);
  }

  toggleSideBar(): void {
    if (this.sideBar.classList.contains("show")) {
      this.sideBar.classList.remove("show");
    } else {
      this.sideBar.classList.add("show");
    }
  }
}

