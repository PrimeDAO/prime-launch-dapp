import {
  ILaunchConfig,
  IGeneral,
  IProjectDetails,
  ITokenDetails,
  IContactDetails,
  ILaunchDetails,
} from "newLaunch/launchConfig";

export interface ILbpDetails extends ILaunchDetails {
  amountProjectToken: string,
  amountFundingToken: string,
  startWeight: number,
  endWeight: number,
}

export interface ILbpConfig extends ILaunchConfig {
  launchDetails: ILbpDetails,
}
export class LbpConfig implements ILaunchConfig {
  public version: string;
  public general: IGeneral;
  public projectDetails:IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public launchDetails: ILbpDetails;

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
      amountFundingToken: "",
      amountProjectToken: "",
      startDate: "",
      endDate: "",
      startWeight: 80,
      endWeight: 80,
      adminAddress: "",
      legalDisclaimer: "",
    };
  }
}
