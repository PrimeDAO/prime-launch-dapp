import { autoinject } from "aurelia-framework";
import "./baseStage.scss";
import { ISeedConfig } from "./seedConfig";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";

@autoinject
export abstract class BaseStage {
  seedConfig: ISeedConfig;
  stageNumber: number;
  maxStage: number;

  constructor(
    private router: Router) {
  }

  activate(_params: unknown, routeConfig: RouteConfig): void {
    Object.assign(this, routeConfig.settings);
  }

  cancel(): void {
    this.router.parent.navigate("selectPackage");
  }

  next(): void {
    if (this.stageNumber < this.maxStage) {
      this.router.navigate(`stage${this.stageNumber + 1}`);
    }
  }

  back(): void {
    if (this.stageNumber > 1) {
      this.router.navigate(`stage${this.stageNumber - 1}`);
    }
  }
}
