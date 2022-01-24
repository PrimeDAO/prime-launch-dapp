import { ContractNames, ContractsService } from "./../services/ContractsService";
import { EventConfigFailure } from "../services/GeneralEvents";
import { autoinject, computedFrom } from "aurelia-framework";
import "./baseStage.scss";
import { RouteConfig } from "aurelia-router";
import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { Address, EthereumService, Hash, Networks } from "services/EthereumService";
import { TokenService } from "services/TokenService";
import { LaunchType } from "services/launchTypes";
import { BigNumber } from "ethers";
import { Utils } from "services/utils";

export interface IStageState {
  verified: boolean;
  title: string;
}

export interface IWizardState {
  launchType: LaunchType;
  launchTypeTitle: string;
  launchHash?: Hash;
  whiteList?: string;
  requiredProjectTokenDeposit?: BigNumber;
  requiredFundingTokenDeposit?: BigNumber;
  launchAdminAddress?: Address;
  launchStartDate?: string;
  stage3State?: {
    formIsEditable: boolean;
    tiNameInputPresupplied: boolean;
    tiSymbolInputPresupplied: boolean;
    tiLogoInputPresupplied: boolean;
    tiDecimalsInputPresupplied: boolean;
    projectTokenErrorMessage: string;
    isValidTokenAddress: boolean;
    lastCheckedAddress: Address;
  }
}

@autoinject
export abstract class BaseStage<IConfig> {
  protected launchConfig: IConfig;
  protected stageNumber: number;
  protected maxStage: number;
  protected stageStates: Array<IStageState>;
  protected wizardState: IWizardState;
  protected multiSigWalletUri: string;

  @computedFrom("stageStates", "stageNumber")
  protected get stageState(): IStageState { return this.stageStates[this.stageNumber]; }

  constructor(
    protected router: Router,
    protected ethereumService: EthereumService,
    protected eventAggregator: EventAggregator,
    protected tokenService: TokenService,
  ) {

    const safeAddress = ContractsService.getContractAddress(ContractNames.SAFE);

    this.multiSigWalletUri =
      `https://${(EthereumService.targetedNetwork === Networks.Rinkeby) ? "rinkeby." : "" }gnosis-safe.io/app/#/safes/${safeAddress}/transactions`;
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
    this.router.parent.navigate("register");
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

  protected hoursMinutesFilter(e: KeyboardEvent): boolean {
    if (!((e.key === ":") || Utils.allowableNumericInput(e))) {
      e.preventDefault();
      return false;
    }
    return true;
  }
}
