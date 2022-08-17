import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Seed } from "entities/Seed";
import { LbpManager } from "entities/LbpManager";
import "./launchCard.scss";
import dayjs from "dayjs";

@autoinject
export class LaunchCard {
  launch: Seed | LbpManager;
  dates = {
    start: {
      date: null,
      time: null,
    },
    end: {
      date: null,
      time: null,
    }
  }
  container: HTMLElement;

  constructor(
    private router: Router,
  ) {}

  getTime(date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const getDay = new Date(date).getUTCDate();
    const getMonth = monthNames[new Date(date).getMonth()];
    const getYear = new Date(date).getFullYear();

    return `${getDay} ${getMonth} ${getYear}`;
  }

  activate(model: Seed | LbpManager): void {
    this.launch = model;

    this.dates.start.date = this.getTime(this.launch.startTime);
    this.dates.start.time = dayjs(this.launch.startTime).format("h:mm A");

    this.dates.end.date = this.getTime(this.launch.endTime);
    this.dates.end.time = dayjs(this.launch.endTime).format("h:mm A");
  }
}
