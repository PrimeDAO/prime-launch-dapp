import { EthereumService } from "./../services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";
import { Utils } from "services/utils";
import axios from "axios";

@singleton(false)
@autoinject
export class Home {

  subscriberEmail: string;
  loading: boolean;

  constructor(
    private router: Router,
    private seedService: SeedService,
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
  ) {
  }

  navigate(href: string): void {
    this.router.navigate(href);
  }

  async subscribe(): Promise<void> {
    if (!Utils.isValidEmail(this.subscriberEmail)) {
      this.eventAggregator.publish("handleValidationError", "Please enter a valid email address");
    } else {
      try {
        const response = await axios.post("https://api.primedao.io/subscribeEmailAddress",
          {
            prod: (process.env.NODE_ENV === "production") && (this.ethereumService.targetedNetwork === "mainnet"),
            email: this.subscriberEmail,
          });

        if (response.status !== 200) {
          throw Error(`An error occurred submitting the email: ${response.statusText}`);
        }
        this.eventAggregator.publish("showMessage", "Your email address has been submitted!");
      } catch (ex) {
        this.eventAggregator.publish("handleException", `Sorry, we are enable to submit the email: ${ex.error?.message ?? ex?.reason ?? ex?.message ?? ex}`);
      }
    }
  }
}
