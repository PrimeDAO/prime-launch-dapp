import { ILaunchConfig } from "newLaunch/launchConfig";
import { Address } from "services/EthereumService";
import { ITokenInfo } from "./TokenTypes";

export enum LaunchType {
  Seed = "seed",
  LBP = "lbp",
}

export interface ILaunch {
  launchType: LaunchType,
  address: Address,
  startTime: Date;
  endTime: Date;
  admin: Address;
  beneficiary: Address;

  startsInMilliseconds: number;
  endsInMilliseconds: number;
  hasNotStarted: boolean;
  isLive: boolean;
  isDead: boolean;
  uninitialized: boolean;
  canGoToDashboard: boolean;
  userHydrated: boolean;

  projectTokenAddress: Address;
  fundingTokenAddress: Address;
  fundingTokenInfo: ITokenInfo;
  projectTokenInfo: ITokenInfo;
  metadata: ILaunchConfig;
}
