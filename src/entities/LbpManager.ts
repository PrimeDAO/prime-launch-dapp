import { IBatcherCallsModel, MultiCallService } from "./../services/MulticallService";
import { Container } from "aurelia-dependency-injection";
import { LbpProjectTokenPriceService } from "./../services/LbpProjectTokenPriceService";
import { BigNumber } from "@ethersproject/providers/node_modules/@ethersproject/bignumber";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { ILbpConfig } from "newLaunch/lbp/config";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { DateService } from "services/DateService";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService, fromWei, Hash } from "services/EthereumService";
import { IpfsService } from "services/IpfsService";
import { ILaunch, LaunchType } from "services/launchTypes";
import { NumberService } from "services/NumberService";
import { ITokenInfo, TokenService } from "services/TokenService";
import TransactionsService, { TransactionReceipt } from "services/TransactionsService";
import { Utils } from "services/utils";
import { Lbp } from "entities/Lbp";
import { IHistoricalPriceRecord, ProjectTokenHistoricalPriceService } from "services/ProjectTokenHistoricalPriceService";
import { TimingService } from "services/timingService";

export interface ILbpManagerConfiguration {
  address: Address;
  admin: Address;
  metadata: Address;
}

@autoinject
export class LbpManager implements ILaunch {
  public launchType = LaunchType.LBP;
  public contract: any;
  public address: Address;
  public lbpInitialized: boolean;
  public poolFunded: boolean;
  public beneficiary: Address;
  public startTime: Date;
  public endTime: Date;
  public admin: Address;

  /**
    * Is the lbp contract initialized and have enough project tokens to pay its obligations
    */
  public initializing = true;
  public metadata: ILbpConfig;
  public metadataHash: Hash;
  public corrupt = false;
  public userHydrated = true;

  public lbp: Lbp;
  public projectTokenAddress: Address;
  public projectTokenInfo: ITokenInfo;
  public projectTokenContract: any;
  public fundingTokenAddress: Address;
  public fundingTokenInfo: ITokenInfo;
  public fundingTokenContract: any;
  public isPaused: boolean;
  // public fundingTokensPerProjectToken: number;
  // public projectTokensPerFundingToken: number;
  public startingFundingTokenAmount: BigNumber;
  public startingProjectTokenAmount: BigNumber;
  public startingProjectTokenAmountWithFees: BigNumber;
  public projectTokenBalance: BigNumber;
  public fundingTokenBalance: BigNumber;
  public poolTokenBalance: BigNumber;

  // private userFundingTokenBalance: BigNumber;
  public priceHistory: Array<IHistoricalPriceRecord>;
  public projectTokenStartWeight: number;
  public projectTokenEndWeight: number;
  public swapFeePercentage: number;

  private projectTokenIndex: number;
  private fundingTokenIndex: number;
  private processingPriceHistory = false;
  private swapFeesCollected: number;

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

  @computedFrom("uninitialized")
  get canGoToDashboard(): boolean {
    return !this.uninitialized;
  }

  @computedFrom("lbpInitialized", "poolFunded")
  get uninitialized(): boolean {
    return !this.lbpInitialized || !this.poolFunded;
  }

  private initializedPromise: Promise<void>;
  private subscriptions = new DisposableCollection();
  private _now = new Date();

  constructor(
    private projectTokenHistoricalPriceService: ProjectTokenHistoricalPriceService,
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService,
    private eventAggregator: EventAggregator,
    private container: Container,
    private dateService: DateService,
    private tokenService: TokenService,
    private transactionsService: TransactionsService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
    private priceService: LbpProjectTokenPriceService,
    private numberService: NumberService,
    private multiCallService: MultiCallService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (state: { now: Date }) => {
      this._now = state.now;
    }));

    // this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
    //   await this.loadContracts().then(() => { this.hydrateUser(); });
    // }));
  }

  public create(config: ILbpManagerConfiguration): LbpManager {
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

  private createLbp(address: Address): Promise<Lbp> {
    if (address)
    {
      const lbp = this.container.get(Lbp);
      return lbp.initialize(
        address,
        this.address,
        this.projectTokenIndex,
        this.fundingTokenIndex);
    } else {
      return undefined;
    }
  }

  private async loadContracts(): Promise<void> {
    try {
      this.contract = await this.contractsService.getContractAtAddress(ContractNames.LBPMANAGER, this.address);
      if (this.projectTokenAddress) {
        this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
        this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);
      }
      if (this.lbp) {
        await this.lbp.loadContracts();
      }
    }
    catch (error) {
      this.disable();
      this.initializing = false;
      this.consoleLogService.logMessage(`LbpManager: Error initializing lbpmanager: ${error?.message ?? error}`, "error");
    }
  }

  private async hydrate(): Promise<void> {
    try {
      TimingService.start(`hydrate-${this.address}`);

      let rawMetadata: any;
      let lbpAddress: Address;
      let isSwapEnabled = true;

      this.projectTokenIndex = await this.contract.projectTokenIndex();
      this.fundingTokenIndex = this.projectTokenIndex ? 0 : 1;

      const batchedCalls: Array<IBatcherCallsModel> = [
        {
          contractAddress: this.contract.address,
          functionName: "initialized",
          returnType: "bool",
          resultHandler: (result) => { this.lbpInitialized = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "poolFunded",
          returnType: "bool",
          resultHandler: (result) => { this.poolFunded = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "admin",
          returnType: "address",
          resultHandler: (result) => { this.admin = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "metadata",
          returnType: "bytes",
          resultHandler: (result) => { rawMetadata = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "projectTokenIndex",
          returnType: "uint",
          resultHandler: (result) => { this.projectTokenIndex = result.toNumber(); },
        },
        {
          contractAddress: this.contract.address,
          functionName: "tokenList",
          paramTypes: ["uint256"],
          paramValues: [this.projectTokenIndex],
          returnType: "address",
          resultHandler: (result) => { this.projectTokenAddress = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "tokenList",
          paramTypes: ["uint256"],
          paramValues: [this.fundingTokenIndex],
          returnType: "address",
          resultHandler: (result) => { this.fundingTokenAddress = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "startWeights",
          paramTypes: ["uint256"],
          paramValues: [this.projectTokenIndex],
          returnType: "uint256",
          resultHandler: (result) => { this.projectTokenStartWeight = this.numberService.fromString(fromWei(result)); },
        },
        {
          contractAddress: this.contract.address,
          functionName: "endWeights",
          paramTypes: ["uint256"],
          paramValues: [this.projectTokenIndex],
          returnType: "uint256",
          resultHandler: (result) => { this.projectTokenEndWeight = this.numberService.fromString(fromWei(result)); },
        },
        {
          contractAddress: this.contract.address,
          functionName: "swapFeePercentage",
          returnType: "uint256",
          resultHandler: (result) => { this.swapFeePercentage = this.numberService.fromString(fromWei(result)); },
        },
        {
          contractAddress: this.contract.address,
          functionName: "startTimeEndTime",
          paramTypes: ["uint256"],
          paramValues: [0],
          returnType: "uint256",
          resultHandler: (result) => { this.startTime = this.dateService.unixEpochToDate(result.toNumber()); },
        },
        {
          contractAddress: this.contract.address,
          functionName: "startTimeEndTime",
          paramTypes: ["uint256"],
          paramValues: [1],
          returnType: "uint256",
          resultHandler: (result) => { this.endTime = this.dateService.unixEpochToDate(result.toNumber()); },
        },
        {
          contractAddress: this.contract.address,
          functionName: "amounts",
          paramTypes: ["uint256"],
          paramValues: [this.projectTokenIndex],
          returnType: "uint256",
          resultHandler: (result) => { this.startingProjectTokenAmount = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "amounts",
          paramTypes: ["uint256"],
          paramValues: [this.fundingTokenIndex],
          returnType: "uint256",
          resultHandler: (result) => { this.startingFundingTokenAmount = result; },
        },
        {
          contractAddress: this.contract.address,
          functionName: "lbp",
          returnType: "address",
          resultHandler: (result) => { lbpAddress = result; },
        },
      ];

      if (!this.uninitialized) {
        batchedCalls.push(
          {
            contractAddress: this.contract.address,
            functionName: "getSwapEnabled",
            returnType: "bool",
            resultHandler: (result) => { isSwapEnabled = result; },
          },
        );
      }

      const batcher = this.multiCallService.createBatcher(batchedCalls);

      await batcher.start();

      if (rawMetadata && Number(rawMetadata)) {
        this.metadataHash = Utils.toAscii(rawMetadata.slice(2));
      } else {
        this.eventAggregator.publish("LbpManager.InitializationFailed", this.address);
        throw new Error(`LbpManager lacks metadata, is unusable: ${this.address}`);
      }

      await this.hydrateMetadata();

      if (Number(lbpAddress)) {
        this.lbp = await this.createLbp(lbpAddress);
      }

      this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.fundingTokenAddress);

      this.projectTokenInfo = this.metadata.tokenDetails.projectTokenInfo;
      if (!this.projectTokenInfo || (this.projectTokenInfo.address !== this.projectTokenAddress)) {
        throw new Error("project token info is not found or does not match the LbpManager contract");
      }

      this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
      this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);

      this.isPaused = !this.uninitialized && !isSwapEnabled;

      await this.hydrateTokensState();

      TimingService.end(`hydrate-${this.address}`);
    }
    catch (error) {
      this.disable();
      this.consoleLogService.logMessage(`LbpManager: Error initializing lpbManager: ${error?.message ?? error}`, "error");
    } finally {
      this.initializing = false;
    }
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  public async hydratePaused(): Promise<boolean> {
    return this.isPaused = !(await this.getSwapEnabled());
  }

  private async hydrateMetadata(): Promise<void> {

    TimingService.start(`hydrateMetadata-${this.address}`);

    if (this.metadataHash) {
      this.metadata = await this.ipfsService.getObjectFromHash(this.metadataHash);
      if (!this.metadata) {
        this.eventAggregator.publish("LbpManager.InitializationFailed", this.address);
        throw new Error(`LbpManager metadata is not found in IPFS, LbpManager is unusable: ${this.address}`);
      }
      TimingService.end(`hydrateMetadata-${this.address}`);
      this.consoleLogService.logMessage(`loaded LpbManager metadata: ${this.metadataHash}`, "info");
    }
  }

  public async hydrateTokensState(): Promise<void> {
    if (this.lbp) {
      this.projectTokenBalance = this.lbp.vault.projectTokenBalance;
      this.fundingTokenBalance = this.lbp.vault.fundingTokenBalance;
      this.poolTokenBalance = this.lbp.poolTokenBalance;
      this.hydrateFeesCollected(); // save load time by not awaiting this
    }
  }

  private async hydrateFeesCollected(): Promise<void> {
    this.swapFeesCollected = await this.projectTokenHistoricalPriceService.getTotalSwapFees(this);
  }

  public getFundingTokenAllowance(token: Address): Promise<BigNumber> {
    const tokenContract = this.tokenService.getTokenContract(token);
    return tokenContract.allowance(this.ethereumService.defaultAccountAddress, this.lbp.vault.address);
  }

  public allowFundingTokens(token: Address, amount: BigNumber): Promise<TransactionReceipt> {
    const tokenContract = this.tokenService.getTokenContract(token);
    return this.transactionsService.send(() => tokenContract.approve(this.lbp.vault.address, amount));
  }

  public fund(): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.initializeLBP(this.admin))
      .then(async (receipt) => {
        if (receipt) {
          /**
           * now we can fetch an Lbp.  Need it to completely hydrate token state
           */
          this.hydrate();
          return receipt;
        }
      });
  }

  public async withdraw(receiver: Address): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.removeLiquidity(receiver))
      .then(async receipt => {
        if (receipt) {
          this.hydrate();
          return receipt;
        }
      });
  }

  public getSwapEnabled(): Promise<boolean> {
    return this.uninitialized ? Promise.resolve(true) : this.contract.getSwapEnabled();
  }

  public async setSwapEnabled(state: boolean): Promise<TransactionReceipt> {
    return this.transactionsService.send(
      () => this.contract.setSwapEnabled(state))
      .then(async receipt => {
        if (receipt) {
          this.hydratePaused();
          return receipt;
        }
      });
  }

  private priceHistoryPromise: Promise<Array<IHistoricalPriceRecord>>;

  /**
   * call this to make sure that this.priceHistory is hydrated.
   * @returns Promise of same as this.priceHistory
   */
  public ensurePriceHistory(reset = false): Promise<Array<IHistoricalPriceRecord>> {
    if (!this.priceHistoryPromise || reset) {

      if (this.priceHistoryPromise && this.processingPriceHistory) {
        return this.priceHistoryPromise;
      }

      this.processingPriceHistory = true;

      return this.priceHistoryPromise = new Promise<Array<IHistoricalPriceRecord>>((
        resolve: (value: Array<IHistoricalPriceRecord> | PromiseLike<Array<IHistoricalPriceRecord>>) => void,
        reject: (reason?: any) => void,
      ): void => {
        this.projectTokenHistoricalPriceService.getPricesHistory(this)
          .then((history) => {
            this.priceHistory = history;
            resolve(history);
          })
          .catch((ex) => {
            this.consoleLogService.logMessage(ex, "error");
            reject(ex);
          })
          .then(() => {
            this.processingPriceHistory = false;
          });
      });
    } else {
      return this.priceHistoryPromise;
    }
  }
  /**
   * returns projectTokensPerFundingToken
   *
   *  fundingTokensPerProjectToken = 1.0 / fundingTokensPerProjectToken
   *
   *  USD price of a project token
   *  price = fundingTokensPerProjectToken * fundingTokenInfo.price
   */
  public getCurrentExchangeRate(): number {
    const fundingTokensPerProjectToken = this.priceService.getProjectPriceRatio(
      this.numberService.fromString(fromWei(this.projectTokenBalance, this.projectTokenInfo.decimals)),
      this.numberService.fromString(fromWei(this.fundingTokenBalance, this.fundingTokenInfo.decimals)),
      this.lbp.projectTokenWeight,
    );

    const result = 1.0 / fundingTokensPerProjectToken;
    return Number.isFinite(result) ? result : 0;
  }
}

