import { LbpManager } from "./../../../entities/LbpManager";
import { DateService } from "./../../../services/DateService";
import { PLATFORM } from "aurelia-pal";
import { computedFrom, autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./timeLeft.scss";
import { Seed } from "entities/Seed";
import dayjs from "dayjs";
import moment from "moment";

// for webpack
PLATFORM.moduleName("./timeLeftSeed.html");
PLATFORM.moduleName("./timeLeftLbp.html");

@autoinject
export class TimeLeft {

  @bindable launch: Seed | LbpManager;
  @bindable.booleanAttr hideIcons: boolean;
  @bindable.booleanAttr largest: boolean;
  @bindable.booleanAttr contained: boolean;

  timeLeft: HTMLElement;
  tippyInstance: any;

  currentTimeLeft: string;

  constructor(
    private dateService: DateService,
  ) {}

  attached() {
    const now = dayjs();
    const startDate = dayjs(this.launch.startTime);
    const endDate = dayjs(this.launch.endTime);

    let diff = endDate.diff(now, "minutes");

    const diffDays = Math.floor(diff / 60 / 24);
    diff = diff - (diffDays*60*24);
    const diffHours = Math.floor(diff / 60);
    const isMinutes = diffHours === 0 && diff < 60;

    if (now.diff(startDate) > 0) {
      const title = this.launch?.hasNotStarted ? "Starts in " : "";
      this.currentTimeLeft = diffDays > 1 ? `${title}${diffDays} day${diffDays > 1 ? "s" : ""}`: `${title}${diffHours} hours`;
      if (isMinutes) {
        this.currentTimeLeft = `${title}${diff} minutes`;
      }
    } else {
      const soon = 86400000;

      const myDate = Number(now.diff(startDate).toString().replace("-", ""));

      const days = Math.floor(moment.duration(myDate, "milliseconds").asDays());
      const hours = Math.floor(moment.duration(myDate, "milliseconds").asHours());
      const milliseconds = Math.floor(moment.duration(myDate, "milliseconds").asMilliseconds());

      const title = "Starts in ";

      this.currentTimeLeft = milliseconds < soon && hours <= 24 ? `${title}${hours} hours` : `${title}${days.toString().replace("-", "")} days`;
      if (isMinutes) {
        this.currentTimeLeft = `${title}${diff} minutes`;
      }
    }
  }

  @computedFrom("launch.startsInMilliseconds", "launch.hasNotStarted")
  get proximity(): number {
    const soon = 86400000;
    const milliseconds = Number(String(this.launch.startsInMilliseconds).replace("-", ""));

    if (this.launch?.hasNotStarted) {
      if (milliseconds < soon) {
        return 2; // soon
      } else if (milliseconds > soon) {
        return 1; // comingUp
      }
    }
  }
}
