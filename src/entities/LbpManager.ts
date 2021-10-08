import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { ILbpConfig } from "newLaunch/lbp/config";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ContractNames, ContractsService } from "services/ContractsService";
import { DateService } from "services/DateService";
import { DisposableCollection } from "services/DisposableCollection";
import { Address, EthereumService, Hash } from "services/EthereumService";
import { IpfsService } from "services/IpfsService";
import { ILaunch, LaunchType } from "services/launchTypes";
import { NumberService } from "services/NumberService";
import { ITokenInfo, TokenService } from "services/TokenService";
import TransactionsService from "services/TransactionsService";
import { Utils } from "services/utils";

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
  public userHydrated = false;

  /**
 * "seed token" is a synonym for "project token"
 */
  public projectTokenAddress: Address;
  public projectTokenInfo: ITokenInfo;
  public projectTokenContract: any;
  public fundingTokenAddress: Address;
  public fundingTokenInfo: ITokenInfo;
  public fundingTokenContract: any;
  public isPaused: boolean;
  public isClosed: boolean;

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
    private contractsService: ContractsService,
    private consoleLogService: ConsoleLogService,
    private eventAggregator: EventAggregator,
    private dateService: DateService,
    private tokenService: TokenService,
    private transactionsService: TransactionsService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private ipfsService: IpfsService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("secondPassed", async (state: { now: Date }) => {
      this._now = state.now;
    }));

    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      await this.loadContracts().then(() => { this.hydrateUser(); });
    }));
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

  private async loadContracts(): Promise<void> {
    try {
      this.contract = await this.contractsService.getContractAtAddress(ContractNames.SEED, this.address);
      if (this.projectTokenAddress) {
        this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
        this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);
      }
    }
    catch (error) {
      this.corrupt = true;
      this.initializing = false;
      this.consoleLogService.logMessage(`Seed: Error initializing seed: ${error?.message ?? error}`, "error");
    }
  }

  private async hydrate(): Promise<void> {
    try {
      await this.hydrateMetadata();

      this.lbpInitialized = await this.contract.initialized();
      this.poolFunded = await this.contract.poolFunded();
      this.admin = await this.contract.admin();
      this.projectTokenAddress = await this.contract.seedToken();
      this.fundingTokenAddress = await this.contract.fundingToken();

      this.projectTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.projectTokenAddress);
      this.fundingTokenInfo = await this.tokenService.getTokenInfoFromAddress(this.fundingTokenAddress);

      this.projectTokenContract = this.tokenService.getTokenContract(this.projectTokenAddress);
      this.fundingTokenContract = this.tokenService.getTokenContract(this.fundingTokenAddress);

      this.startTime = this.dateService.unixEpochToDate((await this.contract.startTime()).toNumber());
      this.endTime = this.dateService.unixEpochToDate((await this.contract.endTime()).toNumber());
      // this.fundingTokensPerProjectToken = this.numberService.fromString(fromWei(await this.contract.price(), this.fundingTokenInfo.decimals));
      // // this.capPrice = this.numberService.fromString(fromWei(this.cap, this.fundingTokenInfo.decimals)) * (this.fundingTokenInfo.price ?? 0);
      // this.valuation = this.numberService.fromString(fromWei(await this.fundingTokenContract.totalSupply(), this.fundingTokenInfo.decimals))
      //   * (this.fundingTokenInfo.price ?? 0);

      await this.hydateClosedOrPaused();
      await this.hydrateTokensState();

      await this.hydrateUser();
    }
    catch (error) {
      this.corrupt = true;
      this.consoleLogService.logMessage(`Seed: Error initializing seed: ${error?.message ?? error}`, "error");
    } finally {
      this.initializing = false;
    }
  }

  public ensureInitialized(): Promise<void> {
    return this.initializedPromise;
  }

  public async hydateClosedOrPaused(): Promise<boolean> {
    this.isPaused = await this.contract.paused();
    this.isClosed = await this.contract.closed();
    return this.isPaused || this.isClosed;
  }

  public create(config: ILbpManagerConfiguration): LbpManager {
    this.initializedPromise = Utils.waitUntilTrue(() => !this.initializing, 9999999999);
    return Object.assign(this, config);
  }


  private async hydrateUser(): Promise<void> {
    const account = this.ethereumService.defaultAccountAddress;

    this.userHydrated = false;

    if (account) {
      this.userHydrated = true;
    }
  }

  private async hydrateMetadata(): Promise<void> {
    const rawMetadata = await this.contract.metadata();
    if (rawMetadata && Number(rawMetadata)) {
      this.metadataHash = Utils.toAscii(rawMetadata.slice(2));
      this.consoleLogService.logMessage(`loaded metadata: ${this.metadataHash}`, "info");
    } else {
      this.eventAggregator.publish("Seed.InitializationFailed", this.address);
      throw new Error(`seed lacks metadata, is unusable: ${this.address}`);
    }

    if (this.metadataHash) {
      this.metadata = await this.ipfsService.getObjectFromHash(this.metadataHash);
      if (!this.metadata) {
        this.eventAggregator.publish("Seed.InitializationFailed", this.address);
        throw new Error(`seed metadata is not found in IPFS, seed is unusable: ${this.address}`);
      }
    }
  }

  private async hydrateTokensState(): Promise<void> {
    // this.projectTokenBalance = await this.projectTokenContract.balanceOf(this.address);
    // this.fundingTokenBalance = await this.fundingTokenContract.balanceOf(this.address);
    // this.hasEnoughProjectTokens =
    //   this.lbpInitialized && ((this.seedRemainder && this.feeRemainder) ? this.projectTokenBalance?.gte(this.feeRemainder?.add(this.seedRemainder)) : false);
  }
}
