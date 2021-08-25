import { Address } from "services/EthereumService";
import { autoinject, bindingMode } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import "./TokenSelect.scss";

@autoinject
export class TokenSelect {
  @bindable tokenAddresses: Array<Address>;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenAddress?: Address;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenInfo: ITokenInfo;
  dropdown: HTMLElement;
  tokenInfos: Array<ITokenInfo>;

  constructor(
    private tokenService: TokenService,
  ) {}

  setSelectedTokenIndex(index: number): void {
    this.selectedTokenInfo = this.tokenInfos[index];
    this.selectedTokenAddress = this.selectedTokenInfo?.address;
  }

  getSelectedTokenIndex(): number {
    return this.tokenInfos?.indexOf(this.selectedTokenInfo) ?? null;
  }

  async attached(): Promise<void> {
    if (!this.tokenInfos) {
      this.tokenInfos = await this.getTokeninfos();
    }
    if (this.selectedTokenAddress) {
      this.selectedTokenInfo = this.tokenInfos.filter((info) => info.address === this.selectedTokenAddress)?.[0];
    }
  }

  getTokeninfos(): Promise<Array<ITokenInfo>> {
    return this.tokenService.getTokenInfoFromAddresses(this.tokenAddresses);
  }

  // getLabel(index: number): string {
  //   return this.tokenInfos[index].name;
  // }
}
