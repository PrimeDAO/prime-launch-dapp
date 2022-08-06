import { DialogController } from "aurelia-dialog";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, singleton } from "aurelia-framework";
import { ISeedConfig } from "newLaunch/seed/config";
import { EthereumService } from "services/EthereumService";
import { ITokenInfo } from "services/TokenService";
import "./addClass.scss";
import { LaunchService } from "services/LaunchService";
import { IClass } from "newLaunch/launchConfig";
// import "@stackoverflow/stacks/dist/css/stacks.min.css";

@singleton(false)
@autoinject
export class AddClassModal {

  private model: IAddClassModal;
  private okButton: HTMLElement;
  launchConfig: ISeedConfig;
  tokenList: Array<ITokenInfo>;


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
    eventAggregator: EventAggregator,
    ethereumService: EthereumService,
    private launchService: LaunchService,
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

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }

  tokenChanged(): void {
    console.log("THIS",
      this.className,
      this.projectTokenPurchaseLimit,
      this.allowList,
      this.token,
      this.tokenExchangeRatio,
      this.fundingTokensTarget,
      this.fundingTokenMaximum,
      this.vestingPeriod,
      this.vestingCliff,

    );
  }

  addClass(): void {
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
