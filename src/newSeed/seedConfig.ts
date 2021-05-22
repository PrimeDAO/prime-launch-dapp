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
  category: string,
}

export interface ITokenDetails {
  fundingAddress: string,
  fundingSymbol: string,
  seedAddress: string,
  seedSymbol: string,
  /**
   * In wei
   */
  // maxSupply: string,
  /**
   * In wei
   */
  // initSupply: string,
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
   * The price of one seed token in units of funding tokens
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
  vestingDays: number,
  vestingCliff: number,
  startDate: string,
  endDate: string,
  whitelist: { isWhitelist: boolean, whitelistFile: string }
  geoBlock: boolean,
  legalDisclaimer: boolean
}

export interface IContactDetails {
  contactEmail: string,
  remarks: string,
  logo: string
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
}

export class SeedConfig implements ISeedConfig {
  public version = "1.0.0";
  public general = {
    customLinks: [],
  } as IGeneral;
  public projectDetails = {
    summary: "",
    proposition: "",
    category: "",
  } as IProjectDetails;
  public tokenDetails = {
    tokenDistrib: [],
  } as ITokenDetails;
  public contactDetails={
    remarks: "",
  } as IContactDetails;
  public seedDetails = {
    whitelist: {
      isWhitelist: false,
      whitelistFile: undefined,
    },
    geoBlock: false,
    legalDisclaimer: false,
  } as ISeedDetails;
}
