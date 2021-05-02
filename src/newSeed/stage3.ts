import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { BigNumber } from "ethers";
import { BaseStage } from "newSeed/baseStage";
import { ITokenInfo, TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";

@autoinject
export class Stage3 extends BaseStage {
  constructor(
    eventAggregator: EventAggregator,
    private tokenService: TokenService,
    router: Router,
  ) {
    super(router, eventAggregator);
  }
  addTokenDistribution(index:number): void {
    if (index === -1) {
      // Skip check
      // Create a new custom link object
      this.seedConfig.tokenDetails.tokenDistrib.push({category: undefined, amount: undefined, lockup: undefined});
    } else {
      // Create a new custom link object
      this.seedConfig.tokenDetails.tokenDistrib.push({category: undefined, amount: undefined, lockup: undefined});
    }
  }
  proceed(): void {
    let message: string;
    if (!this.seedConfig.tokenDetails.fundingTicker) {
      message = "Please enter a valid contract address for the Funding Token Address";
    } else if (!this.seedConfig.tokenDetails.seedTicker) {
      message = "Please enter a valid contract address for the Seed Token Address";
    }
    else if (!this.seedConfig.tokenDetails.maxSupply || this.seedConfig.tokenDetails.maxSupply.lte(0)) {
      message = "Please enter a non-zero number for Maximum Supply";
    }
    else if (!this.seedConfig.tokenDetails.initSupply || this.seedConfig.tokenDetails.initSupply.lte(0)) {
      message = "Please enter a non-zero number for Initial Supply";
    }
    // Check the token distribution
    this.seedConfig.tokenDetails.tokenDistrib.forEach((tokenDistrb: {category: string, amount: BigNumber, lockup: number}) => {
      if (!tokenDistrb.category) {
        message = "Please enter a value for Category";
      } else if (!tokenDistrb.amount || tokenDistrb.amount.lte(0)) {
        message = `Please enter a non-zero number for category ${tokenDistrb.category} Amount`;
      } else if (!tokenDistrb.lockup || tokenDistrb.lockup<= 0) {
        message = `Please enter a non-zero number for category ${tokenDistrb.category} Lock-up`;
      }
    });
    if (message) {
      this.validationError(message);
      this.stageState[this.stageNumber].verified = false;
    } else {
      this.stageState[this.stageNumber].verified = true;
      this.next();
    }
  }
  // TODO: Add a loading comp to the view while fetching
  getTokenInfo(type: string): void {
    if (type === "fund" && this.seedConfig.tokenDetails.fundingAddress) {
      this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.fundingAddress).then((tokeInfo: ITokenInfo) => {
        if (tokeInfo.symbol !== "N/A") {
          this.seedConfig.tokenDetails.fundingTicker = tokeInfo.symbol;
          this.seedConfig.tokenDetails.fundingIcon = tokeInfo.icon;
        } else {
          this.seedConfig.tokenDetails.fundingTicker = undefined;
          this.seedConfig.tokenDetails.fundingIcon = undefined;
        }
      }).catch(() => {
        this.validationError("Could not get token info from the address supplied");
      });
    } else if (type === "seed" && this.seedConfig.tokenDetails.seedAddress) {
      this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.seedAddress).then((tokeInfo: ITokenInfo) => {
        if (type === "seed" && tokeInfo.symbol !== "N/A"){
          this.seedConfig.tokenDetails.seedTicker = tokeInfo.symbol;
          this.seedConfig.tokenDetails.seedIcon = tokeInfo.icon;
        } else {
          this.seedConfig.tokenDetails.seedTicker = undefined;
          this.seedConfig.tokenDetails.seedIcon = undefined;
        }
      }).catch(() => {
        this.validationError("Could not get token info from the address supplied");
      });
    }
  }

}
