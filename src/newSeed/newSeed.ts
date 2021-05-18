import "./newSeed.scss";
import { PLATFORM } from "aurelia-pal";
import { singleton } from "aurelia-framework";
import { ISeedConfig, SeedConfig } from "./seedConfig";
import { Router, RouterConfiguration } from "aurelia-router";
import { IStageState } from "newSeed/baseStage";

@singleton(false)
export class NewSeed {
  router: Router;

  seedConfig: ISeedConfig;
  stageState: Array<IStageState>;

  constructor() {
    if (!this.seedConfig) {
      this.seedConfig = new SeedConfig();
      /**
       * stageState is 1-based, indexed by stage number
       * We have 6 stages.
       */
      this.stageState = [
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
          verified: false,
          title: "Thank you!",
        },
      ];
    }
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = "Register New SEED";

    const routes = [
      { route: ["", "stage1"], nav: true, moduleId: PLATFORM.moduleName("./stage1"), name: "stage1", title: "General Information", settings: { seedConfig: this.seedConfig, stageState: this.stageState, stageNumber: 1, maxStage: 6 } },
      { route: ["stage2"], nav: true, moduleId: PLATFORM.moduleName("./stage2"), name: "stage2", title: "Project Details", settings: { seedConfig: this.seedConfig, stageState: this.stageState, stageNumber: 2, maxStage: 6 } },
      { route: ["stage3"], nav: true, moduleId: PLATFORM.moduleName("./stage3"), name: "stage3", title: "Token Details", settings: { seedConfig: this.seedConfig, stageState: this.stageState, stageNumber: 3, maxStage: 6 } },
      { route: ["stage4"], nav: true, moduleId: PLATFORM.moduleName("./stage4"), name: "stage4", title: "SEED Details", settings: { seedConfig: this.seedConfig, stageState: this.stageState, stageNumber: 4, maxStage: 6 } },
      { route: ["stage5"], nav: true, moduleId: PLATFORM.moduleName("./stage5"), name: "stage5", title: "Contact Details", settings: { seedConfig: this.seedConfig, stageState: this.stageState, stageNumber: 5, maxStage: 6 } },
      { route: ["stage6"], nav: false, moduleId: PLATFORM.moduleName("./stage6"), name: "stage6", title: "Thank You!", settings: { seedConfig: this.seedConfig, stageState: this.stageState, stageNumber: 6, maxStage: 6 } },
    ];

    config.map(routes);

    this.router = router;
  }

  setStage(route: string): void {
    this.router.navigate(route);
  }
}
