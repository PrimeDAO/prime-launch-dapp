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
import { Address, SeedVersions } from "types/types";

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
  isPermissoned: boolean,
  legalDisclaimer: string,
  allowList: Address[],
  seedTip: number,
}

export interface ISeedConfig extends ILaunchConfig {
  launchDetails: ISeedDetails,
}

export class SeedConfig extends LaunchConfig implements ISeedConfig {
  public version = SeedVersions.v2;
  public general: IGeneral;
  public projectDetails:IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public launchDetails: ISeedDetails;
  public classes: IClass[];

  clearState(): void {
    super.clearState();
    this.version = SeedVersions.v2;
    this.launchDetails.pricePerToken = null;
    this.launchDetails.fundingTarget = "";
    this.launchDetails.fundingMax = "";
    this.launchDetails.vestingPeriod = null;
    this.launchDetails.vestingCliff = null;
    this.launchDetails.legalDisclaimer = "";
  }
}
