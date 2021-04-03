import "./newSeed.scss";
import { PLATFORM } from "aurelia-pal";
import { singleton } from "aurelia-framework";
import { ISeedConfig, SeedConfig } from "./seedConfig";
import { Router, RouterConfiguration } from "aurelia-router";

@singleton(false)
export class NewSeed {
  router: Router;

  seedConfig: ISeedConfig;

  constructor() {
    if (!this.seedConfig) {
      this.seedConfig = new SeedConfig();
    }
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = "Register New SEED";

    const routes = [
      { route: ["", "newseed/stage1"], nav: true, moduleId: PLATFORM.moduleName("./stage1"), name: "stage1", title: "General Information", settings: { seedConfig: this.seedConfig, stageNumber: 1, maxStage: 6 } },
      { route: ["newseed/stage2"], nav: true, moduleId: PLATFORM.moduleName("./stage2"), name: "stage2", title: "Project Details", settings: { seedConfig: this.seedConfig, stageNumber: 2, maxStage: 6 } },
      { route: ["newseed/stage3"], nav: true, moduleId: PLATFORM.moduleName("./stage3"), name: "stage3", title: "Token Details", settings: { seedConfig: this.seedConfig, stageNumber: 3, maxStage: 6 } },
      { route: ["newseed/stage4"], nav: true, moduleId: PLATFORM.moduleName("./stage4"), name: "stage4", title: "SEED Details", settings: { seedConfig: this.seedConfig, stageNumber: 4, maxStage: 6 } },
      { route: ["newseed/stage5"], nav: true, moduleId: PLATFORM.moduleName("./stage5"), name: "stage5", title: "Contact Details", settings: { seedConfig: this.seedConfig, stageNumber: 5, maxStage: 6 } },
      { route: ["newseed/stage6"], nav: true, moduleId: PLATFORM.moduleName("./stage6"), name: "stage6", title: "Thank You!", settings: { seedConfig: this.seedConfig, stageNumber: 6, maxStage: 6 } },
    ];

    config.map(routes);

    this.router = router;
  }

  setStage(route: string): void {
    this.router.navigate(route);
  }
}
