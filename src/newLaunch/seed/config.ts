import {
  ILaunchConfig,
  IGeneral,
  IProjectDetails,
  ITokenDetails,
  IContactDetails,
} from "newLaunch/launchConfig";

export interface ISeedDetails {
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
  startDate: string,
  endDate: string,
  whitelist: string,
  geoBlock: boolean,
  legalDisclaimer: string,
  adminAddress: string,
}

export interface ISeedConfig extends ILaunchConfig {
  seedDetails: ISeedDetails;
}

export class SeedConfig implements ISeedConfig {
  public version: string;
  public general: IGeneral;
  public projectDetails:IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public seedDetails: ISeedDetails;

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

    this.seedDetails = {
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
