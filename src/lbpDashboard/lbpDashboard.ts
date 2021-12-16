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
import { IHistoricalPriceRecord } from "services/ProjectTokenHistoricalPriceService";
import { IDisposable } from "services/IDisposable";

@autoinject
export class lbpDashboard {
  address: Address;
  perMinuteSubscription: IDisposable;
  lbpMgr: LbpManager;
  loading = true;
  projectTokenHistoricalPrices: Array<IHistoricalPriceRecord>;
  poke = false;

  constructor(
    private eventAggregator: EventAggregator,
    private lbpManagerService: LbpManagerService,
    private ethereumService: EthereumService,
    private disclaimerService: DisclaimerService,
    private router: Router,
    private storageService: BrowserStorageService,
  ) {
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

      this.perMinuteSubscription = this.eventAggregator.subscribe("minutePassed", () => this.handleNewMinute(this.lbpMgr) );

      this.handleNewMinute(lbpmgr);

      this.lbpMgr = lbpmgr;

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
    this.perMinuteSubscription.dispose();
  }

  private async handleNewMinute(lbpMgr: LbpManager): Promise<void> {
    /**
     * this updates
     *   lbpMgr.projectTokenInfo.price,
     *     upon which both project-token-info and lbp-price-chart depend, and
     *   lbpMgr.averagePrice,
     *     upon which time-remaining and lbp-price-chart depends
     */
    await lbpMgr.hydrateProjectTokenPrice(true);
    /**
     * this updates
     *   lbpMgr.priceHistory,
     *     upon which project-token and lbp-price-chart depend
     */
    await lbpMgr.ensurePriceData(true);
    /**
     * force graph to redraw.  This is a little hack to make it redraw just once,
     * a number of its dependencies having changed above.
     *
     * Note: we need to have executed serially the functions above because
     * ensurePriceData depends on stuff that is changed in hydrateProjectTokenPrice.
     */
    this.poke = !this.poke;
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
