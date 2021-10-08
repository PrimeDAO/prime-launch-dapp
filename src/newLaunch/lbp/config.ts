import {
  ILaunchConfig,
  IGeneral,
  IProjectDetails,
  ITokenDetails,
  IContactDetails,
} from "newLaunch/launchConfig";

export interface ILbpDetails {
  fundingTokenAddress: string,
  amountProjectToken: string,
  amountFundingToken: string,
  startDate: string,
  endDate: string,
  startWeight: number,
  endWeight: number,
  legalDisclaimer: boolean,
  adminAddress: string,
}

export interface ILbpConfig extends ILaunchConfig {
  lbpDetails: ILbpDetails,
}

export class LbpConfig implements ILbpConfig {
  public version: string;
  public general: IGeneral;
  public projectDetails:IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public lbpDetails: ILbpDetails;

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

    this.lbpDetails = {
      fundingTokenAddress: "",
      amountFundingToken: "",
      amountProjectToken: "",
      startDate: "",
      endDate: "",
      startWeight: 80,
      endWeight: 80,
      legalDisclaimer: false,
      adminAddress: "",
    };
  }
}
