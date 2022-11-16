import { LbpManager } from "./../../../entities/LbpManager";
import { DateService } from "./../../../services/DateService";
import { PLATFORM } from "aurelia-pal";
import { computedFrom, autoinject } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./timeLeft.scss";
import { Seed } from "entities/Seed";

// for webpack
PLATFORM.moduleName("./timeLeftSeed.html");
PLATFORM.moduleName("./timeLeftLbp.html");

@autoinject
export class TimeLeft {

  @bindable launch: Seed | LbpManager;
  @bindable.booleanAttr hideIcons: boolean;
  @bindable.booleanAttr largest: boolean;
  @bindable.booleanAttr contained: boolean;
  @bindable.booleanAttr isTimeOnly: boolean;

  timeLeft: HTMLElement;
  tippyInstance: any;

  currentTimeLeft: string;

  constructor(
    private dateService: DateService,
  ) {}

  private attached(): void {
    let time;
    if (this.launch?.hasNotStarted) {
      time = this.launch.startsInMilliseconds;
    } else {
      time = this.launch.endsInMilliseconds;
    }
    this.currentTimeLeft = time;
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

  @computedFrom("launch.isPaused", "launch.isClosed")
  get isAdminStatus(): boolean {
    // @ts-ignore - isClosed not on LBP
    const isAdmin = this.launch?.isPaused || this.launch?.isClosed;
    return isAdmin;
  }
}
