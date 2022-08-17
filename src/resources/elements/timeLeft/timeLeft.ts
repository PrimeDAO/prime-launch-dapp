import { LbpManager } from "./../../../entities/LbpManager";
import { DateService } from "./../../../services/DateService";
import { PLATFORM } from "aurelia-pal";
import { computedFrom, autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./timeLeft.scss";
import tippy from "tippy.js";
import { Seed } from "entities/Seed";
import dayjs from "dayjs";

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
    diff = diff - (diffHours*60);
    const diffMins = diff;

    if (now.diff(startDate) < 0) {
      this.currentTimeLeft = "didn't start";
    } else {
      this.currentTimeLeft = `${diffDays}d${diffDays > 1 ? "s" : ""}, ${diffHours}h, ${diffMins}m`;
    }
  }

  @computedFrom("launch.startsInMilliseconds", "launch.hasNotStarted")
  get proximity(): number {
    const soon = 86400000;
    const comingUp = soon * 5;
    if (this.launch?.hasNotStarted) {
      if (!this.tippyInstance) {
        this.tippyInstance = tippy(this.timeLeft,
          {
            content: this.dateService.toString(this.launch.startTime, "ddd MMM do - kk:mm z"),
          });
      }
      if (this.launch.startsInMilliseconds > comingUp) {
        return 3; // faroff
      } else if (this.launch.startsInMilliseconds <= soon) {
        return 1; // soon
      } else {
        return 2; // comingUp
      }
    }
  }
}
