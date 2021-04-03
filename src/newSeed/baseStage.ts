import "./baseStage.scss";
import { ISeedConfig } from "newSeed/seedConfig";
import { RouteConfig } from "aurelia-router";
export abstract class BaseStage {
  seedConfig: ISeedConfig;

  activate(_params: unknown, routeConfig: RouteConfig): void {
    this.seedConfig = routeConfig.settings.seedConfig;
  }

  cancel(): void {

  }

  next() {
    if (this.seedConfig.stageNumber < this.seedConfig.maxStage) {

    }
  }

  back() {
    if (this.seedConfig.stageNumber > 1) {

    }
  }
}
