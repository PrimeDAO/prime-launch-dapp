import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { DialogCloseResult, DialogService } from "services/DialogService";
import { Disclaimer } from "../resources/dialogs/disclaimer/disclaimer";
import axios from "axios";
import { BrowserStorageService } from "services/BrowserStorageService";
import { Address } from "services/EthereumService";
import { AxiosService } from "services/axiosService";
const marked = require("marked");

@autoinject
export class DisclaimerService {

  disclaimed = false;
  waiting = false;

  constructor(
    private dialogService: DialogService,
    private eventAggregator: EventAggregator,
    private storageService: BrowserStorageService,
    private axiosService: AxiosService,
  ) {
  }

  private getPrimeDisclaimerStatusKey(accountAddress: Address): string {
    return `disclaimer-${accountAddress}`;
  }

  public getPrimeDisclaimed(accountAddress: Address): boolean {
    return accountAddress && (this.storageService.lsGet(this.getPrimeDisclaimerStatusKey(accountAddress), "false") === "true");
  }

  private async disclaimPrime(accountAddress: string): Promise<boolean> {

    let disclaimed = false;

    if (this.getPrimeDisclaimed(accountAddress)) {
      disclaimed = true;
    } else {
      const response = await this.showDisclaimer(
        "https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/README.md",
        "PrimeLAUNCH Disclaimer",
      );

      if (typeof response.output === "string") {
        // then an error occurred
        this.eventAggregator.publish("handleFailure", response.output);
        disclaimed = false;
      } else if (response.wasCancelled) {
        disclaimed = false;
      } else {
        disclaimed = response.output as boolean;
      }
    }
    return disclaimed;
  }

  public async ensurePrimeDisclaimed(account: string): Promise<boolean> {
    if (!this.getPrimeDisclaimed(account)) {
      const accepted = await this.disclaimPrime(account);
      if (accepted) {
        this.storageService.lsSet(this.getPrimeDisclaimerStatusKey(account), "true");
      } else {
        return false;
      }
    }
    return true;
  }

  public async confirmMarkdown(url: string): Promise<boolean> {

    const disclaimer = await axios.get(url)
      .then((response) => {
        if (response.data) {
          return response.data;
        } else {
          return null;
        }
      })
      .catch((err) => {
        this.axiosService.axiosErrorHandler(err);
        return null;
      });

    let result = false;

    if (disclaimer) {
      try {
        marked(disclaimer);
        result = true;
      }
      // eslint-disable-next-line no-empty
      catch { }
    }
    return result;
  }

  public showDisclaimer(disclaimerUrl: string, title: string): Promise<DialogCloseResult> {
    return this.dialogService.open(Disclaimer, { disclaimerUrl, title }, { keyboard: true })
      .whenClosed(
        (result: DialogCloseResult) => result,
        (error: string) => { return { output: error, wasCancelled: false }; });
  }
}
