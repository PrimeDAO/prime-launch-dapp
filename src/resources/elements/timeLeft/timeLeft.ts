import { bindable } from "aurelia-typed-observable-plugin";
import "./timeLeft.scss";

export class TimeLeft {

  @bindable.number startsInMilliseconds: number;
  @bindable.booleanAttr isActive: boolean;
  @bindable.booleanAttr hideIcons: boolean;
}
