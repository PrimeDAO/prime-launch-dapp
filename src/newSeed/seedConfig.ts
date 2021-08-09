/* eslint-disable @typescript-eslint/consistent-type-assertions */
export interface IGeneral {
  projectName: string,
  projectWebsite: string,
  category: string,
  whitepaper: string,
  github: string,
  customLinks: Array<{media: string, url: string }>
}

export interface IProjectDetails {
  summary: string,
  proposition: string,
  teamDescription: string,
  logo: string
}

export interface ITokenDetails {
  fundingAddress: string,
  seedAddress: string,
  /**
   * In wei, maximum ever total supply of project tokens
   */
  maxSeedSupply: string,
  /**
   * In wei,
   */
  initialSeedSupply: string,
  tokenDistrib: Array<{
    category: string,
    /**
     * In wei
     */
    amount: string,
    /**
     * In days
     */
    lockup: number
  }>
}

export interface ISeedDetails {
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

export interface IContactDetails {
  contactEmail: string,
  remarks: string
}

export interface ISeedConfig {
  /**
   * semantic version of this interface. This value must be updated upon any released changes.
   */
  version: string;
  general: IGeneral,
  projectDetails: IProjectDetails,
  tokenDetails: ITokenDetails,
  contactDetails: IContactDetails,
  seedDetails: ISeedDetails,
  clearState: () => void,
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
    } as IGeneral;
    this.projectDetails = {
      summary: "",
      proposition: "",
      teamDescription: "",
    } as IProjectDetails;
    this.tokenDetails = {
      tokenDistrib: [],
    } as ITokenDetails;
    this.contactDetails={
      remarks: "",
    } as IContactDetails;
    this.seedDetails = {
      geoBlock: false,
    } as ISeedDetails;
  }
}
