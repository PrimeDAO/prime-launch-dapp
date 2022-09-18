import { ITokenInfo } from "services/TokenTypes";

export const SocialLinkNames = [
  "Twitter",
  "Discord",
  "Telegram",
  "Reddit",
  "LinkedIn",
];

export class SocialLinkSpec {
  public media: string;
  public url: string;
}

export interface IGeneral {
  projectName: string,
  projectWebsite: string,
  whitepaper: string,
  github: string,
  customLinks: Array<SocialLinkSpec>
}

export interface IProjectDetails {
  summary: string,
  proposition: string,
  teamDescription: string
}

export interface ITokenDetails {
  projectTokenInfo: ITokenInfo,
  /**
   * In wei, maximum ever total supply of project tokens
   */
  maxSupply: string,
  /**
   * In wei,
   */
  tokenDistrib: Array<{
    stakeHolder: string,
    /**
     * In wei
     */
    amount: string,
    /**
     * In days
     */
    cliff: number,
    vest: number
  }>
}

export interface IContactDetails {
  contactEmail: string,
  remarks: string
}

export interface ILaunchDetails {
  fundingTokenInfo: ITokenInfo,
  startDate: string,
  endDate: string,
  adminAddress: string,
  legalDisclaimer: string,
  geoBlock: boolean,
}

export interface IClass {
  className: string;
  projectTokenPurchaseLimit: string;
  allowList: string;
  token: ITokenInfo;
  tokenExchangeRatio: number;
  fundingTokensTarget: string;
  fundingTokenMaximum: string;
  vestingPeriod: number;
  vestingCliff: number;
}

export interface ILaunchConfig {
  /**
   * semantic version of this interface. This value must be updated upon any released changes.
   */
  version: string,
  general: IGeneral,
  projectDetails: IProjectDetails,
  tokenDetails: ITokenDetails,
  contactDetails: IContactDetails,
  launchDetails: ILaunchDetails,
  class: IClass,
  classes: IClass[],
  clearState: () => void
}

export class LaunchConfig implements ILaunchConfig {
  public version: string;
  public general: IGeneral;
  public projectDetails: IProjectDetails;
  public tokenDetails: ITokenDetails;
  public contactDetails: IContactDetails;
  public launchDetails: ILaunchDetails;
  public class: IClass;
  public classes: IClass[];

  constructor() {
    this.clearState();
  }

  clearState(): void {
    this.version = "1.0.0";
    this.general = {
      projectName: "",
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
      projectTokenInfo: {} as unknown as ITokenInfo,
    };

    this.contactDetails = {
      contactEmail: "",
      remarks: "",
    };

    this.launchDetails = {
      fundingTokenInfo: {} as unknown as ITokenInfo,
      startDate: "",
      endDate: "",
      adminAddress: "",
      legalDisclaimer: "",
      geoBlock: false,
    };

    this.class = {
      className: "",
      projectTokenPurchaseLimit: "",
      allowList: "",
      token: null,
      tokenExchangeRatio: null,
      fundingTokensTarget: "",
      fundingTokenMaximum: "",
      vestingPeriod: null,
      vestingCliff: null,
    }

    this.classes = [];
  }
}
