import { EthereumService } from "./../services/EthereumService";
import { EventAggregator } from "aurelia-event-aggregator";
import { SeedService } from "services/SeedService";
import { autoinject, singleton } from "aurelia-framework";
import { Router } from "aurelia-router";
import "./home.scss";
import { Utils } from "services/utils";
import axios from "axios";

interface ILaunch {
  id: number
  title: string
}

@singleton(false)
@autoinject
export class Home {

  subscriberEmail: string;
  loading: boolean;
  launchesState: ILaunch[];
  launchCard: any // !!!
  activeLaunchState: ILaunch;

  launchData = [
    {
      id: 1,
      type: {
        title: "SEED",
        image: "https://s2.coinmarketcap.com/static/img/coins/64x64/16107.png",
      },
      title: "Green Lab Token",
      description: "Looking for spicey DAOs to partner with and create more spice in the spice world. We are offering 100.000 $ of our tokens for a token swap deal.",
      event: {
        time: "Starts in 1 day",
        color: "#FF5252",
        backgroundColor: "rgba(62, 38, 60, 1)",
      },
      crypto: [
        {
          currency: "D2D",
          image: "https://s2.coinmarketcap.com/static/img/coins/64x64/16107.png",
        },
      ],
      start: {
        title: "START",
        fullDate: "16 Nov 2021",
        time: "12:00 CET",
      },
      end: {
        title: "END",
        fullDate: "22 Jan 2022",
        time: "12:00 CET",
      },
    },
    {
      id: 2,
      type: {
        title: "LBP",
        image: "http://cdn.shopify.com/s/files/1/0565/1375/7354/products/kiss-cut-stickers-4x4-default-609201d088ae2_1200x1200.jpg?v=1620181461",
      },
      title: "Green Lab Token",
      description: "Looking for spicey DAOs to partner with and create more spice in the spice world. We are offering 100.000 $ of our tokens for a token swap deal.",
      event: {
        time: "LIVE, 12 hours left",
        color: "rgba(56, 222, 103, 1)",
        backgroundColor: "rgba(43, 49, 57, 1)",
      },
      crypto: [
        {
          currency: "GLT",
          image: "https://s2.coinmarketcap.com/static/img/coins/64x64/16107.png",
        },
        {
          currency: "DAI",
          image: "http://cdn.shopify.com/s/files/1/0565/1375/7354/products/kiss-cut-stickers-4x4-default-609201d088ae2_1200x1200.jpg?v=1620181461",
        },
      ],
      currencyPrice: {
        title: "CURRENCY PRICE",
        price: "$ 3.14",
        description: "+ 0.12 (4,20%)",
      },
    },
    {
      id: 3,
      type: {
        title: "LBP",
        image: "https://play-lh.googleusercontent.com/IxfrWxUCBDHz8ecsjw0kVMsxlwmkuIpMPORJbNk2juqlaYWtRBbph55k2ncMFAyHlHY",
      },
      title: "Green Lab Token",
      description: "Looking for spicey DAOs to partner with and create more spice in the spice world. We are offering 100.000 $ of our tokens for a token swap deal.",
      event: {
        time: "Starts in 5 days",
        color: "rgba(255, 177, 85, 1)",
        backgroundColor: "rgba(62, 48, 56, 1)",
      },
      crypto: [
        {
          currency: "BTC",
          image: "https://play-lh.googleusercontent.com/IxfrWxUCBDHz8ecsjw0kVMsxlwmkuIpMPORJbNk2juqlaYWtRBbph55k2ncMFAyHlHY",
        },
        {
          currency: "ETH",
          image: "http://cdn.shopify.com/s/files/1/0565/1375/7354/products/kiss-cut-stickers-4x4-default-609201d088ae2_1200x1200.jpg?v=1620181461",
        },
      ],
      start: {
        title: "START",
        fullDate: "16 Nov 2021",
        time: "12:00 CET",
      },
      end: {
        title: "END",
        fullDate: "22 Jan 2022",
        time: "12:00 CET",
      },
    },
  ];

  constructor(
    private router: Router,
    private seedService: SeedService,
    private eventAggregator: EventAggregator,
    private ethereumService: EthereumService,
  ) {
    this.launchesState = [
      {
        id: 1,
        title: "All Launches",
      },
      {
        id: 2,
        title: "SEED",
      },
      {
        id: 3,
        title: "LBP",
      },
    ];
    this.activeLaunchState = this.launchesState[0];
    this.launchCard = this.launchData;
  }

  setActiveLaunchState(launch: ILaunch): void {
    this.activeLaunchState = launch;

    this.launchCard = this.launchData;

    if (launch.title !== "All Launches") {
      this.launchCard = this.launchCard.filter(e => e.type.title === launch.title);
    }
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
            prod: (process.env.NODE_ENV === "production") && !EthereumService.isTestNet,
            email: this.subscriberEmail,
          });

        if (response.status !== 200) {
          throw Error(`An error occurred submitting the email: ${response.statusText}`);
        }
        this.eventAggregator.publish("showMessage", "Your email address has been submitted!");
      } catch (ex) {
        this.eventAggregator.publish("handleException", `Sorry, we are enable to submit the email: ${Utils.extractExceptionMessage(ex)}`);
      }
    }
  }
}
