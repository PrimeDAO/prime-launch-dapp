import { ILaunchConfig } from "../launchConfig";
import { ConsoleLogService } from "services/ConsoleLogService";
import { BigNumber } from "ethers";
import { autoinject, computedFrom } from "aurelia-framework";
import { Router } from "aurelia-router";
import { BaseStage } from "newLaunch/baseStage";
import { ITokenInfo, TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";
import { Utils } from "services/utils";
// import { fromWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";
import { capitalizeNetworkName, EthereumService } from "services/EthereumService";

@autoinject
export class Stage3 extends BaseStage<ILaunchConfig> {
  loadingToken = false;
  logoIcon: HTMLElement;
  logoIsLoaded = false;
  private projectTokenAddressText: string;

  constructor(
    eventAggregator: EventAggregator,
    tokenService: TokenService,
    ethereumService: EthereumService,
    private numberService: NumberService,
    private consoleLogService: ConsoleLogService,
    router: Router,
  ) {
    super(router, ethereumService, eventAggregator, tokenService);
  }

  bind(): void {
    this.projectTokenAddressText = `The ${capitalizeNetworkName()} address of the token you are offering to contributors`;

    if (!this.wizardState.stage3State) {
      this.wizardState.stage3State = {} as any;
    }
  }

  attached(): void {

    this.projectTokenAddressText = `The ${capitalizeNetworkName()} address of the token you are offering to contributors`;
  }

  addTokenDistribution(): void {
    // Create a new custom link object
    this.launchConfig.tokenDetails.tokenDistrib.push({stakeHolder: undefined, amount: undefined, cliff: undefined, vest: undefined});
  }

  // Delet a row in the custom links array
  deleteTokenDistribution(index:number): void {
    // Remove the indexed link
    this.launchConfig.tokenDetails.tokenDistrib.splice(index, 1);
  }


  private isValidLogo(): void {
    if (!Utils.isValidUrl(encodeURI(this.launchConfig.tokenDetails.projectTokenInfo.logoURI))) {
      this.isLoadedLogo(false);
    }
  }

  private async setTokenStateMessage(): Promise<string> {
    let message;
    if (!Utils.isAddress(this.launchConfig.tokenDetails.projectTokenInfo.address)) {
      message = "Please enter a valid address for the Project Token Address";
    } else if (!this.wizardState.stage3State.isValidTokenAddress) {
      message = "Please enter a project token address that references a valid IERC20 token contract";
    } else if (!this.logoIsLoaded) {
      message = "No valid image found at the provided project token logo URL";
    }
    return this.wizardState.stage3State.projectTokenErrorMessage = message;
  }

  private isLoadedLogo(valid: boolean): void {
    this.logoIsLoaded = valid;
    if (!valid) {
      //this.wizardState.stage3State.tiLogoInputPresupplied = false;
      // if (this.launchConfig.tokenDetails.projectTokenInfo.address) {
      //   this.launchConfig.tokenDetails.projectTokenInfo.manuallyEntered = true;
      // }
      this.wizardState.stage3State.formIsEditable = true;
      this.setTokenStateMessage();
    } else {
      this.wizardState.stage3State.projectTokenErrorMessage = null;
    }
  }

  @computedFrom("launchConfig.tokenDetails.projectTokenInfo.address", "logoIsLoaded")
  get projectTokenInfoIsComplete(): boolean {
    return this.launchConfig.tokenDetails.projectTokenInfo.address &&
      this.wizardState.stage3State.isValidTokenAddress &&
      !this.tokenIsMissingMetadata(this.launchConfig.tokenDetails.projectTokenInfo) &&
      this.logoIsLoaded;
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

    message = await this.setTokenStateMessage();

    if (!message && this.tokenIsMissingMetadata(this.launchConfig.tokenDetails.projectTokenInfo)) {
      message = "Please enter all information required to describe the project token";
    }

    // if (!message && !this.logoIsLoaded) {
    //   message = "No valid image found at the provided project token logo URL";
    // }

    else if (!message && (!this.launchConfig.tokenDetails.maxSupply || (this.launchConfig.tokenDetails.maxSupply === "0"))) {
      message = "Please enter a number greater than zero for Maximum Supply";
    } else if (!message && this.launchConfig.tokenDetails.tokenDistrib?.length === 0) {
      message = "Please add at least one stakeholder group distribution";
    // } else if (this.launchConfig.launchDetails.fundingMax && this.launchConfig.launchDetails.pricePerToken &&
    //   this.numberService.fromString(fromWei(this.launchConfig.launchDetails.fundingMax, this.launchConfig.launchDetails.fundingTokenInfo.decimals)) >
    //   this.numberService.fromString(fromWei(this.launchConfig.tokenDetails.maxSupply, this.launchConfig.tokenDetails.projectTokenInfo.decimals)) *
    //     this.numberService.fromString(fromWei(this.launchConfig.launchDetails.pricePerToken, this.launchConfig.launchDetails.fundingTokenInfo.decimals))) {
    //   message = "Funding Maximum cannot be greater than Maximum Project Token Supply times the Project Token Exchange Ratio";
    } else {
      // Check the token distribution
      let totalDistribAmount = BigNumber.from("0");
      this.launchConfig.tokenDetails.tokenDistrib.forEach((tokenDistrb: { stakeHolder: string, amount: string, cliff: number, vest: number }) => {
        if (!tokenDistrb.stakeHolder) {
          message = "Please enter a name for Stakeholder";
        } else if (!tokenDistrb.amount) {
          message = `Please enter an amount for ${tokenDistrb.stakeHolder}`;
        } else if (!this.numberService.stringIsNumber(tokenDistrb.cliff) || tokenDistrb.cliff<0) {
          message = `Please enter a cliff greater than or equal to zero for ${tokenDistrb.stakeHolder}`;
        } else if (!this.numberService.stringIsNumber(tokenDistrb.vest) || tokenDistrb.vest<0) {
          message = `Please enter a vesting period greater than or equal to zero for ${tokenDistrb.stakeHolder}`;
        } else if (tokenDistrb.vest < tokenDistrb.cliff) {
          message = `Please enter for ${tokenDistrb.stakeHolder} a cliff that is less than or equal to the vesting period`;
        } else {
          totalDistribAmount = totalDistribAmount.add(tokenDistrb.amount);
        }
      });
      if (!message && !totalDistribAmount.eq(this.launchConfig.tokenDetails.maxSupply)) {
        message = "The sum of the Project Token Global Distributions must equal the Maximum Supply of Project tokens";
      }
    }
    this.stageState.verified = !message;
    return Promise.resolve(message);
  }

  async getTokenInfo(): Promise<void> {
    /**
       * note that launchConfig.tokenDetails.projectTokenInfo.address may have been set in a previous instance of this viewmodel
       * wizardState.stage3State gives us clues about whether/how it should be editable.
       */
    if (this.wizardState.stage3State.lastCheckedAddress !== this.launchConfig.tokenDetails.projectTokenInfo.address) {

      if (!Utils.isAddress(this.launchConfig.tokenDetails.projectTokenInfo.address)) {
        this.wizardState.stage3State.isValidTokenAddress = false;
        this.launchConfig.tokenDetails.projectTokenInfo = { address: this.launchConfig.tokenDetails.projectTokenInfo.address } as unknown as ITokenInfo;
        this.setTokenStateMessage();
      } else {
        this.loadingToken = true;

        try {
          const tokenAddress = this.launchConfig.tokenDetails.projectTokenInfo.address;

          const tokenInfo = await this.tokenService.getTokenInfoFromAddress(tokenAddress);

          if (!await this.tokenService.isERC20Token(tokenAddress)) {
            throw new Error(`Token address does not reference an IERC20 contract: ${tokenAddress}`);
          }

          if (!tokenInfo.logoURI) {
            await this.tokenService.getTokenGeckoInfo(tokenInfo);
          }

          this.launchConfig.tokenDetails.projectTokenInfo = Object.assign({
            address: tokenInfo.address,
            decimals: tokenInfo.decimals,
            logoURI: tokenInfo.logoURI,
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
          }) as ITokenInfo;

          this.wizardState.stage3State.isValidTokenAddress = true;

        } catch (error) {
        // then is probably not a valid token contract
        // this.validationError("Could not obtain project token information from the address supplied");
          this.consoleLogService.logMessage(`error loading project token info: ${error?.message ?? error}`, "info");
          this.launchConfig.tokenDetails.projectTokenInfo = { address: this.launchConfig.tokenDetails.projectTokenInfo.address } as unknown as ITokenInfo;
          this.wizardState.stage3State.isValidTokenAddress = false;
          this.setTokenStateMessage();
        }
        finally {
          this.loadingToken = false;
        }
      }
    }

    if (this.wizardState.stage3State.isValidTokenAddress) {
      if (this.tokenIsMissingMetadata(this.launchConfig.tokenDetails.projectTokenInfo)) {
        if (this.launchConfig.tokenDetails.projectTokenInfo.name !== TokenService.DefaultNameSymbol) {
          this.wizardState.stage3State.tiNameInputPresupplied = true;
        } else {
          this.wizardState.stage3State.tiNameInputPresupplied = false;
          this.launchConfig.tokenDetails.projectTokenInfo.name = "";
          this.wizardState.stage3State.formIsEditable = true;
        }
        if (this.launchConfig.tokenDetails.projectTokenInfo.symbol !== TokenService.DefaultNameSymbol) {
          this.wizardState.stage3State.tiSymbolInputPresupplied = true;
        } else {
          this.wizardState.stage3State.tiSymbolInputPresupplied = false;
          this.launchConfig.tokenDetails.projectTokenInfo.symbol = "";
          this.wizardState.stage3State.formIsEditable = true;
        }
        if (this.launchConfig.tokenDetails.projectTokenInfo.decimals !== TokenService.DefaultDecimals) {
          this.wizardState.stage3State.tiDecimalsInputPresupplied = true;
        } else {
          this.wizardState.stage3State.tiDecimalsInputPresupplied = false;
          this.launchConfig.tokenDetails.projectTokenInfo.decimals = 0;
          this.wizardState.stage3State.formIsEditable = true;
        }
        this.wizardState.stage3State.tiLogoInputPresupplied = false;
        this.wizardState.stage3State.formIsEditable = true;
        if (this.launchConfig.tokenDetails.projectTokenInfo.logoURI !== TokenService.DefaultLogoURI) {
          this.wizardState.stage3State.tiLogoInputPresupplied = false; // true;
        } else {
          this.wizardState.stage3State.tiLogoInputPresupplied = false;
          this.launchConfig.tokenDetails.projectTokenInfo.logoURI = "";
          this.wizardState.stage3State.formIsEditable = true;
        }
      } else { // tokenConfig metadata is complete
        this.wizardState.stage3State.formIsEditable = false;
        this.wizardState.stage3State.tiLogoInputPresupplied = false;
        this.wizardState.stage3State.tiSymbolInputPresupplied =
            this.wizardState.stage3State.tiDecimalsInputPresupplied =
            this.wizardState.stage3State.tiNameInputPresupplied = true;
      }
      this.launchConfig.tokenDetails.maxSupply = null; // because decimals may change

      if (!this.logoIsLoaded) {
        this.wizardState.stage3State.projectTokenErrorMessage = "No valid image found at the provided project token logo URL";
      }
    } else { // address is no good
      this.wizardState.stage3State.formIsEditable = false;
      this.wizardState.stage3State.tiLogoInputPresupplied =
          this.wizardState.stage3State.tiSymbolInputPresupplied =
          this.wizardState.stage3State.tiDecimalsInputPresupplied =
          this.wizardState.stage3State.tiNameInputPresupplied = false;
    }
    this.wizardState.stage3State.lastCheckedAddress = this.launchConfig.tokenDetails.projectTokenInfo.address;
  }
}
