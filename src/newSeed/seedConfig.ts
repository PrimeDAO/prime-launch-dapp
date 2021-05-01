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
  fundingTicker: string,
  fundingIcon: string,
  seedAddress: string,
  seedTicker: string,
  seedIcon: string,
  maxSupply: BigNumber,
  initSupply: BigNumber,
  tokenDistrib: Array<{category: string, amount: BigNumber, lockup:BigNumber}>
}

export interface ISeedConfig {
  general: IGeneral,
  projectDetails: IProjectDetails,
  tokenDetails: ITokenDetails,
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
}
