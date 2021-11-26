import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./statistics.scss";

export class Statistics {
  @bindable lbpManager: LbpManager;
}
