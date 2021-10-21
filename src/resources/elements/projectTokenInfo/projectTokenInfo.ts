import { bindable } from "aurelia-framework";
import { Address } from "services/EthereumService";
import "./projectTokenInfo.scss";

interface IProjectTokenInfo {
  address: Address;
  decimals: number;
  logoURI: string;
  name: string;
  symbol: string
}
export class ProjectTokenInfo {
  @bindable tokenInfo: IProjectTokenInfo;

  private toUSD (value:number):string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);}
}

