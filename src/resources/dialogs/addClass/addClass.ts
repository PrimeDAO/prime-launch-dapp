import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, singleton } from "aurelia-framework";
import { ISeedConfig } from "newLaunch/seed/config";
import {EthereumService, fromWei} from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import { LaunchService } from "services/LaunchService";
import { IClass } from "newLaunch/launchConfig";
import {Utils} from "../../../services/utils";
import {EventConfigFailure} from "../../../services/GeneralEvents";
import {NumberService} from "../../../services/NumberService";

import "./addClass.scss";
import {BigNumber} from "ethers";

@singleton(false)
@autoinject
export class AddClassModal {

  private model: IAddClassModal;
  private okButton: HTMLElement;
  launchConfig: ISeedConfig;
  tokenList: Array<ITokenInfo>;

  verified: boolean;


  className: string;
  projectTokenPurchaseLimit: number;
  allowList: string;
  token: ITokenInfo;
  tokenExchangeRatio: number;
  fundingTokensTarget: number;
  fundingTokenMaximum: number;
  vestingPeriod: number;
  vestingCliff: number


  constructor(
    private controller: DialogController,
    protected eventAggregator: EventAggregator,
    protected ethereumService: EthereumService,
    private launchService: LaunchService,
    private numberService: NumberService,
  ) {}

  public async activate(model: IAddClassModal): Promise<void> {
    this.model = model;
    if (!this.tokenList) {
      this.tokenList = await this.launchService.fetchFundingTokenInfos();
    }
    if (model.parameter) {
      this.className = model.parameter.class.className;
      this.projectTokenPurchaseLimit = model.parameter.class.projectTokenPurchaseLimit;
      this.allowList = model.parameter.class.allowList;
      this.token = model.parameter.class.token;
      this.tokenExchangeRatio = model.parameter.class.tokenExchangeRatio;
      this.fundingTokensTarget = model.parameter.class.fundingTokensTarget;
      this.fundingTokenMaximum = model.parameter.class.fundingTokenMaximum;
      this.vestingPeriod = model.parameter.class.vestingPeriod;
      this.vestingCliff = model.parameter.class.vestingCliff;
    }
  }

  protected validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }

  async validateInputs(): Promise<string> {
    let message: string;

    if (!this.className) {
      message = "Please enter Class Name";
    } else if (!this.projectTokenPurchaseLimit) {
      message = "Project Token Purchase Limit";
    } else if (!this.numberService.stringIsNumber(this.vestingPeriod) || this.vestingPeriod < 0) {
      message = "Please enter a number greater than or equal to zero for \"Project tokens vested for\" ";
    } else if (!this.numberService.stringIsNumber(this.vestingCliff) || this.vestingCliff < 0) {
      message = "Please enter a number greater than or equal to zero for \"with a cliff of\" ";
    } else if (this.vestingCliff > this.vestingPeriod) {
      message = "Please enter a value of \"with a cliff of\" less than \"Project tokens vested for\"";
    } else if (!Utils.isAddress(this.token?.address)) {
      message = "Please select a Funding Token seed";
    } else if (!this.tokenExchangeRatio) {
      message = "Please enter a value for Project Token Exchange Ratio";
    } else if (!this.fundingTokensTarget) {
      message = "Please enter a number greater than zero for the Funding Target";
    } else if (!this.fundingTokenMaximum) {
      message = "Please enter a number greater than zero for the Funding Maximum";
    } else if (BigNumber.from(this.fundingTokensTarget).gt(this.fundingTokenMaximum)) {
      message = "Please enter a value for Funding Target less than or equal to Funding Maximum";
    }


    this.verified = !message;
    return Promise.resolve(message);
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }

  tokenChanged(): void {
  }

  resetModal(): void {
    this.className = undefined;
    this.projectTokenPurchaseLimit = undefined;
    this.allowList = undefined;
    this.token = undefined;
    this.tokenExchangeRatio = undefined;
    this.fundingTokensTarget = undefined;
    this.fundingTokenMaximum = undefined;
    this.vestingPeriod = undefined;
    this.vestingCliff = undefined;
  }

  async addClass(): Promise<boolean | void> {
    const message: string = await this.validateInputs();

    if (message) {
      this.validationError(message);
      return false;
    } else {
      const newClass = {
        className: this.className,
        projectTokenPurchaseLimit: this.projectTokenPurchaseLimit,
        allowList: this.allowList,
        token: this.token,
        tokenExchangeRatio: this.tokenExchangeRatio,
        fundingTokensTarget: this.fundingTokensTarget,
        fundingTokenMaximum: this.fundingTokenMaximum,
        vestingPeriod: this.vestingPeriod,
        vestingCliff: this.vestingCliff,
      };
      this.model.addFunction(newClass);
      this.resetModal();
      await this.controller.ok();
    }
  }

  editClass(): void {
    const newClass: IClass = {
      className: this.className,
      projectTokenPurchaseLimit: this.projectTokenPurchaseLimit,
      allowList: this.allowList,
      token: this.token,
      tokenExchangeRatio: this.tokenExchangeRatio,
      fundingTokensTarget: this.fundingTokensTarget,
      fundingTokenMaximum: this.fundingTokenMaximum,
      vestingPeriod: this.vestingPeriod,
      vestingCliff: this.vestingCliff,
    };
    const index = this.model.parameter.index;
    this.model.editFunction({newClass, index});
  }
}

interface IAddClassModal {
  parameter: IParameter | undefined;
  addFunction: (newClass: IClass) => void,
  editFunction: ({ newClass, index }: {newClass: IClass; index: number}) => void,
}

export interface IParameter {
  class: IClass,
  index: number
}
