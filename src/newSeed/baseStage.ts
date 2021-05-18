import { EventConfigFailure } from "../services/GeneralEvents";
import { autoinject, singleton } from "aurelia-framework";
import "./baseStage.scss";
import { ISeedConfig } from "./seedConfig";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";

export interface IStageState {
  verified: boolean;
  title: string;
}

@singleton(false)
@autoinject
export abstract class BaseStage {
  protected seedConfig: ISeedConfig;
  protected stageNumber: number;
  protected maxStage: number;
  protected stageState: Array<IStageState>;

  constructor(
    protected router: Router,
    protected eventAggregator: EventAggregator) {
  }

  activate(_params: unknown, routeConfig: RouteConfig): void {
    Object.assign(this, routeConfig.settings);
  }

  detached(): void {
    const message = this.validateInputs();
    if (message) {
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
    }
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

  validateInputs(): string {
    return null;
  }

  validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }
}
