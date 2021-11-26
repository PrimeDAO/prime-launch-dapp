import { bindable } from "aurelia-framework";
import { LbpManager } from "../../entities/LbpManager";
import "./lbpDetails.scss";

export class LbpDetails {
  @bindable lbpManager: LbpManager;
}
