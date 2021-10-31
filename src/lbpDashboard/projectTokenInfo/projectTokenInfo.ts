import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./projectTokenInfo.scss";

export class ProjectTokenInfo {
  @bindable lbpMgr: LbpManager;
}

