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
import { CongratulationsService } from "services/CongratulationsService";

@autoinject
export class lbpDashboard {
  address: Address;
  subscriptions: DisposableCollection = new DisposableCollection();
  lbpMgr: LbpManager;
  loading = true;

  constructor(
    private eventAggregator: EventAggregator,
    private lbpManagerService: LbpManagerService,
    private numberService: NumberService,
    private ethereumService: EthereumService,
    private disclaimerService: DisclaimerService,
    private router: Router,
    private storageService: BrowserStorageService,
    private congratulationsService: CongratulationsService,
  ) {
    this.subscriptions.push(this.eventAggregator.subscribe("Contracts.Changed", async () => {
      this.hydrateUserData();
    }));
  }

  @computedFrom("seed.userHydrated", "ethereumService.defaultAccountAddress")
  get connected(): boolean {
    return !!this.ethereumService.defaultAccountAddress && this.lbpMgr?.userHydrated;
  }

  // @computedFrom("lbpMgr", "ethereumService.defaultAccountAddress")
  // private get lbpDisclaimerStatusKey() {
  //   return `lbp-disclaimer-${this.lbpMgr?.address}-${this.ethereumService.defaultAccountAddress}`;
  // }

  // private get lbpDisclaimed(): boolean {
  //   return this.ethereumService.defaultAccountAddress && (this.storageService.lsGet(this.lbpDisclaimerStatusKey, "false") === "true");
  // }

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
      const seed = this.lbpManagerService.lbpManagers.get(this.address);
      if (seed.initializing) {
        if (!waiting) {
          await Utils.sleep(200);
          this.eventAggregator.publish("launches.loading", true);
          waiting = true;
        }
        await seed.ensureInitialized();
      }
      this.lbpMgr = seed;

      await this.hydrateUserData();

      //this.disclaimSeed();

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

  async hydrateUserData(): Promise<void> {
    // if (this.ethereumService.defaultAccountAddress) {
    // }
  }

  connect(): void {
    this.ethereumService.ensureConnected();
  }

  // async disclaimSeed(): Promise<boolean> {

  //   let disclaimed = false;

  //   if (!this.lbpMgr.metadata.lbpDetails.legalDisclaimer || this.lbpDisclaimed) {
  //     disclaimed = true;
  //   } else {
  //     // const response = await this.dialogService.disclaimer("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/README.md");
  //     const response = await this.disclaimerService.showDisclaimer(
  //       this.lbpMgr.metadata.lbpDetails.legalDisclaimer,
  //       `${this.lbpMgr.metadata.general.projectName} Disclaimer`,
  //     );

  //     if (typeof response.output === "string") {
  //     // then an error occurred
  //       this.eventAggregator.publish("handleFailure", response.output);
  //       disclaimed = false;
  //     } else if (response.wasCancelled) {
  //       disclaimed = false;
  //     } else {
  //       if (response.output) {
  //         this.storageService.lsSet(this.lbpDisclaimerStatusKey, "true");
  //       }
  //       disclaimed = response.output as boolean;
  //     }
  //   }
  //   return disclaimed;
  // }

  async validatePaused(): Promise<boolean> {
    const paused = await this.lbpMgr.hydatePaused();
    if (paused) {
      this.eventAggregator.publish("handleValidationError", "Sorry, this LBP has been paused");
      this.router.navigate("/home");
      return true;
    } else {
      return false;
    }
  }
}
