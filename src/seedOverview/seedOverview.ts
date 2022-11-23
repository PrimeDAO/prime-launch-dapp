import { autoinject } from "aurelia-framework";
import { Seed } from "entities/Seed";
import { isLocalhostNetwork } from "services/EthereumService";
import { SeedService } from "services/SeedService";
import { Address } from "types/types";
import "./seedOverview.scss";

const propsToIgnore = [
  "contractsService",
  "consoleLogService",
  "eventAggregator",
  "dateService",
  "tokenService",
  "transactionsService",
  "numberService",
  "ethereumService",
  "ipfsService",
  "multiCallService",
  "launchType",
  "subscriptions",
  "_now",
  "initializing",
  "corrupt",
  "userHydrated",
  "initializedPromise",
  "seedInitialized",
];

const seedProps = [
  // arrays
  "classes",
  // times
  "vestingCliff",
  "vestingStartTime",
  "startTime",
  "endTime",
  // booleans
  "isPaused",
  "isClosed",
  "whitelisted",
  "minimumReached",
  "hasEnoughProjectTokens",
  "userCanClaim",
  "userPendingAmount",
  "userIsWhitelisted",
  // addresses
  "beneficiary",
  "address",
  "admin",
  "projectTokenAddress",
  "fundingTokenAddress",
  // numbers
  "feeRemainder",
  "seedTip",
  "globalPrice",
  "target",
  "cap",
  "amountRaised",
  "seedRemainder",
  "seedAmountRequired",
  "classPrice",
  "projectTokenBalance",
  "fundingTokenBalance",
  "fundingTokensPerProjectToken",
  "userCurrentFundingContributions",
  "userFundingTokenBalance",
  "userClaimableAmount",
  // contracts
  "contract",
  "projectTokenContract",
  "fundingTokenContract",
  // objects
  "metadata",
  "fundingTokenInfo",
  "projectTokenInfo",
  "usersClass",
  // others
  "metadataHash",
  "valuation",
];

const seedPropsMap = {
  arrays: ["classes"],
  times: ["vestingCliff", "vestingStartTime", "startTime", "endTime"],
  booleans: [
    "isPaused",
    "isClosed",
    "whitelisted",
    "minimumReached",
    "hasEnoughProjectTokens",
    "userCanClaim",
    "userIsWhitelisted",
  ],
  addresses: [
    "beneficiary",
    "address",
    "admin",
    "projectTokenAddress",
    "fundingTokenAddress",
  ],
  numbers: {
    fundingToken: [
      "target",
      "cap",
      "amountRaised",
      "classPrice",
      "fundingTokenBalance",
      "userCurrentFundingContributions",
      "userFundingTokenBalance",
    ],
    projectToken: [
      "feeRemainder",
      "seedRemainder",
      "seedAmountRequired",
      "userClaimableAmount",
      "userPendingAmount",
      "projectTokenBalance",
    ],
  },
  contracts: ["contract", "projectTokenContract", "fundingTokenContract"],
  objects: ["metadata", "fundingTokenInfo", "projectTokenInfo", "usersClass"],
  others: [
    "metadataHash",
    "valuation",
    "seedTip",
    "globalPrice",
    "fundingTokensPerProjectToken",
  ],
};

@autoinject
export class SeedOverview {
  message = "SeedOverview";
  private address: Address;
  seed: Seed;

  private seedProps = [];
  private seedPropsMap = seedPropsMap;

  constructor(private seedService: SeedService) {}

  async canActivate(): Promise<boolean> {
    return isLocalhostNetwork();
  }

  async activate(params: { address: Address }): Promise<void> {
    this.address = params.address;
  }

  async attached(): Promise<void> {
    await this.seedService.ensureAllSeedsInitialized();
    const seed = this.seedService.seeds.get(this.address);
    await seed.ensureInitialized();
    this.seed = seed;
    this.seedProps = this.getSeedProps(this.seed);

    // this.seedPropsMap.booleans.forEach((boolProp) => {
    //   /* prettier-ignore */ console.log("------------------------------------------------------------------------------------------");
    //   /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: seedOverview.ts ~ line 148 ~ boolProp", boolProp);
    //   const value = this.seed[boolProp];
    //   /* prettier-ignore */ console.log(">>>> _ >>>> ~ file: seedOverview.ts ~ line 148 ~ value", value);
    // });
  }

  private getSeedProps(seed: Seed): string[] {
    const allProps = Object.keys(seed);
    const filteredProps = allProps.filter(
      (prop) => !propsToIgnore.includes(prop),
    );
    return filteredProps;
  }
}
