import { BrowserStorageService } from "../services/BrowserStorageService";
import { Router } from "aurelia-router";
import { DisclaimerService } from "../services/DisclaimerService";
import { EthereumService } from "../services/EthereumService";
import { autoinject, computedFrom } from "aurelia-framework";
import { LbpManagerService } from "services/LbpManagerService";
import { Address } from "services/EthereumService";
import "./lbpDashboard.scss";
import { LbpManager } from "entities/LbpManager";
import { Utils } from "services/utils";
import { EventConfigException } from "services/GeneralEvents";
import { EventAggregator } from "aurelia-event-aggregator";
import { NumberService } from "services/NumberService";
import { DisposableCollection } from "services/DisposableCollection";
import { IHistoricalPriceRecord } from "services/ProjectTokenHistoricalPriceService";
import { DateService } from "services/DateService";

@autoinject
export class lbpDashboard {
  address: Address;
  subscriptions: DisposableCollection = new DisposableCollection();
  lbpMgr: LbpManager;
  loading = true;
  projectTokenHistoricalPrices: Array<IHistoricalPriceRecord>;
  priceFetchIntervalId: any;

  constructor(
    private dateService: DateService,
    private eventAggregator: EventAggregator,
    private lbpManagerService: LbpManagerService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private disclaimerService: DisclaimerService,
    private router: Router,
    private storageService: BrowserStorageService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("seed.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.lbpMgr?.userHydrated;
  }

  @computedFrom("lbpMgr", "ethereumService.defaultAccountAddress")
  private get lbpDisclaimerStatusKey() {
    return `lbp-disclaimer-${this.lbpMgr?.address}-${this.ethereumService.defaultAccountAddress}`;
  }

  private get lbpDisclaimed(): boolean {
    return this.ethereumService.defaultAccountAddress && (this.storageService.lsGet(this.lbpDisclaimerStatusKey, "false") === "true");
  }

  @computedFrom("lbpMgr.priceHistory")
  private get graphData(): Array<any> {
    const priceHistoryLength = this.lbpMgr?.priceHistory?.length;
    const lbpAveragePrice = priceHistoryLength
      ? (this.lbpMgr?.priceHistory.reduce((a, b) => a + b.price, 0) / priceHistoryLength)
      : 0;

    const trajectoryForecast = this.lbpMgr?.getTrajectoryForecastData();
    const averagePriceData = (lbpAveragePrice > 0 && priceHistoryLength)? [
      {
        time: this.lbpMgr?.priceHistory[0]?.time,
        price: lbpAveragePrice,
      },
      {
        time: trajectoryForecast.length > 0
          ? trajectoryForecast[trajectoryForecast.length - 1]?.time
          : this.lbpMgr?.priceHistory[priceHistoryLength - 1]?.time,
        price: lbpAveragePrice,
      },
    ] : [];

    return [
      {
        data: this.lbpMgr?.priceHistory,
        color: "#FF497A",
      },
      {
        data: trajectoryForecast,
        color: "#403453",
        lineStyle: 2,
      },
      {
        name: "Average Price",
        data: averagePriceData,
        color: "#A258A7",
        lineWidth: 1,
      },
    ];
  }

  public async canActivate(params: { address: Address }): Promise<boolean> {
    await this.lbpManagerService.ensureInitialized();
    const lbpMgr = this.lbpManagerService.lbpManagers?.get(params.address);
    await lbpMgr.ensureInitialized();
    return lbpMgr?.canGoToDashboard;
  }

  async activate(params: { address: Address}): Promise<void> {
    this.address = params.address;
  }

  async attached(): Promise<void> {
    let waiting = false;

    try {
      if (this.lbpManagerService.initializing) {
        await Utils.sleep(200);
        this.eventAggregator.publish("launches.loading", true);
        waiting = true;
        await this.lbpManagerService.ensureInitialized();
      }
      const lbpmgr = this.lbpManagerService.lbpManagers.get(this.address);
      if (!lbpmgr) {
        throw new Error("Failed to instantiate LbpManager");
      }
      if (lbpmgr.initializing) {
        if (!waiting) {
          await Utils.sleep(200);
          this.eventAggregator.publish("launches.loading", true);
          waiting = true;
        }
        await lbpmgr.ensureInitialized();
      }
      this.lbpMgr = lbpmgr;

      if (!lbpmgr.priceHistory) {
        this.lbpMgr.ensurePriceHistory();
      }
      await this.hydrateUserData();

      this.priceFetchIntervalId = setInterval(() => {
        this.lbpMgr.ensurePriceHistory(true);
      }, 60000);

    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      if (waiting) {
        this.eventAggregator.publish("launches.loading", false);
      }
      this.loading = false;
    }
  }

  detached(): void {
    if (this.priceFetchIntervalId) {
      clearInterval(this.priceFetchIntervalId);
      this.priceFetchIntervalId = null;
    }
  }

  async hydrateUserData(): Promise<void> {
    // eslint-disable-next-line no-empty
    if (this.ethereumService.defaultAccountAddress) {
    }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  async disclaimLbp(): Promise<boolean> {

    let disclaimed = false;

    if (!this.lbpMgr.metadata.launchDetails.legalDisclaimer || this.lbpDisclaimed) {
      disclaimed = true;
    } else {
      // const response = await this.dialogService.disclaimer("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/README.md");
      const response = await this.disclaimerService.showDisclaimer(
        this.lbpMgr.metadata.launchDetails.legalDisclaimer,
        `${this.lbpMgr.metadata.general.projectName} Disclaimer`,
      );

      if (typeof response.output === "string") {
      // then an error occurred
        this.eventAggregator.publish("handleFailure", response.output);
        disclaimed = false;
      } else if (response.wasCancelled) {
        disclaimed = false;
      } else {
        if (response.output) {
          this.storageService.lsSet(this.lbpDisclaimerStatusKey, "true");
        }
        disclaimed = response.output as boolean;
      }
    }
    return disclaimed;
  }
}
