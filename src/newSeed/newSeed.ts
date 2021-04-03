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
      { route: ["", "newseed/generalinfo"], nav: true, moduleId: PLATFORM.moduleName("./stage1"), name: "generalinfo", title: "General Information", settings: { seedConfig: Object.assign({ stageNumber: 1 }, this.seedConfig) } },
      { route: ["newseed/projectdetails"], nav: true, moduleId: PLATFORM.moduleName("./stage2"), name: "projectdetails", title: "Project Details", settings: { seedConfig: Object.assign({ stageNumber: 2 }, this.seedConfig) } },
      { route: ["newseed/tokendetails"], nav: true, moduleId: PLATFORM.moduleName("./stage3"), name: "tokendetails", title: "Token Details", settings: { seedConfig: Object.assign({ stageNumber: 3 }, this.seedConfig) } },
      { route: ["newseed/seeddetails"], nav: true, moduleId: PLATFORM.moduleName("./stage4"), name: "seeddetails", title: "SEED Details", settings: { seedConfig: Object.assign({ stageNumber: 4 }, this.seedConfig) } },
      { route: ["newseed/contactdetails"], nav: true, moduleId: PLATFORM.moduleName("./stage5"), name: "contactdetails", title: "Contact Details", settings: { seedConfig: Object.assign({ stageNumber: 5 }, this.seedConfig) } },
      { route: ["newseed/thankyou"], nav: true, moduleId: PLATFORM.moduleName("./stage6"), name: "thankyou", title: "Thank You!", settings: { seedConfig: Object.assign({ stageNumber: 6 }, this.seedConfig) } },
    ];

    config.map(routes);

    this.seedConfig.maxStage = routes.length+1;

    this.router = router;
  }

  setStage(route: string): void {
    this.router.navigate(route);
  }
}
