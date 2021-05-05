import { BigNumber } from "ethers";
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
  maxSupply: BigNumber,
  /**
   * In wei
   */
  initSupply: BigNumber,
  tokenDistrib: Array<{
    category: string,
    /**
     * In wei
     */
    amount: BigNumber,
    /**
     * In days
     */
    lockup: number
  }>
}

export interface ISeedDetails {
  /**
   * In Wei ??
   */
  seedTokens: BigNumber,
  pricePerToken: BigNumber,
  baseCurrency: string,
  seedTarget: BigNumber,
  seedMax: BigNumber,
  vestingMonths: number,
  vestingDays: number,
  startDate: string,
  startTime: string,
  endDate: string,
  endTime: string,
  controller: string,
  rights: string,
  whitelist: { isWhitelist: boolean, whitelistFile: string }

}

export interface IContactDetails {
  contactEmail: string,
  remarks: string
}

export interface ISeedConfig {
  general: IGeneral,
  projectDetails: IProjectDetails,
  tokenDetails: ITokenDetails,
  contactDetails: IContactDetails,
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
  public seedDetails = {} as ISeedDetails;
}
