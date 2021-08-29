import { BigNumber } from "ethers";
import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { BaseStage } from "newSeed/baseStage";
import { ITokenInfo, TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";
import { Utils } from "services/utils";
import { fromWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";
import tippy from "tippy.js";

@autoinject
export class Stage3 extends BaseStage {
  private lastCheckedSeedAddress: string;
  formIsEditable: boolean;
  tiNameInputPresupplied: boolean;
  tiSymbolInputPresupplied: boolean;
  tiLogoInputPresupplied: boolean;
  loadingToken = false;
  errorIcon: HTMLElement;
  seedLogoIsValid = false;
  seedLogoIsLoaded = false;
  projectTokenErrorMessage: string;

  constructor(
    eventAggregator: EventAggregator,
    tokenService: TokenService,
    private numberService: NumberService,
    router: Router) {
    super(router, eventAggregator, tokenService);
  }

  attached(): void {
    tippy(this.errorIcon, {
      content: this.projectTokenErrorMessage,
    });
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


  private isValidImageFormat(file: string): boolean {
    const re = /(\.jpg|\.bmp|\.gif|\.png)$/i;
    return re.test(String(file).toLowerCase());
  }

  private isValidSeedLogo(): string {
    let message;

    if (!Utils.isValidUrl(encodeURI(this.wizardState.projectTokenInfo.logoURI))) {
      message = "Please enter a valid URL for project token logo";
    } else if (!this.isValidImageFormat(this.wizardState.projectTokenInfo.logoURI)) {
      message = "Please supply a valid image file type for project token logo";
    }
    this.seedLogoIsValid = !message;
    if (!this.seedLogoIsValid) {
      this.isLoadedSeedLogo(false);
    }

    return message;
  }

  private async isValidProjectTokenInfo(): Promise<string> {
    let message;
    if (!Utils.isAddress(this.seedConfig.tokenDetails.projectTokenAddress)) {
      message = "Please enter a valid address for the Project Token Address";
    } else if (!this.wizardState.projectTokenInfo ||
      (!(await this.tokenService.isERC20Token(this.seedConfig.tokenDetails.projectTokenAddress)))) {
      message = "Please enter a project token address that references a valid ERC20 token contract";
    }
    tippy(this.errorIcon, {
      content: message,
    });
    return this.projectTokenErrorMessage = message;
  }

  private isLoadedSeedLogo(valid: boolean): void {
    this.seedLogoIsLoaded = valid;
  }

  get projectTokenInfoIsComplete(): boolean {
    return this.wizardState.projectTokenInfo &&
      !this.tokenIsMissingMetadata(this.wizardState.projectTokenInfo) &&
      this.seedLogoIsValid && this.seedLogoIsLoaded;
  }

  private tokenIsMissingMetadata(tokenInfo: ITokenInfo): boolean {
    return (
      !tokenInfo.name || (tokenInfo.name === TokenService.DefaultNameSymbol) ||
    !tokenInfo.symbol || (tokenInfo.symbol === TokenService.DefaultNameSymbol) ||
    !tokenInfo.decimals || (tokenInfo.decimals === TokenService.DefaultDecimals) ||
    !tokenInfo.logoURI || (tokenInfo.logoURI === TokenService.DefaultLogoURI));
  }

  async validateInputs(): Promise<string> {
    let message: string;

    message = await this.isValidProjectTokenInfo();

    if (!message && !this.seedConfig.tokenDetails.maxSeedSupply || this.seedConfig.tokenDetails.maxSeedSupply === "0") {
      message = "Please enter a number greater than zero for Maximum Supply";
    } else if (this.seedConfig.seedDetails.fundingMax && this.seedConfig.seedDetails.pricePerToken &&
      this.numberService.fromString(fromWei(this.seedConfig.seedDetails.fundingMax)) > this.numberService.fromString(fromWei(this.seedConfig.tokenDetails.maxSeedSupply)) * this.numberService.fromString(fromWei(this.seedConfig.seedDetails.pricePerToken))) {
      message = "Funding Maximum cannot be greater than Maximum Project Token Supply times the Funding Tokens per Project Token";
    // } else if (!(await this.checkToken(this.seedConfig.tokenDetails.projectTokenAddress))) {
    //   message = "Project token address is not a valid contract";
      // else if (!Utils.isValidUrl(encodeURI(this.wizardState.projectTokenInfo.logoURI))) {
      //   message = "Please enter a valid URL for project token logo";
      // } else if (!this.isValidImageFormat(this.wizardState.projectTokenInfo.logoURI)) {
      //   message = "Please supply a valid image file type for project token logo";
      // } else if (!this.seedLogoIsLoaded) {
      //   message = "No valid image found at the provided project token logo URL";
      // }
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
    if (Utils.isAddress(this.seedConfig.tokenDetails.projectTokenAddress)) {
      if (this.lastCheckedSeedAddress !== this.seedConfig.tokenDetails.projectTokenAddress) {
        this.lastCheckedSeedAddress = this.seedConfig.tokenDetails.projectTokenAddress;
        this.loadingToken = true;
        this.tokenService.getTokenInfoFromAddress(this.seedConfig.tokenDetails.projectTokenAddress).then((tokenInfo: ITokenInfo) => {

          tokenInfo = Object.assign({}, tokenInfo);

          this.wizardState.projectTokenInfo = tokenInfo;

          if (this.tokenIsMissingMetadata(tokenInfo)) {

            tokenInfo.decimals = 18; // assume for now

            if (tokenInfo.name !== TokenService.DefaultNameSymbol) {
              this.tiNameInputPresupplied = true;
            } else {
              this.tiNameInputPresupplied = false;
              tokenInfo.name = "";
              this.formIsEditable = true;
            }
            if (tokenInfo.symbol !== TokenService.DefaultNameSymbol) {
              this.tiSymbolInputPresupplied = true;
            } else {
              this.tiSymbolInputPresupplied = false;
              tokenInfo.symbol = "";
              this.formIsEditable = true;
            }
            if (tokenInfo.logoURI !== TokenService.DefaultLogoURI) {
              this.tiLogoInputPresupplied = true;
            } else {
              this.tiLogoInputPresupplied = false;
              tokenInfo.logoURI = "";
              this.formIsEditable = true;
            }
            // then is a token contract, but can't obtain all the metadata for it

          } else {
            this.formIsEditable = false;
            this.tiLogoInputPresupplied =
            this.tiSymbolInputPresupplied =
            this.tiNameInputPresupplied = true;
          }
          // this.seedLogoIsValid = true; // assuming
          // this.seedLogoIsLoaded = true; // assuming
          this.projectTokenErrorMessage = null;
          this.loadingToken = false;
        }).catch(() => {
          // then is probably not a valid token contract
          // this.validationError("Could not obtain project token information from the address supplied");
          this.wizardState.projectTokenInfo = null;
          this.formIsEditable = false;
          this.loadingToken = false;
          this.isValidProjectTokenInfo();
        });
      }
    } else {
      this.lastCheckedSeedAddress = this.wizardState.projectTokenInfo = null;
      this.formIsEditable = false;
      this.isValidProjectTokenInfo();
    }
  }
}
