import {
  ILaunchConfig,
  IGeneral,
  IProjectDetails,
  ITokenDetails,
  IContactDetails,
  ILaunchDetails,
  LaunchConfig,
  IClass,
} from "newLaunch/launchConfig";

export interface ISeedDetails extends ILaunchDetails {
  /**
   * The price of one project token in units in eth (no precision).
   */
  pricePerToken: number,
  /**
   * In wei
   */
  fundingTarget: string,
  /**
   * In wei
   */
  fundingMax: string,
  /**
   * In wei
   */
  individualCap: string,
  vestingPeriod: number,
  vestingCliff: number,
  whitelist: string,
  isPermissoned: boolean,
  legalDisclaimer: string,
  seedTip: number,
}

export interface ISeedConfig extends ILaunchConfig {
  launchDetails: ISeedDetails,
}

export class SeedConfig extends LaunchConfig implements ISeedConfig {
  public version: string;
  public general: IGeneral;
  public projectDetails:IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public launchDetails: ISeedDetails;
  public classes: IClass[];

  clearState(): void {
    super.clearState();
    this.launchDetails.pricePerToken = null;
    this.launchDetails.fundingTarget = "";
    this.launchDetails.fundingMax = "";
    this.launchDetails.vestingPeriod = null;
    this.launchDetails.vestingCliff = null;
    this.launchDetails.whitelist = "";
    this.launchDetails.legalDisclaimer = "";
  }
}
