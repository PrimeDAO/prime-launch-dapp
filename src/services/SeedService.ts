import { ITokenInfo } from "./TokenTypes";
import { TokenService } from "services/TokenService";
import { AureliaHelperService } from "services/AureliaHelperService";
import { EthereumService, isCeloNetworkLike, Networks, toWei } from "services/EthereumService";
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
import { Utils } from "services/utils";
import { BigNumber } from "ethers";

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
    this.eventAggregator.subscribe("Seed.InitializationFailed", async (seedAddress: string) => {
      this.seeds?.delete(seedAddress);
    });

    switch (EthereumService.targetedNetwork) {
      case Networks.Mainnet:
        this.startingBlockNumber = 13764353;
        break;
      case Networks.Rinkeby:
        this.startingBlockNumber = 9468353;
        break;
      case Networks.Arbitrum:
        this.startingBlockNumber = 5288502;
        break;
      case Networks.Celo:
        this.startingBlockNumber = 14836595;
        break;
      case Networks.Alfajores:
        this.startingBlockNumber = 13297679;
        break;
      default:
        this.startingBlockNumber = 0;
        break;
    }
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
    this.getSeeds();
  }

  // async hydrateStartingBlock(): Promise<void> {
  //   const filter = this.seedFactory.filters.SeedCreated(undefined, this.address);
  //   const txEvents: Array<IStandardEvent<unknown>> = await this.seedFactory.queryFilter(filter);
  //   this.startingBlockNumber = txEvents[0].blockNumber;
  //   // const block = await this.ethereumService.getBlock(this.startingBlockNumber);
  //   // this.startingDateTime = block.blockDate;
  // }

  private async getSeeds(): Promise<void> {
    let resolve: (value: void | PromiseLike<void>) => void;
    let reject: (reason?: any) => void;

    this.initializedPromise = new Promise(
      (
        resolveFn: (value: void | PromiseLike<void>) => void,
        rejectFn: (reason?: any) => void): void => {
        resolve = resolveFn;
        reject = rejectFn;
      },
    );

    try {
      const seedsMap = new Map<Address, Seed>();
      const filter = this.seedFactory.filters.SeedCreated();
      const deletables = new Array<Address>();

      await this.contractsService.filterEventsInBlocks<ISeedCreatedEventArgs>(
        this.seedFactory,
        filter,
        this.startingBlockNumber,
        txEvents => {
          for (const event of txEvents) {
            const seed = this.createSeedFromConfig(event);
            seedsMap.set(seed.address, seed);
            /**
                 * remove the seed if it is corrupt
                 */
            this.aureliaHelperService.createPropertyWatch(seed, "corrupt", (newValue: boolean) => {
              if (newValue) { // pretty much the only case
                if (this.seeds) {
                  this.seeds.delete(seed.address);
                } else {
                  deletables.push(seed.address);
                }
              }
            });
            this.consoleLogService.logMessage(`instantiated seed: ${seed.address}`, "info");
            seed.initialize(); // set this off asyncronously.
          }
        });

      deletables.map(seedAddress => seedsMap.delete(seedAddress));

      this.seeds = seedsMap;
      this.initializing = false;
      resolve();
    }
    catch (error) {
      this.seeds = new Map();
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", error));
      this.initializing = false;
      reject();
    }
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

  private projectTokenPriceInWei(
    pricePerTokenAsEth: number,
    fundingToken: ITokenInfo,
    projectToken: ITokenInfo): BigNumber {
    return toWei(pricePerTokenAsEth, Seed.projectTokenPriceDecimals(fundingToken, projectToken));
  }

  // addClass(class: any): Promise<TransactionReceipt> {
  //   return this.transactionsService.send(() => this.contract.addClass(class))
  //     .then(async (receipt) => {
  //       if (receipt) {
  //         return receipt;
  //       }
  //     });
  // }

  public async deploySeed(config: ISeedConfig): Promise<Hash> {

    const seedConfigString = JSON.stringify(config);
    // this.consoleLogService.logMessage(`seed registration json: ${seedConfigString}`, "debug");

    const metaDataHash = await this.ipfsService.saveString(seedConfigString, `${config.general.projectName}`);

    this.consoleLogService.logMessage(`seed registration hash: ${metaDataHash}`, "info");

    const safeAddress = await ContractsService.getContractAddress(ContractNames.SAFE);
    const seedFactory = await this.contractsService.getContractFor(ContractNames.SEEDFACTORY);
    const signer = await this.contractsService.getContractFor(ContractNames.SIGNER);
    const gnosis = api(safeAddress, EthereumService.targetedNetwork);

    const transaction = {
      to: seedFactory.address,
      value: isCeloNetworkLike() ? "0" : 0,
      operation: 0,
    } as any;

    const pricePerToken = this.projectTokenPriceInWei(
      config.launchDetails.pricePerToken,
      config.launchDetails.fundingTokenInfo,
      config.tokenDetails.projectTokenInfo);

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

    const classesToAdd = [{
      classCaps: 1000,
      individualCaps: 100,
      prices: 6,
      vestingDurations: 8640000,
      classVestingStartTime: 8640000,
      classFee: 1,
    }];

    if (transaction.data) {
      const deployedSeedcontract = await this.contractsService.getContractAtAddress(ContractNames.SEED, transaction.data);
      classesToAdd.map( async (classToAdd) => { await deployedSeedcontract.addClass(classToAdd); });
    }

    // console.log("estimating transaction:");
    // console.dir(transaction);

    let estimate;
    if (EthereumService.targetedNetwork === Networks.Arbitrum) {
      estimate = { safeTxGas: 0 };
    } else {
      estimate = (await gnosis.getEstimate(transaction)).data;
    }

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
