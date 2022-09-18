import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { ISeedConfig } from "newLaunch/seed/config";
import {EthereumService, fromWei, toWei } from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import { LaunchService } from "services/LaunchService";
import { IClass } from "newLaunch/launchConfig";
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


  className: string;
  projectTokenPurchaseLimit: string;
  allowList: string;
  token: ITokenInfo;
  tokenExchangeRatio: number;
  fundingTokensTarget: string;
  fundingTokenMaximum: string;
  vestingPeriod: number;
  vestingCliff: number
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
      const {
        className,
        projectTokenPurchaseLimit,
        allowList,
        token,
        tokenExchangeRatio,
        fundingTokensTarget,
        fundingTokenMaximum,
        vestingPeriod,
        vestingCliff,
      } = this.model.params.editedClass;

      this.className = className;
      this.projectTokenPurchaseLimit = projectTokenPurchaseLimit;
      this.allowList = allowList;
      this.token = token;
      this.tokenExchangeRatio = tokenExchangeRatio;
      this.fundingTokensTarget = fundingTokensTarget;
      this.fundingTokenMaximum = fundingTokenMaximum;
      this.vestingPeriod = vestingPeriod;
      this.vestingCliff = vestingCliff;
    }
    this.projectTokenInfo = this.model.params.projectTokenInfo;
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
    this.okButton.focus();
  }

  tokenChanged(): void {
    return;
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
        className: this.className,
        projectTokenPurchaseLimit: this.projectTokenPurchaseLimit,
        allowList: this.allowList,
        token: this.token,
        tokenExchangeRatio: this.tokenExchangeRatio,
        fundingTokensTarget: this.fundingTokensTarget.toString(),
        fundingTokenMaximum: this.fundingTokenMaximum.toString(),
        vestingPeriod: this.vestingPeriod,
        vestingCliff: this.vestingCliff,
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
        className: this.className,
        projectTokenPurchaseLimit: this.projectTokenPurchaseLimit,
        allowList: this.allowList,
        token: this.token,
        tokenExchangeRatio: this.tokenExchangeRatio,
        fundingTokensTarget: fromWei(this.fundingTokensTarget),
        fundingTokenMaximum: fromWei(this.fundingTokenMaximum),
        vestingPeriod: this.vestingPeriod,
        vestingCliff: this.vestingCliff,
      };
      const index = this.model.params.index;
      this.model.editFunction({editedClass, index, projectTokenInfo: this.projectTokenInfo});

      this.resetModal();
      await this.controller.ok();
    }
  }

  fillDummyValues() {
    this.className = "Test Class - " + new Date().toDateString();
    this.projectTokenPurchaseLimit = toWei(1000).toString();
    this.allowList = undefined;
    this.token = {
      "address": "0xF70d807A0828d2498fa01246c88bA5BaCd70889b",
      "chainId": 4,
      "name": "Prime",
      "symbol": "D2D",
      "decimals": 18,
      "logoURI": "https://raw.githubusercontent.com/PrimeDAO/tokenlists/main/logos/D2D.png",
      "id": "prime",
      "price": 0.055392
    };
    this.tokenExchangeRatio = 1.5;
    this.fundingTokensTarget = toWei(750).toString();
    this.fundingTokenMaximum = toWei(950).toString();
    this.vestingPeriod = 432000
    this.vestingCliff = 172800
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
