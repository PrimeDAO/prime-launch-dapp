import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject, computedFrom } from "aurelia-framework";
import { DialogService } from "services/DialogService";

@autoinject
export class DisclaimerService {

  disclaimed = false;
  accountAddress: string;
  waiting = false;

  constructor(
    private dialogService: DialogService,
    private eventAggregator: EventAggregator,
  ) {
  }

  @computedFrom("accountAddress")
  private get primeDisclaimerStatusKey() {
    return `disclaimer-${this.accountAddress}`;
  }

  @computedFrom("primeDisclaimerStatusKey")
  private get primeDisclaimed(): boolean {
    return this.accountAddress && (localStorage.getItem(this.primeDisclaimerStatusKey) === "true");
  }

  public async confirmCanConnect(account: string): Promise<boolean> {
    this.accountAddress = account;
    if (this.primeDisclaimed) {
      return true;
    } else {
      const accepted = await this.disclaimPrime();
      if (accepted) {
        localStorage.setItem(this.primeDisclaimerStatusKey, "true");
        return true;
      }
    }
    return false;
  }

  private async disclaimPrime(): Promise<boolean> {

    let disclaimed = false;

    if (this.primeDisclaimed) {
      disclaimed = true;
    } else {
      // const response = await this.dialogService.disclaimer("https://raw.githubusercontent.com/PrimeDAO/prime-launch-dapp/master/README.md");
      const response = await this.dialogService.disclaimer(
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
}
