import { EventConfigFailure } from "../services/GeneralEvents";
import { autoinject, singleton, computedFrom } from "aurelia-framework";
import "./baseStage.scss";
import { ISeedConfig } from "./seedConfig";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { Hash } from "services/EthereumService";

export interface IStageState {
  verified: boolean;
  title: string;
  seedHash?: Hash;
}

@singleton(false)
@autoinject
export abstract class BaseStage {
  protected seedConfig: ISeedConfig;
  protected stageNumber: number;
  protected maxStage: number;
  protected stageStates: Array<IStageState>;
  @computedFrom("stageStates", "stageNumber")
  protected get stageState(): IStageState { return this.stageStates[this.stageNumber]; }

  constructor(
    protected router: Router,
    protected eventAggregator: EventAggregator) {
  }

  activate(_params: unknown, routeConfig: RouteConfig): void {
    Object.assign(this, routeConfig.settings);
  }

  detached(): void {
    const message = this.validateInputs();
    this.stageState.verified = !message;
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
