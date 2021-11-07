import { Address } from "services/EthereumService";
import { autoinject, bindingMode, computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import "./tokenSelect.scss";

@autoinject
export class TokenSelect {
  @bindable({ defaultBindingMode: bindingMode.toView }) tokenAddresses: Array<Address>;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenAddress?: Address;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenInfo: ITokenInfo;
  @bindable({ defaultBindingMode: bindingMode.toView }) defaultTokenAddress?: Address;
  @bindable({ defaultBindingMode: bindingMode.toView }) itemChanged?: ({ newTokenInfo: ITokenInfo }) => void;
  @bindable.booleanAttr({ defaultBindingMode: bindingMode.toView }) symbolOnly = false;
  @bindable.string({ defaultBindingMode: bindingMode.toView }) placeholder = "Select a token...";

  dropdown: HTMLElement;
  tokenInfos: Array<ITokenInfo>;

  constructor(
    private tokenService: TokenService,
  ) {}

  private handleSelectionChanged(_value: string, index: number): void {
    this.selectedTokenInfo = this.tokenInfos[index];
    this.selectedTokenAddress = this.selectedTokenInfo?.address;
    if (this.itemChanged) {
      // give bindings a chance to propagate first
      setTimeout(() => {
        this.itemChanged({ newTokenInfo: this.selectedTokenInfo });
      }, 0);
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
      if (this.defaultTokenAddress) {
        this.selectedTokenAddress = this.defaultTokenAddress;
        this.selectedTokenInfo = this.tokenInfos.filter((info) => info.address === this.defaultTokenAddress)?.[0];
        if (this.itemChanged) {
          // give bindings a chance to propagate first
          setTimeout(() => {
            this.itemChanged({ newTokenInfo: this.selectedTokenInfo });
          }, 0);
        }
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
