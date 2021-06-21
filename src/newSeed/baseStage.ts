import { EventConfigFailure } from "../services/GeneralEvents";
import { autoinject, singleton, computedFrom } from "aurelia-framework";
import "./baseStage.scss";
import { ISeedConfig } from "./seedConfig";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { Address, Hash } from "services/EthereumService";
import { NewSeed } from "./newSeed";

export interface IStageState {
  verified: boolean;
  title: string;
}

export interface IWizardState {
  seedHash?: Hash;
  fundingTokenSymbol?: string;
  seedTokenSymbol?: string;
  requiredSeedDeposit?: number;
  requiredSeedFee?: number;
  primeDaoAddress?: Address;
}

@singleton(false)
@autoinject
export abstract class BaseStage {
  protected seedConfig: ISeedConfig;
  protected stageNumber: number;
  protected maxStage: number;
  protected stageStates: Array<IStageState>;
  protected wizardState: IWizardState;

  @computedFrom("stageStates", "stageNumber")
  protected get stageState(): IStageState { return this.stageStates[this.stageNumber]; }

  protected readonly seedFee = .01;

  constructor(
    protected router: Router,
    protected eventAggregator: EventAggregator,
    protected newSeed: NewSeed) {
    this.newSeed = newSeed;
  }

  activate(_params: unknown, routeConfig: RouteConfig): void {
    Object.assign(this, routeConfig.settings);
    this.newSeed.currentStage = this.stageStates[this.stageNumber].title;
    if (this.stageNumber + 1 <= 5) {
      this.newSeed.setNextStage(this.stageStates[this.stageNumber + 1].title);
    } else {
      this.newSeed.setNextStage("Last Stage");
    }
  }

  async detached(): Promise<void> {
    const message = this.validateInputs();
    if (!message) {
      this.persistData();
    }
  }

  protected cancel(): void {
    this.router.parent.navigate("selectPackage");
  }

  protected next(): void {
    if (this.stageNumber < this.maxStage) {
      this.router.navigate(`stage${this.stageNumber + 1}`);
      this.newSeed.setCurrentStage(this.stageStates[this.stageNumber + 1].title);
      if (this.stageNumber + 1 <= 5) {
        this.newSeed.setNextStage(this.stageStates[this.stageNumber + 2].title);
      } else {
        this.newSeed.setNextStage("Last Stage");
      }
    }
  }

  protected back(): void {
    if (this.stageNumber > 1) {
      this.router.navigate(`stage${this.stageNumber - 1}`);
      this.newSeed.setCurrentStage(this.stageStates[this.stageNumber - 1].title);
      this.newSeed.setNextStage(this.stageStates[this.stageNumber].title);
    }
  }

  protected validateInputs(): string {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected persistData(): void {
  }

  protected validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }
}
