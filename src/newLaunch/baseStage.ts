import { ITokenInfo } from "services/TokenTypes";
import { EventConfigFailure } from "../services/GeneralEvents";
import { autoinject, singleton, computedFrom } from "aurelia-framework";
import "./baseStage.scss";
import { ISeedConfig } from "./seed/seedConfig";
import { ILbpConfig } from "./lbp/lbpConfig";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { Address, Hash } from "services/EthereumService";
import { TokenService } from "services/TokenService";

export interface IStageState {
  verified: boolean;
  title: string;
}

export interface IWizardState {
  seedHash?: Hash;
  lbpHash?: Hash;
  whiteList?: string;
  fundingTokenInfo?: ITokenInfo;
  projectTokenInfo?: ITokenInfo;
  requiredSeedDeposit?: number;
  requiredSeedFee?: number;
  seedAdminAddress?: Address;
  seedStartDate?: string;
}

@singleton(false)
@autoinject
export abstract class BaseStage {
  protected seedConfig: ISeedConfig;
  protected lbpConfig: ILbpConfig;
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
    protected tokenService: TokenService,
  ) {
  }

  activate(_params: unknown, routeConfig: RouteConfig): void {
    Object.assign(this, routeConfig.settings);
  }

  async detached(): Promise<void> {
    const message = await this.validateInputs();
    if (!message) {
      this.persistData();
    }
  }

  protected cancel(): void {
    this.router.parent.navigate("launch");
  }

  protected next(): void {
    this.router.navigate(`stage${this.stageNumber + 1}`);
  }

  protected back(): void {
    if (this.stageNumber > 1) {
      this.router.navigate(`stage${this.stageNumber - 1}`);
    }
  }

  protected async proceed(moveOn = true): Promise<boolean> {
    const message: string = await this.validateInputs();
    if (message) {
      this.validationError(message);
      return false;
    } else {
      if (moveOn) {
        this.next();
      }
      return true;
    }
  }

  protected validateInputs(): Promise<string> {
    return Promise.resolve(null);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected persistData(): void {
  }

  protected validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }
}
