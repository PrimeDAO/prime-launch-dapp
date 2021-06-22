import { BigNumber } from "ethers";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { BaseStage } from "newSeed/baseStage";
import { ITokenInfo, TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";
import { Utils } from "services/utils";
import { fromWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";

@autoinject
export class Stage3 extends BaseStage {
  private fundingSymbol: string;
  private seedSymbol: string;

  private fundingIcon: string;
  private seedIcon: string;

  constructor(
    eventAggregator: EventAggregator,
    private tokenService: TokenService,
    private numberService: NumberService,
    router: Router,
  ) {
    super(router, eventAggregator);
  }

  addTokenDistribution(): void {
    // Create a new custom link object
    this.seedConfig.tokenDetails.tokenDistrib.push({category: undefined, amount: undefined, lockup: undefined});
  }

  // Delet a row in the custom links array
  deleteTokenDistribution(index:number): void {
    // Remove the indexed link
    this.seedConfig.tokenDetails.tokenDistrib.splice(index, 1);
  }

  async proceed(): Promise<void> {
    const message: string = await this.validateInputs();
    if (message) {
      this.validationError(message);
    } else {
      this.next();
    }
  }

  persistData(): void {
    this.wizardState.seedTokenSymbol = this.seedSymbol;
    this.wizardState.fundingTokenSymbol = this.fundingSymbol;
  }

  validateInputs(): string {
    let message: string;
    if (!Utils.isAddress(this.seedConfig.tokenDetails.fundingAddress)) {
      message = "Please enter a valid address for the Funding Token Address";
    } else if (!Utils.isAddress(this.seedConfig.tokenDetails.seedAddress)) {
      message = "Please enter a valid address for the Seed Token Address";
    } else if (!this.seedConfig.tokenDetails.maxSeedSupply || this.seedConfig.tokenDetails.maxSeedSupply === "0") {
      message = "Please enter a number greater than zero for Maximum Supply";
    } else if (this.seedConfig.seedDetails.fundingMax && this.seedConfig.seedDetails.pricePerToken &&
      this.numberService.fromString(fromWei(this.seedConfig.seedDetails.fundingMax)) > this.numberService.fromString(fromWei(this.seedConfig.tokenDetails.maxSeedSupply)) * this.numberService.fromString(fromWei(this.seedConfig.seedDetails.pricePerToken))) {
      message = "Funding Max cannot be greater than Maximum Seed Token Supply times the Funding Tokens per Seed Token";
    } else if (!this.seedConfig.tokenDetails.initialSeedSupply || this.seedConfig.tokenDetails.initialSeedSupply === "0") {
      message = "Please enter a number greater than zero for Initial Supply";
    } else if (BigNumber.from(this.seedConfig.tokenDetails.initialSeedSupply).gt(this.seedConfig.tokenDetails.maxSeedSupply)) {
      message = "Please enter a value for Initial Supply smaller than Maximum Supply";
    } else {
      // Check the token distribution
      let totalDistribAmount = BigNumber.from("0");
      this.seedConfig.tokenDetails.tokenDistrib.forEach((tokenDistrb: { category: string, amount: string, lockup: number }) => {
        if (!tokenDistrb.category) {
          message = "Please enter a value for Category";
        } else if (!tokenDistrb.amount || tokenDistrb.amount === "0") {
          message = `Please enter a number greater than zero for Category ${tokenDistrb.category} Amount`;
        } else if (!(tokenDistrb.lockup > 0)) {
          message = `Please enter a number greater than zero for Category ${tokenDistrb.category} Lock-up`;
        } else {
          totalDistribAmount = totalDistribAmount.add(tokenDistrb.amount);
        }
      });
      if (!message && totalDistribAmount.gt(this.seedConfig.tokenDetails.maxSeedSupply)) {
        message = "The sum of the Seed Token Global Distributions should not be greater than the Maximum Supply of Seed tokens";
      }
    }
    this.stageState.verified = !message;
    return message;
  }

  // TODO: Add a loading comp to the view while fetching
  getTokenInfo(type: string): void {
    if (type === "fund") {
      if (this.seedConfig.tokenDetails.fundingAddress) {
        this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.fundingAddress).then((tokenInfo: ITokenInfo) => {
          this.fundingSymbol = (tokenInfo.symbol !== "N/A") ? tokenInfo.symbol : undefined;
          this.fundingIcon = (tokenInfo.symbol !== "N/A") ? tokenInfo.icon : undefined;
        }).catch(() => {
          this.validationError("Could not get token info from the address supplied");
        });
      } else {
        this.fundingSymbol = undefined;
        this.fundingIcon = undefined;
      }
    } else if (type === "seed") {
      if (this.seedConfig.tokenDetails.seedAddress) {
        this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.seedAddress).then((tokenInfo: ITokenInfo) => {
          this.seedSymbol = (tokenInfo.symbol !== "N/A") ? tokenInfo.symbol : undefined;
          this.seedIcon = (tokenInfo.symbol !== "N/A") ? tokenInfo.icon : undefined;
        }).catch(() => {
          this.validationError("Could not get token info from the address supplied");
        });
      } else {
        this.seedSymbol = undefined;
        this.seedIcon = undefined;
      }
    }
  }

}
