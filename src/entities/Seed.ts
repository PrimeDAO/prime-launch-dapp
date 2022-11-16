import { IBatcherCallsModel, MultiCallService } from "./../services/MulticallService";
import { ITokenInfo } from "./../services/TokenTypes";
import { IpfsService } from "services/IpfsService";
import { autoinject, computedFrom } from "aurelia-framework";
import { DateService } from "./../services/DateService";
import { ContractsService, ContractNames } from "./../services/ContractsService";
import { BigNumber } from "ethers";
import { Address, EthereumService, fromWei, Hash, isLocalhostNetwork, toWei } from "services/EthereumService";
import { ConsoleLogService } from "services/ConsoleLogService";
import { TokenService } from "services/TokenService";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { NumberService } from "services/NumberService";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";
import { Utils } from "services/utils";
import { ISeedConfig } from "newLaunch/seed/config";
import { ILaunch, LaunchType } from "services/launchTypes";
import { toBigNumberJs } from "services/BigNumberService";
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils";
import * as lhrealtest from "../../cypress/fixtures/21-[lh]-real-test.json";

import type { IAddClassParams, IContractContributorClasses, IFundingToken } from "types/types";

export interface ISeedConfiguration {
  address: Address;
  beneficiary: Address;
}

interface IFunderPortfolio {
  class: number;
  totalClaimed: BigNumber;
  fundingAmount: BigNumber;
  allowlist: boolean;
  // fee: BigNumber;
  // feeClaimed: BigNumber;
}

/**
 * Note: `interface` instead of `type`, because of type hinting.
 *   `type ABC = BigNumber` shows `BigNumber` instead of `ABC`
 */
// export interface IFundingToken extends BigNumber {}
export type { IFundingToken } from "types/types";
export type { IContractContributorClasses } from "types/types";

export interface IContributorClass {
  className: string;
  classCap: IFundingToken; // Amount of tokens that can be donated for class
  individualCap: IFundingToken; // Amount of tokens that can be donated by specific contributor
  classFundingCollected?: IFundingToken,
  classVestingCliff: number; // Vesting cliff for class
  classVestingDuration: number; // Vesting duration for class
  allowList?: Set<Address>;
}

@autoinject
export class Seed implements ILaunch {
  public launchType = LaunchType.Seed;
  public contract: any;
  public classes: IContributorClass[] = [];
  public address: Address;
  public seedInitialized: boolean;
  public beneficiary: Address;
  public startTime: Date;
  public endTime: Date;
  public admin: Address;
  public classPrice: any;
  public classSold: any;

  /**
   * a state set by the admin (creator) of the Seed
   */
  public isPaused: boolean;
  /**
   * a state set by the admin (creator) of the Seed
   */
  public isClosed: boolean;
  /**
   * The number of fundingTokens required to receive one projectToken,
   * ie, the price of one project (seed) token in units of eth (no precision)
   */
  public fundingTokensPerProjectToken: number;
  public globalPrice: BigNumber;
  /**
   * in terms of fundingToken
   */
  public target: BigNumber;
  // public targetPrice: number;
  /**
   * in terms of fundingToken
   */
  public cap: BigNumber;
  // public capPrice: number;
  /**
   * seed has a whitelist
   */
  public whitelisted: boolean;
  /**
   * the number of seconds of over which project tokens vest
   */
  public vestingDuration: number;
  public classCap: number;
  /**
   * the initial period in seconds of the vestingDuration during which project tokens may not
   * be claimed
   */
  public vestingCliff = 0;
  public vestingStartTime = 0;
  public minimumReached: boolean;
  /**
   * the amount of the fundingToken in the seed
   */
  public amountRaised: BigNumber;
  /**
   * $ value of the total supply of the project (seed) token
   */
  public valuation: number;
  /**
   * "seed token" is a synonym for "project token"
   */
  public projectTokenAddress: Address;
  public projectTokenInfo: ITokenInfo;
  public projectTokenContract: any;
  /**
   * balance of project tokens in this contract
   */
  public projectTokenBalance: BigNumber;
  /**
   * number of tokens in this seed contract
   */
  public seedRemainder: BigNumber;
  /**
   * amount to be distributed, according to the funding cap and prices
   */
  public seedAmountRequired: BigNumber;
  /**
   * Is the seed contract initialized and have enough project tokens to pay its obligations
   */
  public hasEnoughProjectTokens: boolean;

  public feeRemainder: BigNumber = BigNumber.from(0);
  public seedTip: BigNumber = BigNumber.from(0);

  public fundingTokenAddress: Address;
  public fundingTokenInfo: ITokenInfo;
  public fundingTokenContract: any;
  /**
   * balance of project tokens in this contract
   */
  public fundingTokenBalance: BigNumber;

  public userIsWhitelisted: boolean;
  public usersClass: IContributorClass;
  /**
   * claimable project (seed) tokens
   */
  public userClaimableAmount: BigNumber;
  /**
   * pending (locked) project tokens
   */
  public userPendingAmount: BigNumber;
  public userCanClaim: boolean;
  public userCurrentFundingContributions: BigNumber;
  public userFundingTokenBalance: IFundingToken;
  public userIndividualCap: BigNumber;

  public initializing = true;
  public metadata: ISeedConfig;
  public metadataHash: Hash;
  public corrupt = false;
  public userHydrated = false;

  private initializedPromise: Promise<void>;
  private subscriptions = new DisposableCollection();
  private _now = new Date();

  @computedFrom("_now")
  public get startsInMilliseconds(): number {
    return this.dateService.getDurationBetween(this.startTime, this._now).asMilliseconds();
  }

  @computedFrom("_now")
  public get endsInMilliseconds(): number {
    return this.dateService.getDurationBetween(this.endTime, this._now).asMilliseconds();
  }

  @computedFrom("_now")
  public get hasNotStarted(): boolean {
    return (this._now < this.startTime);
  }
  /**
   * we are between the start and end dates.
   * Doesn't mean you can do anything.
   */
  @computedFrom("_now")
  public get isLive(): boolean {
    return (this._now >= this.startTime) && (this._now < this.endTime);
  }
  /**
   * we are after the end date.
   * No implications about whether you can do anything.
   */
  @computedFrom("_now")
  public get isDead(): boolean {
    return (this._now >= this.endTime);
  }

  @computedFrom("isLive", "uninitialized", "maximumReached", "isPaused", "isClosed")
  public get contributingIsOpen(): boolean {
    return this.isLive && !this.uninitialized && !this.maximumReached && !this.isPaused && !this.isClosed;
  }
  /**
   * Really means "complete".  But does not imply that the vesting cliff has actually ended.
   */
  @computedFrom("uninitialized", "maximumReached", "minimumReached", "isDead")
  get claimingIsOpen(): boolean {
    return !this.uninitialized && (this.maximumReached || (this.minimumReached && this.isDead));
  }
  /**
   * didn't reach the target and not paused or closed
   */
  @computedFrom("uninitialized", "minimumReached", "isDead", "isPaused", "isClosed")
  get incomplete(): boolean {
    return this.isDead && !this.uninitialized && !this.minimumReached && !this.isPaused && !this.isClosed;
  }

  @computedFrom("_now_")
  get retrievingIsOpen(): boolean {
    return (this._now >= this.startTime) && !this.minimumReached;
  }

  @computedFrom("userCurrentFundingContributions", "retrievingIsOpen")
  get userCanRetrieve(): boolean {
    return this.retrievingIsOpen && this.userCurrentFundingContributions?.gt(0);
  }

  @computedFrom("amountRaised")
  get maximumReached(): boolean {
    return this.amountRaised?.gte(this.cap);
  }

  @computedFrom("uninitialized")
  get canGoToDashboard(): boolean {
    return true;
  }

  @computedFrom("hasEnoughProjectTokens")
  get uninitialized(): boolean {
    return !this.hasEnoughProjectTokens;
  }

  @computedFrom("seedRemainder", "seedTip")
  get getTipAmountFromFunding(): BigNumber {
    const fundWithTip = BigNumber.from(
      toBigNumberJs(this.seedRemainder)
        .multipliedBy(toBigNumberJs(fromWei((this.seedTip))))
        .toString(),
    );

    return fundWithTip;
  }

  /**
   * result = Fund * ( 1 + tip )
   *                 percentageAmount
   * (note, `tip` is already stored in percentage fraction)
   */
  @computedFrom("seedRemainder", "seedTip")
  get calculateFundWithTip(): BigNumber {
    const percentageAmount = fromWei(toWei(1).add(this.seedTip));
    const fundWithTip = BigNumber.from(
      toBigNumberJs(this.seedRemainder)
        .multipliedBy(toBigNumberJs(percentageAmount))
        .toString(),
    );

    return fundWithTip;
  }

  constructor(
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService,
    private eventAggregator: EventAggregator,
    private dateService: DateService,
    private tokenService: TokenService,
    private transactionsService: TransactionsService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
    private multiCallService: MultiCallService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (state: {now: Date}) => {
      this._now = state.now;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.loadContracts().then(() => { this.hydrateUser(); });
    }));
  }

  public create(config: ISeedConfiguration): Seed {
    this.initializedPromise = Utils.waitUntilTrue(() => !this.initializing, 9999999999);
    return Object.assign(this, config);
  }

  /**
   * note this is called when the contracts change
   * @param config
   * @returns
   */
  public async initialize(): Promise<void> {
    this.initializing = true;
    await this.loadContracts();
    /**
       * no, intentionally don't await
       */
    this.hydrate();
  }

  private disable():void {
    this.corrupt = true;
    this.subscriptions.dispose();
  }

  private async loadContracts(): Promise<void> {
    try {
      this.contract = await this.contractsService.getContractAtAddress(ContractNames.SEED, this.address);
      if (this.projectTokenAddress) {
        this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
        this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);
      }
    }
    catch (error) {
      this.disable();
      this.initializing = false;
      this.consoleLogService.logMessage(`Seed: Error initializing seed: ${error?.message ?? error}`, "error");
    }
  }

  public static projectTokenPriceDecimals(
    fundingTokenInfo: ITokenInfo,
    projectTokenInfo: ITokenInfo): number {
    return fundingTokenInfo.decimals - projectTokenInfo?.decimals + 18;
  }

  public projectTokenPriceInEth(
    priceFromContract: BigNumber,
    fundingTokenInfo: ITokenInfo,
    projectTokenInfo: ITokenInfo): string {
    const priceInEth = fromWei(priceFromContract, Seed.projectTokenPriceDecimals(fundingTokenInfo, projectTokenInfo));
    return priceInEth;
  }

  private async hydrate(): Promise<void> {
    try {
      let rawMetadata: any;
      // let exchangeRate: BigNumber;
      let totalSupply: BigNumber;

      let batchedCalls: Array<IBatcherCallsModel> = [
        {
          contractAddress: this.address,
          functionName: "initialized",
          returnType: "bool",
          resultHandler: (result) => { this.seedInitialized = result; },
        },
        {
          contractAddress: this.address,
          functionName: "admin",
          returnType: "address",
          resultHandler: (result) => { this.admin = result; },
        },
        {
          contractAddress: this.address,
          functionName: "metadata",
          returnType: "bytes",
          resultHandler: (result) => { rawMetadata = result; },
        },
        {
          contractAddress: this.address,
          functionName: "seedToken",
          returnType: "address",
          resultHandler: (result) => { this.projectTokenAddress = result; },
        },
        {
          contractAddress: this.address,
          functionName: "fundingToken",
          returnType: "address",
          resultHandler: (result) => { this.fundingTokenAddress = result; },
        },
        {
          contractAddress: this.address,
          functionName: "startTime",
          returnType: "uint256",
          resultHandler: (result) => { this.startTime = this.dateService.unixEpochToDate(result.toNumber()); },
        },
        {
          contractAddress: this.address,
          functionName: "endTime",
          returnType: "uint256",
          resultHandler: (result) => { this.endTime = this.dateService.unixEpochToDate(result.toNumber()); },
        },
        {
          contractAddress: this.address,
          functionName: "price",
          returnType: "uint256",
          resultHandler: (result) => { this.globalPrice = result; },
        },
        {
          contractAddress: this.address,
          functionName: "softCap",
          returnType: "uint256",
          resultHandler: (result) => { this.target = result; },
        },
        {
          contractAddress: this.address,
          functionName: "hardCap",
          returnType: "uint256",
          resultHandler: (result) => { this.cap = result; },
        },
        {
          contractAddress: this.address,
          functionName: "paused",
          returnType: "bool",
          resultHandler: (result) => { this.isPaused = result; },
        },
        {
          contractAddress: this.address,
          functionName: "closed",
          returnType: "bool",
          resultHandler: (result) => { this.isClosed = result; },
        },
        {
          contractAddress: this.address,
          functionName: "permissionedSeed",
          returnType: "bool",
          resultHandler: (result) => { this.whitelisted = result; },
        },
        {
          contractAddress: this.address,
          functionName: "vestingStartTime",
          returnType: "uint256",
          resultHandler: (result) => { this.vestingStartTime = result.toNumber(); },
        },
        {
          contractAddress: this.address,
          functionName: "minimumReached",
          returnType: "bool",
          resultHandler: (result) => { this.minimumReached = result; },
        },
        {
          contractAddress: this.address,
          functionName: "fundingCollected",
          returnType: "uint256",
          resultHandler: (result) => { this.amountRaised = result; },
        },
        {
          contractAddress: this.address,
          functionName: "seedRemainder",
          returnType: "uint256",
          resultHandler: (result) => { this.seedRemainder = result; },
        },
        {
          contractAddress: this.address,
          functionName: "seedAmountRequired",
          returnType: "uint256",
          resultHandler: (result) => { this.seedAmountRequired = result; },
        },
        {
          contractAddress: this.address,
          functionName: "tip",
          returnType: "uint256",
          resultHandler: (result) => { this.seedTip = result; },
        },
      ];

      let batcher = this.multiCallService.createBatcher(batchedCalls);

      try {
        await batcher.start();
      } catch (error) {
        this.consoleLogService.logMessage(error.message, "error");
      }

      const exchangeRate = this.globalPrice;
      this.classPrice = exchangeRate;


      if (rawMetadata && Number(rawMetadata)) {
        this.metadataHash = Utils.toAscii(rawMetadata.slice(2));
      } else {
        if (!isLocalhostNetwork()) {
          this.eventAggregator.publish("Seed.InitializationFailed", this.address);
          throw new Error(`Seed lacks metadata, is unusable: ${this.address}`);
        }
      }

      if (isLocalhostNetwork()) {
        this.metadata = lhrealtest as unknown as ISeedConfig;
      } else {
        await this.hydrateMetadata();
      }

      this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.fundingTokenAddress);

      this.projectTokenInfo = this.metadata.tokenDetails.projectTokenInfo;
      if (!this.projectTokenInfo || (this.projectTokenInfo.address.toLowerCase() !== this.projectTokenAddress.toLowerCase())) {
        throw new Error("project token info is not found or does not match the seed contract");
      }

      this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
      this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);

      batchedCalls = [
        {
          contractAddress: this.fundingTokenContract.address,
          functionName: "totalSupply",
          returnType: "uint256",
          resultHandler: (result) => { totalSupply = result; },
        },
        {
          contractAddress: this.projectTokenContract.address,
          functionName: "balanceOf",
          paramTypes: ["address"],
          paramValues: [this.address],
          returnType: "uint256",
          resultHandler: (result) => { this.projectTokenBalance = result; },
        },
        {
          contractAddress: this.fundingTokenContract.address,
          functionName: "balanceOf",
          paramTypes: ["address"],
          paramValues: [this.address],
          returnType: "uint256",
          resultHandler: (result) => { this.fundingTokenBalance = result; },
        },
      ];

      batcher = this.multiCallService.createBatcher(batchedCalls);

      await batcher.start();

      const price = this.projectTokenPriceInEth(
        exchangeRate,
        this.fundingTokenInfo,
        this.projectTokenInfo);

      this.fundingTokensPerProjectToken = this.numberService.fromString(price);

      this.valuation = this.numberService.fromString(fromWei(totalSupply, this.fundingTokenInfo.decimals))
              * (this.fundingTokenInfo.price ?? 0);

      this.hasEnoughProjectTokens =
        this.seedInitialized && ((this.seedRemainder && this.feeRemainder) ? this.projectTokenBalance?.gte(this.feeRemainder?.add(this.seedRemainder)) : false);

      await this.hydrateUser();
    }
    catch (error) {
      this.disable();
      this.consoleLogService.logMessage(`Seed: Error initializing seed: ${error?.message ?? error}`, "error");
    } finally {
      this.initializing = false;
    }
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  private async hydrateUser(): Promise<void> {
    const account = this.ethereumService.defaultAccountAddress;

    this.userHydrated = false;

    if (!account) return;

    const lock: IFunderPortfolio = await this.contract.funders(account ?? 0);
    const classesFromContract: IContractContributorClasses = await this.contract.getAllClasses();
    this.classes = convertContractClassesToFrontendClasses(classesFromContract);
    const individualClass = this.classes[lock.class ?? 0];
    this.usersClass = individualClass;
    this.userCurrentFundingContributions = lock.fundingAmount;

    // this.vestingDuration = individualClass.vestingDuration.toNumber();
    // this.classCap = individualClass.classFee;
    // this.classSold = individualClass.classFundingCollected;

    if (account) {
      let whitelisted: boolean;

      const batchedCalls: Array<IBatcherCallsModel> = [
        // can't figure out how to supply the returnType for a struct
        // {
        //   contractAddress: this.address,
        //   functionName: "funders",
        //   paramTypes: ["address"],
        //   paramValues: [account],
        //   returnType: "[uint256,uint256]",
        //   resultHandler: (result) => { lock = result; },
        // },
        {
          contractAddress: this.fundingTokenContract.address,
          functionName: "balanceOf",
          paramTypes: ["address"],
          paramValues: [account],
          returnType: "uint256",
          resultHandler: (result) => { this.userFundingTokenBalance = result; },
        },
        // { GONE -> funders
        //   contractAddress: this.address,
        //   functionName: "whitelisted",
        //   paramTypes: ["address"],
        //   paramValues: [account],
        //   returnType: "bool",
        //   resultHandler: (result) => { whitelisted = result; },
        // },
      ];

      const batcher = this.multiCallService.createBatcher(batchedCalls);

      await batcher.start();



      // this.userClaimableAmount = await this.contract.callStatic.calculateClaimFunder(account);
      this.userClaimableAmount = await this.contract.callStatic.calculateClaimFunder(account);
      this.userCanClaim = this.userClaimableAmount.gt(0);
      const seedAmount = this.seedsFromFunding(lock.fundingAmount);
      /**
       * seeds that will be claimable, but are currently still vesting
       */
      this.userPendingAmount = seedAmount.sub(lock.totalClaimed).sub(this.userClaimableAmount);
      this.userIsWhitelisted = !this.whitelisted ||
        this.userCanClaim || // can claim now
        this.userPendingAmount.gt(0) || // can eventually claim
        this.userCanRetrieve ||
        whitelisted;
      this.userHydrated = true;
    }
  }

  private async hydrateMetadata(): Promise<void> {
    if (this.metadataHash) {
      this.metadata = await this.ipfsService.getObjectFromHash(this.metadataHash);
      if (!this.metadata) {
        this.eventAggregator.publish("Seed.InitializationFailed", this.address);
        throw new Error(`seed metadata is not found in IPFS, seed is unusable: ${this.address}`);
      }
      this.consoleLogService.logMessage(`loaded seed metadata: ${this.metadataHash}`, "info");
    }
  }

  private seedsFromFunding(fundingAmount: BigNumber): BigNumber {
    const bnFundingAmount = toBigNumberJs(fundingAmount);
    if ((this.fundingTokensPerProjectToken > 0) && (fundingAmount.gt(0))) {
      return BigNumber.from(bnFundingAmount.idiv(this.fundingTokensPerProjectToken).toString());
    } else {
      return BigNumber.from(0);
    }
  }

  async fund(): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.projectTokenContract.transfer(this.address, this.seedAmountRequired?.add(this.feeRemainder)))
      .then(async (receipt) => {
        if (receipt) {
          await this.hydrate();
          return receipt;
        }
      });
  }

  public buy(amount: BigNumber): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.buy(amount))
      .then(async (receipt) => {
        if (receipt) {
          await this.hydrate();
          return receipt;
        }
      });
  }

  public claim(amount: BigNumber): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.claim(amount))
      .then(async (receipt) => {
        if (receipt) {
          await this.hydrate();
          return receipt;
        }
      });
  }

  async addWhitelist(whitelistAddress: Set<Address>): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.whitelistBatch([...whitelistAddress]),
    ).then((receipt) => {
      if (receipt){
        this.hydrateUser();
        return receipt;
      }
    });
  }

  async addToWhitelist(address: Address): Promise<TransactionReceipt> {
    if (address){
      return this.transactionsService.send(
        () => this.contract.whitelist(address),
      ).then((receipt) => {
        if (receipt){
          this.hydrateUser();
          return receipt;
        }
      });
    }
  }

  async removeFromWhitelist(address: Address): Promise<TransactionReceipt> {
    if (address){
      return this.transactionsService.send(
        () => this.contract.unwhitelist(address),
      ).then((receipt) => {
        if (receipt){
          this.hydateClosedOrPaused();
          return receipt;
        }
      });
    }
  }

  async pause (): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.pause())
      .then((receipt) => {
        if (receipt){
          this.hydateClosedOrPaused();
          return receipt;
        }
      });
  }

  async unPause(): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.unpause())
      .then((receipt) => {
        if (receipt){
          this.hydateClosedOrPaused();
          return receipt;
        }
      });
  }

  async close(): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.close())
      .then((receipt) => {
        if (receipt){
          this.hydateClosedOrPaused();
          return receipt;
        }
      });
  }

  async addClassBatch({
    classNames,
    classCaps,
    individualCaps,
    classVestingDurations,
    classVestingCliffs,
    classAllowlists,
  }: IAddClassParams ): Promise<TransactionReceipt> {
    try {
      const addClassArgs = [
        classNames.map(name => formatBytes32String(name as string)),
        classCaps,
        individualCaps,
        classVestingCliffs,
        classVestingDurations,
        classAllowlists.map(list => Array.from(list)),
      ];

      const receipt = await this.transactionsService.send(() => this.contract.addClassesAndAllowlists(
        ...addClassArgs,
      ));
      return receipt;
    } catch (ex) {
      console.log({ex});
    }
  }

  async changeClass({
    editedIndexes,
    editedClassNames,
    editedClassCaps,
    editedIndividualCaps,
    editedClassVestingDurations,
    editedClassVestingCliffs,
    editedClassAllowlists,
  }: Record<string, unknown[]>): Promise<TransactionReceipt> {
    try {
      const changeClassArgs = [
        editedIndexes,
        editedClassNames.map(name => formatBytes32String(name as string)),
        editedClassCaps,
        editedIndividualCaps,
        editedClassVestingCliffs,
        editedClassVestingDurations,
        editedClassAllowlists.map(list => Array.from(list as Set<string>)),
      ];

      const receipt = await this.transactionsService.send(() => this.contract.changeClassesAndAllowlists(
        ...changeClassArgs,
      ));
      return receipt;
    } catch (ex) {
      this.consoleLogService.logMessage(`Error while trying to edit a class: ${ex.message}`, "error");
    }
  }

  public fundingTokenAllowance(): Promise<BigNumber> {
    return this.fundingTokenContract.allowance(this.ethereumService.defaultAccountAddress, this.address);
  }

  public async updateUserFundingTokenBalance(userAddress: Address): Promise<void> {
    const result = (await this.fundingTokenContract.callStatic.balanceOf(userAddress)) as BigNumber;
    this.userFundingTokenBalance = result;
  }

  public async updateAmountRaised(): Promise<void> {
    const updatedAmount = await this.contract.callStatic.fundingCollected() as BigNumber;
    this.amountRaised = updatedAmount;
  }

  public unlockFundingTokens(amount: BigNumber): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.fundingTokenContract.approve(this.address, amount));
  }

  public retrieveFundingTokens(): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.retrieveFundingTokens())
      .then(async (receipt) => {
        if (receipt) {
          await this.hydrate();
          this.hydrateUser();
          return receipt;
        }
      });
  }

  public retrieveProjectTokens(receiver: Address): Promise<TransactionReceipt> {
    if (receiver){
      return this.transactionsService.send(() => this.contract.retrieveSeedTokens(receiver))
        .then(async (receipt) => {
          if (receipt) {
            await this.hydrate();
            this.hydrateUser();
            return receipt;
          }
        });
    }
  }

  public withdrawFundingTokens(): Promise<TransactionReceipt> {
    return this.transactionsService.send(() => this.contract.withdraw())
      .then(async (receipt) => {
        if (receipt) {
          await this.hydrate();
          this.hydrateUser();
          return receipt;
        }
      });
  }

  public async hydateClosedOrPaused(): Promise<boolean> {
    this.isPaused = await this.contract.paused();
    this.isClosed = await this.contract.closed();
    return this.isPaused || this.isClosed;
  }
}

/**
 * @example
 * contractClasses = {
 *    classNames: [...] // length of this array is number of classes
      classCaps: [...]
      individualCaps: [...]
      vestingDurations: [...]
      vestingCliffs: [...]
      classFundingsCollected: [...]
 * }

    -- convertContractClassesToFrontendClasses(contractClasses) -->

    result: IContributorClass
 */
function convertContractClassesToFrontendClasses(contractClasses: IContractContributorClasses) {
  const numOfClasses = contractClasses[0].length;
  const allClasses = Array.from({ length: numOfClasses }, () => ({})) as IContributorClass[];

  contractClasses.classNames.forEach((value, index) => {
    const className = index === 0 ? "Default Class" : parseBytes32String(value);
    allClasses[index].className = className;
  });
  contractClasses.classCaps.forEach((value, index) => {
    allClasses[index].classCap = value;
  });
  contractClasses.individualCaps.forEach((value, index) => {
    allClasses[index].individualCap = value;
  });
  contractClasses.vestingDurations.forEach((value, index) => {
    allClasses[index].classVestingDuration = value.toNumber();
  });
  contractClasses.vestingCliffs.forEach((value, index) => {
    allClasses[index].classVestingCliff = value.toNumber();
  });
  contractClasses.classFundingsCollected.forEach((value, index) => {
    allClasses[index].classFundingCollected = value;
  });

  return allClasses;
}
