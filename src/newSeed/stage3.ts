import { BigNumber } from "ethers";
import { BaseStage } from "newSeed/baseStage";
import { Utils } from "services/utils";

export class Stage3 extends BaseStage {
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
    if (!Utils.isValidUrl(this.seedConfig.tokenDetails.fundingAddress, false)) {
      message = "Please enter a valid url for Project Funding Token Address";
    }
    else if (!Utils.isValidUrl(this.seedConfig.tokenDetails.seedAddress, false)) {
      message = "Please enter a valid url for Seed Token Address";
    }
    else if (!this.seedConfig.tokenDetails.maxSupply || this.seedConfig.tokenDetails.maxSupply.lte(0)) {
      message = "Please enter a non-zero number for Maximum Supply";
    }
    else if (!this.seedConfig.tokenDetails.initSupply || this.seedConfig.tokenDetails.initSupply.lte(0)) {
      message = "Please enter a non-zero number for Initial Supply";
    }
    // Check the token distribution
    this.seedConfig.tokenDetails.tokenDistrib.forEach((tokenDistrb: {category: string, amount: BigNumber, lockup: BigNumber}) => {
      if (!tokenDistrb.category) {
        message = "Please enter a value for Category";
      } else if (!tokenDistrb.amount || tokenDistrb.amount.lte(0)) {
        message = `Please enter a non-zero number for category ${tokenDistrb.category} Amount`;
      } else if (!tokenDistrb.lockup || tokenDistrb.lockup.lte(0)) {
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
  getTokenInfo(): void {
    return null;
    // let tokenService = new TokenService();
    // this.TokenService.getTokenInfo(this.seedConfig.tokenDetails.fundingAddress).then((tokeInfo: ITokenInfo) => {
    //   this.seedConfig.tokenDetails.fundingTicker = tokeInfo.symbol;
    //   this.seedConfig.tokenDetails.fundingIcon = tokeInfo.icon;
    // }).catch(_err => {
    //   // Use error message
    // });
  }

}
