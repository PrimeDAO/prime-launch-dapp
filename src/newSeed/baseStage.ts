import { EventConfigFailure } from "../services/GeneralEvents";
import { autoinject } from "aurelia-framework";
import "./baseStage.scss";
import { ISeedConfig } from "./seedConfig";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";

@autoinject
export abstract class BaseStage {
  protected seedConfig: ISeedConfig;
  protected stageNumber: number;
  protected maxStage: number;

  constructor(
    protected router: Router,
    protected eventAggregator: EventAggregator) {
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

  validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }
}
