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
  fundingIcon: string,
  seedAddress: string,
  seedSymbol: string,
  seedIcon: string,
  /**
   * In wei
   */
  maxSupply: string,
  /**
   * In wei
   */
  initSupply: string,
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
  seedTokens: string,
  pricePerToken: string,
  baseCurrency: string,
  seedTarget: string,
  seedMax: string,
  vestingDays: number,
  vestingCliff: number,
  startDate: string,
  endDate: string,
  controller: string,
  rights: string,
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
  general: IGeneral,
  projectDetails: IProjectDetails,
  tokenDetails: ITokenDetails,
  contactDetails: IContactDetails,
  seedDetails: ISeedDetails,
}

export class SeedConfig implements ISeedConfig {
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
    baseCurrency: "DAI",
    whitelist: {
      isWhitelist: false,
      whitelistFile: undefined,
    },
    geoBlock: false,
    legalDisclaimer: false,
  } as ISeedDetails;
}
