import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./swapFees.scss";

export class SwapFees {
  @bindable lbpManager: LbpManager;
}
