import { Address } from "services/EthereumService";
import { autoinject, bindingMode, computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import "./tokenSelect.scss";

@autoinject
export class TokenSelect {
  @bindable tokenAddresses: Array<Address>;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenAddress?: Address;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenInfo: ITokenInfo;
  @bindable itemChanged: ({ value: string, index: number }) => void;
  dropdown: HTMLElement;
  tokenInfos: Array<ITokenInfo>;

  constructor(
    private tokenService: TokenService,
  ) {}

  setSelectedToken(value: string, index: number): void {
    this.selectedTokenInfo = this.tokenInfos[index];
    this.selectedTokenAddress = this.selectedTokenInfo?.address;
    if (this.itemChanged) {
      this.itemChanged({value, index});
    }
  }

  @computedFrom("tokenInfos", "selectedTokenInfo")
  get selectedTokenIndex(): number {
    const index = this.tokenInfos?.indexOf(this.selectedTokenInfo);
    return (index > -1) ? index : undefined;
  }

  async attached(): Promise<void> {
    if (!this.tokenInfos) {
      await this.tokenAddressesChanged();
    }
  }

  async tokenAddressesChanged(): Promise<void> {
    if (this.tokenAddresses) {
      this.tokenInfos = await this.getTokeninfos();
      if (this.selectedTokenAddress) {
        this.selectedTokenInfo = this.tokenInfos.filter((info) => info.address === this.selectedTokenAddress)?.[0];
      }
    }
  }

  getTokeninfos(): Promise<Array<ITokenInfo>> {
    return this.tokenService.getTokenInfoFromAddresses(this.tokenAddresses);
  }

  // getLabel(index: number): string {
  //   return this.tokenInfos[index].name;
  // }
}
