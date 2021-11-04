import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./timeRemaining.scss";

export class TimeRemaining {
  @bindable lbpMgr: LbpManager;
}
