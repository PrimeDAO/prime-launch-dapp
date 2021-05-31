import { computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { Seed } from "entities/Seed";
import "./timeLeft.scss";

export class TimeLeft {

  @bindable seed: Seed;
  @bindable.booleanAttr hideIcons: boolean;
  @bindable.booleanAttr largest: boolean;

  @computedFrom("seed.startsInMilliseconds", "seed.hasNotStarted")
  get proximity(): number {
    const soon = 86400000;
    const comingUp = soon * 5;
    if (this.seed?.hasNotStarted) {
      if (this.seed.startsInMilliseconds > comingUp) {
        return 3; // faroff
      } else if (this.seed.startsInMilliseconds <= soon) {
        return 1; // soon
      } else {
        return 2; // comingUp
      }
    }
  }
}
