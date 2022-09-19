import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import {EthereumService, toWei } from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import { LaunchService } from "services/LaunchService";
import { LaunchConfig, IClass } from "newLaunch/launchConfig";
import {Utils} from "../../../services/utils";
import {EventConfigFailure} from "../../../services/GeneralEvents";
import {NumberService} from "../../../services/NumberService";

import "./addClass.scss";
import {BigNumber} from "ethers";

@autoinject
export class AddClassModal {

  private model: IAddClassModal;
  private okButton: HTMLElement;
  projectTokenInfo: ITokenInfo;
  tokenList: Array<ITokenInfo>;

  verified: boolean;
  class: IClass = new LaunchConfig().class;
  isDev: boolean = false;

  constructor(
    private controller: DialogController,
    protected eventAggregator: EventAggregator,
    protected ethereumService: EthereumService,
    private launchService: LaunchService,
    private numberService: NumberService,
  ) {
    this.isDev = process.env.NODE_ENV === 'development' && this.ethereumService.defaultAccountAddress === "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1";
  }

  public async activate(model: IAddClassModal): Promise<void> {
    this.model = model;
    if (!this.tokenList) {
      this.tokenList = await this.launchService.fetchFundingTokenInfos();
    }
    if (model.params.index !== null) {
      this.class = { ...this.model.params.editedClass };
    }
    this.projectTokenInfo = this.model.params.projectTokenInfo;
  }

  protected validationError(message: string): void {
    this.eventAggregator.publish("handleValidationError", new EventConfigFailure(message));
  }

  async validateInputs(): Promise<string> {
    let message: string;

    if (!this.class.className) {
      message = "Please enter Class Name";
    } else if (!this.class.projectTokenPurchaseLimit) {
      message = "Project Token Purchase Limit";
    } else if (!this.numberService.stringIsNumber(this.class.vestingPeriod) || this.class.vestingPeriod < 0) {
      message = "Please enter a number greater than or equal to zero for \"Project tokens vested for\" ";
    } else if (!this.numberService.stringIsNumber(this.class.vestingCliff) || this.class.vestingCliff < 0) {
      message = "Please enter a number greater than or equal to zero for \"with a cliff of\" ";
    } else if (this.class.vestingCliff > this.class.vestingPeriod) {
      message = "Please enter a value of \"with a cliff of\" less than \"Project tokens vested for\"";
    } else if (!Utils.isAddress(this.class.token?.address)) {
      message = "Please select a Funding Token seed";
    } else if (!this.class.tokenExchangeRatio) {
      message = "Please enter a value for Project Token Exchange Ratio";
    } else if (!this.class.fundingTokensTarget) {
      message = "Please enter a number greater than zero for the Funding Target";
    } else if (!this.class.fundingTokenMaximum) {
      message = "Please enter a number greater than zero for the Funding Maximum";
    } else if (BigNumber.from(this.class.fundingTokensTarget).gt(this.class.fundingTokenMaximum)) {
      message = "Please enter a value for Funding Target less than or equal to Funding Maximum";
    }


    this.verified = !message;
    return Promise.resolve(message);
  }

  public attached(): void {
    this.okButton.focus();
  }

  tokenChanged(): void {
    return;
  }

  resetModal(): void {
    this.class.className = undefined;
    this.class.projectTokenPurchaseLimit = undefined;
    this.class.allowList = undefined;
    this.class.token = undefined;
    this.class.tokenExchangeRatio = undefined;
    this.class.fundingTokensTarget = undefined;
    this.class.fundingTokenMaximum = undefined;
    this.class.vestingPeriod = undefined;
    this.class.vestingCliff = undefined;
  }

  async save(): Promise<void> {
    if (this.model.params.index !== null) {
      await this.editClass();
    } else {
      await this.addClass();
    }
  }

  async addClass(): Promise<void> {
    const message: string = await this.validateInputs();

    if (message) {
      this.validationError(message);
      return;
    } else {
      const newClass: IClass = {
        className: this.class.className,
        projectTokenPurchaseLimit: this.class.projectTokenPurchaseLimit,
        allowList: this.class.allowList,
        token: this.class.token,
        tokenExchangeRatio: this.class.tokenExchangeRatio,
        fundingTokensTarget: this.class.fundingTokensTarget,
        fundingTokenMaximum: this.class.fundingTokenMaximum,
        vestingPeriod: this.class.vestingPeriod,
        vestingCliff: this.class.vestingCliff,
      };

      this.model.addFunction(newClass);
      this.resetModal();
      await this.controller.ok();
    }
  }

  async editClass(): Promise<void> {
    const message: string = await this.validateInputs();

    if (message) {
      this.validationError(message);
      return;
    } else {
      const editedClass: IClass = {
        className: this.class.className,
        projectTokenPurchaseLimit: this.class.projectTokenPurchaseLimit,
        allowList: this.class.allowList,
        token: this.class.token,
        tokenExchangeRatio: this.class.tokenExchangeRatio,
        fundingTokensTarget: this.class.fundingTokensTarget,
        fundingTokenMaximum: this.class.fundingTokenMaximum,
        vestingPeriod: this.class.vestingPeriod,
        vestingCliff: this.class.vestingCliff,
      };
      const index = this.model.params.index;
      this.model.editFunction({editedClass, index, projectTokenInfo: this.projectTokenInfo});

      this.resetModal();
      await this.controller.ok();
    }
  }

  fillDummyValues() {
    this.class.className = "Test Class - " + new Date().toDateString();
    this.class.projectTokenPurchaseLimit = toWei(1000, this.projectTokenInfo.decimals).toString();
    this.class.allowList = undefined;
    this.class.token = this.tokenList[0];
    this.class.tokenExchangeRatio = 1.5;
    this.class.fundingTokensTarget = toWei(750, this.class.token.decimals).toString();
    this.class.fundingTokenMaximum = toWei(950, this.class.token.decimals).toString();
    this.class.vestingPeriod = 432000
    this.class.vestingCliff = 172800
  }
}

interface IAddClassModal {
  params: {
    index: number,
    editedClass: IClass | undefined,
    projectTokenInfo: ITokenInfo,
  },
  addFunction: (newClass: IClass) => void,
  editFunction: ({ editedClass, index, projectTokenInfo }: IParameter) => void,
}

export interface IParameter {
  editedClass: IClass,
  index: number,
  projectTokenInfo: ITokenInfo,
}
