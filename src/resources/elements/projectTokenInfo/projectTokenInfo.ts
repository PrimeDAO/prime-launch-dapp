import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./projectTokenInfo.scss";

export class ProjectTokenInfo {
  @bindable tokenInfo: LbpManager;

  private toUSD (value:number):string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);}
}

