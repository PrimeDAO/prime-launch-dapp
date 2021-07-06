import { SortService } from "services/SortService";
import { ISeedConfig } from "./../newSeed/seedConfig";
import { IpfsService } from "./IpfsService";
import { EthereumService, Hash } from "./EthereumService";
import { ConsoleLogService } from "./ConsoleLogService";
import { Container } from "aurelia-dependency-injection";
import { ContractNames, ContractsService, IStandardEvent } from "./ContractsService";
import { autoinject } from "aurelia-framework";
import { Address } from "services/EthereumService";
import { Seed } from "entities/Seed";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import TransactionsService from "services/TransactionsService";
import { api } from "services/GnosisService";

// export interface ISeed {
//   address: Address;
//   description: string;
//   /**
//    * SVG icon for the pool
//    */
//   icon: string;
//   name: string;
//   /**
//    * the pool doesn't actually exist yet, but we want to present a preview in the UI
//    */
//   preview: boolean;
//   story: string;
// }

export interface ISeedCreatedEventArgs {
  newSeed: Address;
  beneficiary: Address;
}

/**
 * see SeedFactory contract for docs of these params
 */
// interface IDeploySeedParams {
//   admin: Address;
//   seedToken: Address;
//   fundingToken: Address;
//   successMinimumAndCap: Array<BigNumber>;
//   fee: BigNumber;
//   price: BigNumber;
//   startTime: number;
//   endTime: number;
//   vestingDuration: number;
//   vestingCliff: number;
//   isWhitelisted: boolean;
// }

// interface IFeaturedSeedsConfig {
//   [network: string]: { seeds: Array<Address> } ;
// }

@autoinject
export class SeedService {

  public seeds: Map<Address, Seed>;
  public get seedsArray(): Array<Seed> {
    return Array.from(this.seeds?.values());
  }
  public initializing = true;
  private initializedPromise: Promise<void>;
  private seedFactory: any;
  // private featuredSeedsJson: IFeaturedSeedsConfig;
  /**
   * when the factory was created
   */
  // private startingBlockNumber: number;

  constructor(
    private contractsService: ContractsService,
    private ethereumService: EthereumService,
    private eventAggregator: EventAggregator,
    private container: Container,
    private consoleLogService: ConsoleLogService,
    private transactionsService: TransactionsService,
    private ipfsService: IpfsService,
  ) {
    /**
     * otherwise singleton is the default
     */
    this.container.registerTransient(Seed);
  }

  public async initialize(): Promise<void> {
    // disabled for now
    // if (!this.featuredSeedsJson) {
    //   // eslint-disable-next-line require-atomic-updates
    //   if (process.env.NODE_ENV === "development") {
    //     this.featuredSeedsJson = require("../configurations/featuredSeeds.json");
    //   } else {
    //     axios.get("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/src/configurations/featuredSeeds.json")
    //       .then((response) => this.featuredSeedsJson = response.data);
    //   }
    // }

    /**
     * don't need to reload the seedfactory on account change because we never send txts to it.
     */
    this.seedFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    /**
     * seeds will take care of themselves on account changes
     */
    return this.getSeeds();
  }

  // async hydrateStartingBlock(): Promise<void> {
  //   const filter = this.seedFactory.filters.SeedCreated(undefined, this.address);
  //   const txEvents: Array<IStandardEvent<unknown>> = await this.seedFactory.queryFilter(filter);
  //   this.startingBlockNumber = txEvents[0].blockNumber;
  //   // const block = await this.ethereumService.getBlock(this.startingBlockNumber);
  //   // this.startingDateTime = block.blockDate;
  // }

  private async getSeeds(): Promise<void> {
    return this.initializedPromise = new Promise(
      (resolve: (value: void | PromiseLike<void>) => void,
        reject: (reason?: any) => void): void => {
        if (!this.seeds?.size) {
          try {
            const seedsMap = new Map<Address, Seed>();
            const filter = this.seedFactory.filters.SeedCreated();
            this.seedFactory.queryFilter(filter /*, this.startingBlockNumber */)
              .then(async (txEvents: Array<IStandardEvent<ISeedCreatedEventArgs>>) => {
                for (const event of txEvents) {
                  /**
                    * TODO: This should also pull the full seed configuration from whereever we are storing it
                    */
                  const seed = await this.createSeedFromConfig(event);
                  /**
                   * ignore seeds that don't have metadata
                   */
                  if (seed.metadataHash) {
                    seedsMap.set(seed.address, seed);
                    this.consoleLogService.logMessage(`loaded seed: ${seed.address}`, "info");
                    seed.initialize(); // set this off asyncronously.
                  } else {
                    this.consoleLogService.logMessage(`seed lacks metadata, is unusable: ${seed.address}`);
                  }
                }
                this.seeds = seedsMap;
                this.initializing = false;
                resolve();
              });
          }
          catch (error) {
            this.seeds = new Map();
            this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", error));
            this.initializing = false;
            reject();
          }
        }
      },
    );
  }

  private createSeedFromConfig(config: IStandardEvent<ISeedCreatedEventArgs>): Promise<Seed> {
    const seed = this.container.get(Seed);
    return seed.create({ beneficiary: config.args.beneficiary, address: config.args.newSeed });
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  private async ensureAllSeedsInitialized(): Promise<void> {
    await this.ensureInitialized();
    for (const seed of this.seedsArray) {
      await seed.ensureInitialized();
    }
  }

  private _featuredSeeds: Array<Seed>;

  public async getFeaturedSeeds(): Promise<Array<Seed>> {

    if (this._featuredSeeds) {
      return this._featuredSeeds;
    }
    else {
      await this.ensureAllSeedsInitialized();
      // const network = this.featuredSeedsJson[this.ethereumService.targetedNetwork];
      /**
       * take the first three seeds in order of when they start(ed), if they either haven't
       * started or are live.
       */
      // return network ? this._featuredSeeds = network.seeds
      return this._featuredSeeds = this.seedsArray
        .filter((seed: Seed) => { return seed.hasNotStarted || seed.contributingIsOpen; })
        .sort((a: Seed, b: Seed) => SortService.evaluateDateTimeAsDate(a.startTime, b.startTime))
        .slice(0, 3);
    }
  }

  public async deploySeed(config: ISeedConfig): Promise<Hash> {

    const seedConfigString = JSON.stringify(config);
    // this.consoleLogService.logMessage(`seed registration json: ${seedConfigString}`, "debug");

    const hash = this.ipfsService.saveString(seedConfigString, `${config.general.projectName}`);

    this.consoleLogService.logMessage(`seed registration hash: ${hash}`, "info");

    const safeAddress = await this.contractsService.getContractAddress(ContractNames.SAFE);
    const seedFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    const signer = await this.contractsService.getContractFor(ContractNames.SIGNER);
    const gnosis = api(safeAddress);

    const transaction = {
      to: seedFactory.address,
      value: 0,
      operation: 0,
      safe: safeAddress,
    } as any;

    const seedArguments = [
      safeAddress,
      config.seedDetails.adminAddress,
      [config.tokenDetails.seedAddress, config.tokenDetails.fundingAddress],
      [config.seedDetails.fundingTarget, config.seedDetails.fundingMax],
      config.seedDetails.pricePerToken,
      // convert from ISO string to Unix epoch seconds
      Date.parse(config.seedDetails.startDate) / 1000,
      // convert from ISO string to Unix epoch seconds
      Date.parse(config.seedDetails.endDate) / 1000,
      [config.seedDetails.vestingDays, config.seedDetails.vestingCliff],
      !!config.seedDetails.whitelist,
      2,
      hash,
    ];

    transaction.data = seedFactory.populateTransaction.deploySeed(...seedArguments);
    // Get transaction estimate: -

    const estimate = await gnosis.callStatic.getEstimate(transaction);

    Object.assign(transaction, {
      safeTxGas: estimate.safeTxGas,
      // Add payment related details
      // Get Nonce
      nonce: await gnosis.getCurrentNonce(),
      baseGas: 0,
      gasPrice: 0,
      gasToken: "0x0000000000000000000000000000000000000000",
      refundReceiver: "0x0000000000000000000000000000000000000000",
    });

    // send details to Signer contract to generate hash and sign the hash.
    // I'm confused with the equivalent of this in ethersjs
    const { txHash, signature } = await signer.callStatic.generateSignature(
      transaction.to,
      transaction.value,
      transaction.data,
      transaction.operation,
      transaction.safeTxGas,
      transaction.baseGas,
      transaction.gasPrice,
      transaction.gasToken,
      transaction.refundReceiver,
      transaction.nonce,
    );

    transaction.contractTransactionHash = txHash;
    transaction.signature = signature;
    // Send signer.generateSignature() to do a transaction and store signature in contract
    await signer.generateSignature(transaction.contractTransactionHash);
    // Add sender to the transaction object
    transaction.sender = signer.address;
    // Send the transaction object to Gnosis Safe Transaction service
    const response = await gnosis.sendTransaction(transaction);

    console.dir(response);

    return hash;
  }
}
