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
  private lastCheckedSeedAddress: string;

  private seedSymbol: string;
  private seedIcon: string;

  constructor(
    eventAggregator: EventAggregator,
    tokenService: TokenService,
    private numberService: NumberService,
    router: Router) {
    super(router, eventAggregator, tokenService);
  }

  addTokenDistribution(): void {
    // Create a new custom link object
    this.seedConfig.tokenDetails.tokenDistrib.push({stakeHolder: undefined, amount: undefined, cliff: undefined, vest: undefined});
  }

  // Delet a row in the custom links array
  deleteTokenDistribution(index:number): void {
    // Remove the indexed link
    this.seedConfig.tokenDetails.tokenDistrib.splice(index, 1);
  }

  persistData(): void {
    this.wizardState.projectTokenSymbol = this.seedSymbol;
    this.wizardState.projectTokenIcon = this.seedIcon;
  }

  async validateInputs(): Promise<string> {
    let message: string;
    if (!Utils.isAddress(this.seedConfig.tokenDetails.projectTokenAddress)) {
      message = "Please enter a valid address for the Project Token Address";
    } else if (!this.seedConfig.tokenDetails.maxSeedSupply || this.seedConfig.tokenDetails.maxSeedSupply === "0") {
      message = "Please enter a number greater than zero for Maximum Supply";
    } else if (this.seedConfig.seedDetails.fundingMax && this.seedConfig.seedDetails.pricePerToken &&
      this.numberService.fromString(fromWei(this.seedConfig.seedDetails.fundingMax)) > this.numberService.fromString(fromWei(this.seedConfig.tokenDetails.maxSeedSupply)) * this.numberService.fromString(fromWei(this.seedConfig.seedDetails.pricePerToken))) {
      message = "Funding Maximum cannot be greater than Maximum Project Token Supply times the Funding Tokens per Project Token";
    } else if (!(await this.checkToken(this.seedConfig.tokenDetails.projectTokenAddress))) {
      message = "Project token address is not a valid contract";
    } else {
      // Check the token distribution
      let totalDistribAmount = BigNumber.from("0");
      this.seedConfig.tokenDetails.tokenDistrib.forEach((tokenDistrb: { stakeHolder: string, amount: string, cliff: number, vest: number }) => {
        if (!tokenDistrb.stakeHolder) {
          message = "Please enter a name for Stakeholder";
        } else if (!tokenDistrb.amount) {
          message = `Please enter an amount for ${tokenDistrb.stakeHolder}`;
        } else if (!tokenDistrb.cliff) {
          message = `Please enter the cliff for ${tokenDistrb.stakeHolder}`;
        } else if (!tokenDistrb.vest) {
          message = `Please enter the vesting period for ${tokenDistrb.stakeHolder}`;
        } else {
          totalDistribAmount = totalDistribAmount.add(tokenDistrb.amount);
        }
      });
      if (!message && totalDistribAmount.gt(this.seedConfig.tokenDetails.maxSeedSupply)) {
        message = "The sum of the Project Token Global Distributions should not be greater than the Maximum Supply of Project tokens";
      }
    }
    this.stageState.verified = !message;
    return Promise.resolve(message);
  }

  // TODO: Add a loading comp to the view while fetching
  getTokenInfo(): void {
    if (this.seedConfig.tokenDetails.projectTokenAddress?.length) {
      if (this.lastCheckedSeedAddress !== this.seedConfig.tokenDetails.projectTokenAddress) {
        this.lastCheckedSeedAddress = this.seedConfig.tokenDetails.projectTokenAddress;
        this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.projectTokenAddress).then((tokenInfo: ITokenInfo) => {
          if (tokenInfo.symbol === "N/A") {
            throw new Error();
          } else {
            this.seedSymbol = tokenInfo.symbol;
            this.seedIcon = tokenInfo.logoURI;
          }
        }).catch(() => {
          this.validationError("Could not obtain project token information from the address supplied");
          this.seedSymbol = this.seedIcon = undefined;
        });
      }
    } else {
      this.lastCheckedSeedAddress = this.seedSymbol = this.seedIcon = undefined;
    }
  }
}
