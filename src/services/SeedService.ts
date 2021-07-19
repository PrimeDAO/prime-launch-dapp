import { EthereumService } from "services/EthereumService";
import TransactionsService from "services/TransactionsService";
import { SortService } from "services/SortService";
import { ISeedConfig } from "./../newSeed/seedConfig";
import { IpfsService } from "./IpfsService";
import { Hash, Address } from "./EthereumService";
import { ConsoleLogService } from "./ConsoleLogService";
import { Container } from "aurelia-dependency-injection";
import { ContractNames, ContractsService, IStandardEvent } from "./ContractsService";
import { autoinject, computedFrom } from "aurelia-framework";
import { Seed } from "entities/Seed";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";
import { api } from "services/GnosisService";

export interface ISeedCreatedEventArgs {
  newSeed: Address;
  beneficiary: Address;
}

// interface IFeaturedSeedsConfig {
//   [network: string]: { seeds: Array<Address> } ;
// }

@autoinject
export class SeedService {

  public seeds: Map<Address, Seed>;

  @computedFrom("seeds.size")
  public get seedsArray(): Array<Seed> {
    return this.seeds ? Array.from(this.seeds.values()) : [];
  }
  public initializing = true;
  private initializedPromise: Promise<void>;
  private seedFactory: any;
  // private featuredSeedsJson: IFeaturedSeedsConfig;
  /**
   * when the factory was created
   */
  // TODO: private startingBlockNumber: number;

  constructor(
    private contractsService: ContractsService,
    private eventAggregator: EventAggregator,
    private container: Container,
    private consoleLogService: ConsoleLogService,
    private transactionsService: TransactionsService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
  ) {
    /**
     * otherwise singleton is the default
     */
    this.container.registerTransient(Seed);

    this.eventAggregator.subscribe("Seed.InitializationFailed", async (seedAddress: string) => {
      this.seeds.delete(seedAddress);
    });
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
                  const seed = this.createSeedFromConfig(event);
                  seedsMap.set(seed.address, seed);
                  this.consoleLogService.logMessage(`loaded seed: ${seed.address}`, "info");
                  seed.initialize(); // set this off asyncronously.
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

  private createSeedFromConfig(config: IStandardEvent<ISeedCreatedEventArgs>): Seed {
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

    const metaDataHash = await this.ipfsService.saveString(seedConfigString, `${config.general.projectName}`);

    this.consoleLogService.logMessage(`seed registration hash: ${metaDataHash}`, "info");

    const safeAddress = await this.contractsService.getContractAddress(ContractNames.SAFE);
    const seedFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    const signer = await this.contractsService.getContractFor(ContractNames.SIGNER);
    const gnosis = api(safeAddress, this.ethereumService.targetedNetwork);

    const transaction = {
      to: seedFactory.address,
      value: 0,
      operation: 0,
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
      [config.seedDetails.vestingPeriod, config.seedDetails.vestingCliff],
      !!config.seedDetails.whitelist,
      2,
      this.asciiToHex(metaDataHash),
    ];

    transaction.data = (await seedFactory.populateTransaction.deploySeed(...seedArguments)).data;

    console.log("estimating transaction:");
    console.dir(transaction);

    const estimate = (await gnosis.getEstimate(transaction)).data;

    Object.assign(transaction, {
      safeTxGas: estimate.safeTxGas,
      nonce: await gnosis.getCurrentNonce(),
      baseGas: 0,
      gasPrice: 0,
      gasToken: "0x0000000000000000000000000000000000000000",
      refundReceiver: "0x0000000000000000000000000000000000000000",
      safe: safeAddress,
    });

    const { hash, signature } = await signer.callStatic.generateSignature(
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

    // eslint-disable-next-line require-atomic-updates
    transaction.contractTransactionHash = hash;
    // eslint-disable-next-line require-atomic-updates
    transaction.signature = signature;

    console.log("generating signature for transaction:");
    console.dir(transaction);

    const result = await this.transactionsService.send(() => signer.generateSignature(
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
    ));

    if (!result) {
      return null;
    }

    // eslint-disable-next-line require-atomic-updates
    transaction.sender = signer.address;

    this.consoleLogService.logMessage(`sending to safe txHash: ${ hash }`, "info");

    const response = await gnosis.sendTransaction(transaction);

    if (response.status !== 201) {
      throw Error(`An error occurred submitting the transaction: ${response.statusText}`);
    }

    return metaDataHash;
  }

  private asciiToHex(str = ""): string {
    const res = [];
    const { length: len } = str;
    for (let n = 0, l = len; n < l; n++) {
      const hex = Number(str.charCodeAt(n)).toString(16);
      res.push(hex);
    }
    return `0x${res.join("")}`;
  }
}
