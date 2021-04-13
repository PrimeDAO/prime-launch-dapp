import { computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import "./timeLeft.scss";

export class TimeLeft {

  @bindable.number startsInMilliseconds: number;
  @bindable.booleanAttr isActive: boolean;
  @bindable.booleanAttr hideIcons: boolean;

  @computedFrom("startsInMilliseconds")
  get proximity(): number {
    const soon = 86400000;
    const comingUp = soon * 5;
    if (this.startsInMilliseconds > comingUp) {
      return 3; // future
    } else if (this.startsInMilliseconds <= soon) {
      return 1; // soon
    } else {
      return 2; // comingUp
    }
  }
}
