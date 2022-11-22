import { formatBytes32String } from "ethers/lib/utils";

import { ONE_DAY_IN_SECONDS } from "../../../../src/shared/shared";
import { IAddClassParams } from "../../../../src/types/types";
import { ISeedConfig } from "../../../../src/newLaunch/seed/config";
import { BigNumber } from "ethers";
import { getRandomId } from "../utilities";
import { e2eClassName } from "../e2eConstants";

const FUNDING_TARGET = "20000000000000000000";
const FUNDING_MAX = "64500000000000000000";
const INDIVIDUAL_CAP = "10000000000000000000";

/**
 * **************************
 * SEED
 * **************************
 */
const GENERAL_DATA = {
  projectName: "Testi",
  customLinks: [],
  projectWebsite: "https://www.prime.xyz/",
  whitepaper: "https://launch.prime.xyz/",
  github: "https://github.com/PrimeDAO",
};

const PROJECT_DETAILS = {
  summary: "Bananas for the Finance!",
  proposition: "Bananas for finance!",
  teamDescription: "Bananas for Finance!",
};

const LOCALHOST_CHAINID = 31337;
const TOKEN_DETAILS = {
  tokenDistrib: [
    {
      stakeHolder: "Prime Holders",
      amount: "100000000000000000000000000",
      cliff: 1,
      vest: 1,
    },
  ],
  maxSupply: "100000000000000000000000000",
  projectTokenInfo: {
    address: "0x5fc8d32690cc91d4c39d9d3abcbd16989f875707",
    decimals: 18,
    logoURI: "https://avatars.githubusercontent.com/u/61662492?s=64&v=4",
    id: "mht",
    name: "My Hardhat Token",
    symbol: "MHT",
    chainId: LOCALHOST_CHAINID,
  },
};

const CONTACT_DETAILS = { contactEmail: "test@test.xyz", remarks: "<3" };

const LAUNCH_DETAILS = {
  fundingTokenInfo: {
    address: "0xdc64a140aa3e981100a9beca4e685f962f0cf6c9",
    chainId: LOCALHOST_CHAINID,
    name: "Prime",
    symbol: "D2D",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/PrimeDAO/tokenlists/main/logos/D2D.png",
    id: "prime",
    price: 0.055081,
  },
  startDate: "2022-11-18T13:47:00.000Z",
  endDate: "2022-11-21T12:00:00.000Z",
  adminAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  legalDisclaimer:
    "https://raw.githubusercontent.com/PrimeDAO/public-client-assets/main/Prime-launch/Terms-and-conditions/Aqualis-nov-2022.md",
  geoBlock: true,
  pricePerToken: 1,
  fundingTarget: FUNDING_TARGET,
  fundingMax: FUNDING_MAX,
  vestingPeriod: 0,
  vestingCliff: 0,
  whitelist: "",
  individualCap: INDIVIDUAL_CAP,
  isPermissoned: false,
  seedTip: 0,
  allowList: [],
};

export class SeedBuilder {
  public id: string;

  // @ts-ignore
  public seed: ISeedConfig = {
    version: "1.0.0",
    general: GENERAL_DATA,
    projectDetails: PROJECT_DETAILS,
    tokenDetails: TOKEN_DETAILS,
    contactDetails: CONTACT_DETAILS,
    launchDetails: LAUNCH_DETAILS,
  };

  constructor(rootSeed?: ISeedConfig) {
    if (rootSeed) {
      this.seed = rootSeed;
    }
  }

  public static create(id: string, rootSeed?: ISeedConfig): SeedBuilder {
    const seedBuilder = new SeedBuilder(rootSeed);

    // Setting defaults
    seedBuilder.id = `${id}`;
    seedBuilder.withGeneral({ projectName: id });

    return seedBuilder;
  }

  public withGeneral = this.withFactory("general");
  public withProjectDetails = this.withFactory("projectDetails");
  public withTokenDetails = this.withFactory("tokenDetails");
  public withContactDetails = this.withFactory("contactDetails");
  public withLaunchDetails = this.withFactory("launchDetails");

  private withFactory<SeedKey extends keyof ISeedConfig>(
    key: SeedKey,
    defaultData?: ISeedConfig[SeedKey],
  ) {
    return (data?: Partial<ISeedConfig[SeedKey]>) => {
      if (defaultData !== undefined) {
        this.seed[key] = defaultData;
      }

      // @ts-ignore Spread types may only be created from object types.ts(2698) --> works in ts 4.6.2
      this.seed[key] = { ...this.seed[key], ...data };
      return this;
    };
  }
}

/**
 * **************************
 * CLASSES
 * **************************
 */

const defaultSeedClass = {
  classNames: e2eClassName,
  // classCaps: toWei(TOTAL_TOKEN_SUPPLY, DEFAULT_DECIMALS),
  classCaps: BigNumber.from(FUNDING_TARGET),
  individualCaps: BigNumber.from(INDIVIDUAL_CAP),
  vestingDurations: 0 * ONE_DAY_IN_SECONDS,
  vestingCliffs: 0 * ONE_DAY_IN_SECONDS,
  allowList: undefined,
};

export class SeedClassesBuilder {
  public seedClass: IAddClassParams = {
    classNames: [defaultSeedClass.classNames].map(() =>
      formatBytes32String(`${getRandomId()}_e2e`),
    ),
    classCaps: [defaultSeedClass.classCaps],
    individualCaps: [defaultSeedClass.individualCaps],
    classVestingDurations: [defaultSeedClass.vestingDurations],
    classVestingCliffs: [defaultSeedClass.vestingCliffs],
    classAllowlists: [defaultSeedClass.allowList],
  };

  withClassName(className: string): SeedClassesBuilder {
    this.seedClass.classNames = [formatBytes32String(className)];
    return this;
  }

  withAllowlists(allowList: string[]): SeedClassesBuilder {
    this.seedClass.classAllowlists = [new Set(allowList)];
    return this;
  }

  public static create(): SeedClassesBuilder {
    return new SeedClassesBuilder();
  }

  public static createNewClass(): IAddClassParams {
    return SeedClassesBuilder.create().seedClass;
  }
}
