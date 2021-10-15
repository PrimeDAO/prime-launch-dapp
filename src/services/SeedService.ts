import { TokenService } from "services/TokenService";
import { AureliaHelperService } from "services/AureliaHelperService";
import { EthereumService, Networks, toWei } from "services/EthereumService";
import TransactionsService from "services/TransactionsService";
import { ISeedConfig } from "../newLaunch/seed/config";
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
import BigNumber, { toBigNumberJs } from "services/BigNumberService";
import { Utils } from "services/utils";

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
  public static seedFee = 0.0; //If the value is ever > 0, then should be a fraction like 0.1 to represent 1%

  @computedFrom("seeds.size")
  public get seedsArray(): Array<Seed> {
    return this.seeds ? Array.from(this.seeds.values()) : [];
  }
  public initializing = true;
  private initializedPromise: Promise<void>;
  private seedFactory: any;
  // private featuredSeedsJson: IFeaturedSeedsConfig;
  /**
   * when the factory was created, pulled by hand from etherscan.io
   */
  private startingBlockNumber: number;

  constructor(
    private contractsService: ContractsService,
    private eventAggregator: EventAggregator,
    private container: Container,
    private consoleLogService: ConsoleLogService,
    private transactionsService: TransactionsService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
    private aureliaHelperService: AureliaHelperService,
    private tokenService: TokenService,
  ) {
    /**
     * otherwise singleton is the default
     */
    this.container.registerTransient(Seed);

    this.eventAggregator.subscribe("Seed.InitializationFailed", async (seedAddress: string) => {
      this.seeds.delete(seedAddress);
    });

    this.startingBlockNumber = (this.ethereumService.targetedNetwork === Networks.Mainnet) ?
      12787753 : 9468353;
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
            this.seedFactory.queryFilter(filter, this.startingBlockNumber)
              .then(async (txEvents: Array<IStandardEvent<ISeedCreatedEventArgs>>) => {
                for (const event of txEvents) {
                  const seed = this.createSeedFromConfig(event);
                  seedsMap.set(seed.address, seed);
                  /**
                   * remove the seed if it is corrupt
                   */
                  this.aureliaHelperService.createPropertyWatch(seed, "corrupt", (newValue: boolean) => {
                    if (newValue) { // pretty much the only case
                      this.seeds.delete(seed.address);
                    }
                  });
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

  public async ensureAllSeedsInitialized(): Promise<void> {
    await this.ensureInitialized();
    for (const seed of this.seedsArray) {
      await seed.ensureInitialized();
    }
  }

  public async deploySeed(config: ISeedConfig): Promise<Hash> {

    const seedConfigString = JSON.stringify(config);
    // this.consoleLogService.logMessage(`seed registration json: ${seedConfigString}`, "debug");

    const metaDataHash = await this.ipfsService.saveString(seedConfigString, `${config.general.projectName}`);

    this.consoleLogService.logMessage(`seed registration hash: ${metaDataHash}`, "info");

    const safeAddress = await ContractsService.getContractAddress(ContractNames.SAFE);
    const seedFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    const signer = await this.contractsService.getContractFor(ContractNames.SIGNER);
    const gnosis = api(safeAddress, this.ethereumService.targetedNetwork);

    const transaction = {
      to: seedFactory.address,
      value: 0,
      operation: 0,
    } as any;

    const fundingTokenInfo = (await this.tokenService.getTokenInfoFromAddresses([config.launchDetails.fundingTokenInfo.address]))[0];
    let pricePerToken: string;

    try {
      BigNumber.config({ DECIMAL_PLACES: fundingTokenInfo.decimals });
      const numerator = toBigNumberJs(config.launchDetails.pricePerToken);

      BigNumber.config({ DECIMAL_PLACES: config.tokenDetails.projectTokenInfo.decimals });
      const denominator = toBigNumberJs(toWei(1, config.tokenDetails.projectTokenInfo.decimals));

      const rawPrice = numerator.dividedBy(denominator).toString();
      pricePerToken = toWei(rawPrice, 18).toString();
    } catch (ex) {
      throw new Error(ex);
    } finally {
      BigNumber.config({ DECIMAL_PLACES: 18 }); // just to reset cuz this is globally scoped
    }

    const seedArguments = [
      safeAddress,
      config.launchDetails.adminAddress,
      [config.tokenDetails.projectTokenInfo.address, config.launchDetails.fundingTokenInfo.address],
      [config.launchDetails.fundingTarget, config.launchDetails.fundingMax],
      pricePerToken,
      // convert from ISO string to Unix epoch seconds
      Date.parse(config.launchDetails.startDate) / 1000,
      // convert from ISO string to Unix epoch seconds
      Date.parse(config.launchDetails.endDate) / 1000,
      [config.launchDetails.vestingPeriod, config.launchDetails.vestingCliff],
      !!config.launchDetails.whitelist,
      toWei(SeedService.seedFee),
      Utils.asciiToHex(metaDataHash),
    ];

    transaction.data = (await seedFactory.populateTransaction.deploySeed(...seedArguments)).data;

    // console.log("estimating transaction:");
    // console.dir(transaction);

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

    // console.log("generating signature for transaction:");
    // console.dir(transaction);

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
}
