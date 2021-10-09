import {
  ILaunchConfig,
  IGeneral,
  IProjectDetails,
  ITokenDetails,
  IContactDetails,
  ILaunchDetails,
} from "newLaunch/launchConfig";

export interface ISeedDetails extends ILaunchDetails {
  fundingTokenAddress: string,
  /**
   * The price of one project token in units of funding tokens
   * In wei.
   */
  pricePerToken: string,
  /**
   * In wei
   */
  fundingTarget: string,
  /**
   * In wei
   */
  fundingMax: string,
  vestingPeriod: number,
  vestingCliff: number,
  whitelist: string,
  geoBlock: boolean,
  legalDisclaimer: string,
}

export interface ISeedConfig extends ILaunchConfig {
  launchDetails: ISeedDetails,
}

export class SeedConfig implements ISeedConfig {
  public version: string;
  public general: IGeneral;
  public projectDetails:IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public launchDetails: ISeedDetails;

  constructor() {
    this.clearState();
  }

  clearState(): void {
    this.version = "1.0.0";
    this.general = {
      projectName: "",
      category: "",
      customLinks: [],
      projectWebsite: "",
      whitepaper: "",
      github: "",
    };

    this.projectDetails = {
      summary: "",
      proposition: "",
      teamDescription: "",
    };

    this.tokenDetails = {
      tokenDistrib: [],
      maxSupply: "",
      projectTokenAddress: "",
    };

    this.contactDetails = {
      contactEmail: "",
      remarks: "",
    };

    this.launchDetails = {
      fundingTokenAddress: "",
      pricePerToken: "",
      fundingTarget: "",
      fundingMax: "",
      vestingPeriod: 0,
      vestingCliff: 0,
      startDate: "",
      endDate: "",
      whitelist: "",
      geoBlock: false,
      legalDisclaimer: "",
      adminAddress: "",
    };
  }
}
