import { LbpManager } from "entities/LbpManager";
import { Address, EthereumService } from "services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import "./dashboard.scss";
import { EventAggregator } from "aurelia-event-aggregator";
import { DisposableCollection } from "services/DisposableCollection";
import { EventConfigException } from "services/GeneralEvents";
import { WhiteListService } from "services/WhiteListService";
import { LbpManagerService } from "services/LbpManagerService";
import TransactionsService from "services/TransactionsService";

@autoinject
export class LbpAdminDashboard {

  lbps: Array<LbpManager> = [];
  defaultLbpAddress: Address;
  selectedLbp: LbpManager;
  selectedLbpIndex: number;
  addressToRemove = "";
  addressToAdd = "";
  receiverAddress = "";
  subscriptions: DisposableCollection = new DisposableCollection();
  loading = true;

  @computedFrom("ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress;
  }

  constructor(
    private eventAggregator: EventAggregator,
    private lbpManagerService: LbpManagerService,
    private ethereumService: EthereumService,
    private whiteListService: WhiteListService,
    private transactionsService: TransactionsService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Network.Changed.Account", async () => {
      this.hydrate();
    }));
  }

  async activate(params: { address: Address }): Promise<void> {
    this.defaultLbpAddress = params?.address;
  }

  async attached(): Promise<void> {

    try {
      if (this.lbpManagerService.initializing) {
        this.eventAggregator.publish("launches.loading", true);
        await this.lbpManagerService.ensureAllLbpsInitialized();
      }
      await this.hydrate();

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("launches.loading", false);
      this.loading = false;
    }
  }

  async hydrate(): Promise<void> {
    if (this.ethereumService.defaultAccountAddress) {
      const defaultAccount: Address = this.ethereumService.defaultAccountAddress.toLowerCase();
      this.lbps = this.lbpManagerService.lbpManagersArray
        .filter((seed) => { return seed.admin.toLowerCase() === defaultAccount;});
      if (this.lbps.length === 1){
        this.selectedLbp = this.lbps[0];
        this.selectedLbpIndex = 0;
      }
    } else {
      this.lbps = [];
    }
    if (this.defaultLbpAddress) {
      const defaultSeed = this.lbps.filter((seed) => this.defaultLbpAddress === seed.address);
      if (defaultSeed.length === 1) {
        this.selectedLbpIndex = this.lbps.indexOf(defaultSeed[0]);
        this.selectedLbp = defaultSeed[0];
      }
    }
  }

  selectLbp(index: number): void {
    this.selectedLbp = this.lbps[index];
    this.selectedLbpIndex = index;
  }

  // @computedFrom("selectedSeed")
  // get retrievableProjectTokenAmount(): BigNumber {
  //   if (!this.selectedLbp.address){
  //     return BigNumber.from(0);
  //   }
  //   const tokenToBeDistributed = this.selectedLbp.seedAmountRequired.sub(this.selectedLbp.seedRemainder).sub(this.selectedLbp.feeRemainder);
  //   return this.selectedLbp.minimumReached ?
  //     this.selectedLbp.projectTokenBalance.sub(tokenToBeDistributed) :
  //     this.selectedLbp.projectTokenBalance;
  // }

  // async addWhitelist(): Promise<TransactionReceipt> {
  //   const whitelistAddress: Set<Address> = await this.whiteListService.getWhiteList(this.selectedLbp.metadata.launchDetails.whitelist);
  //   return await this.selectedLbp.addWhitelist(whitelistAddress);
  // }


  async fund(): Promise<void> {
    const fundingAmounts = await this.selectedLbp.getTokenFundingAmounts();

    await this.transactionsService.send(
      () => this.selectedLbp.projectTokenContract.approve(this.selectedLbp.address, fundingAmounts.project));

    await this.transactionsService.send(
      () => this.selectedLbp.fundingTokenContract.approve(this.selectedLbp.address, fundingAmounts.funding));

    this.selectedLbp.fund();
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }
}
