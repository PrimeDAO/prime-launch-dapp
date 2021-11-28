import { Address } from "services/EthereumService";
import { autoinject, bindingMode, computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { ITokenInfo } from "services/TokenTypes";
import { TokenService } from "services/TokenService";
import "./tokenSelect.scss";

@autoinject
export class TokenSelect {
  @bindable({ defaultBindingMode: bindingMode.toView }) tokenList: Array<ITokenInfo>;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenAddress?: Address;
  @bindable({ defaultBindingMode: bindingMode.twoWay }) selectedTokenInfo: ITokenInfo;
  @bindable({ defaultBindingMode: bindingMode.toView }) defaultTokenAddress?: Address;
  @bindable({ defaultBindingMode: bindingMode.toView }) itemChanged?: ({ newTokenInfo: ITokenInfo }) => void;
  @bindable.booleanAttr({ defaultBindingMode: bindingMode.toView }) symbolOnly = false;
  @bindable.string({ defaultBindingMode: bindingMode.toView }) placeholder = "Select a token...";

  dropdown: HTMLElement;

  constructor(
    private tokenService: TokenService,
  ) {}

  private handleSelectionChanged(_value: string, index: number): void {
    this.selectedTokenInfo = this.tokenList[index];
    this.selectedTokenAddress = this.selectedTokenInfo?.address;
    if (this.itemChanged) {
      // give bindings a chance to propagate first
      setTimeout(() => {
        this.itemChanged({ newTokenInfo: this.selectedTokenInfo });
      }, 0);
    }
  }

  @computedFrom("tokenList", "selectedTokenInfo")
  get selectedTokenIndex(): number {
    const index = this.tokenList?.indexOf(this.selectedTokenInfo);
    return (index > -1) ? index : undefined;
  }

  defaultTokenAddressChanged(): void {
    if (this.tokenList) {
      if (this.defaultTokenAddress && (this.defaultTokenAddress.toLowerCase() !== this.selectedTokenInfo?.address?.toLowerCase())) {
        this.selectedTokenInfo = this.tokenList.filter((info) => info.address.toLowerCase() === this.defaultTokenAddress.toLowerCase())?.[0];

        // give itemChanged binding a chance to fully hydrate
        setTimeout(() => {
          if (this.itemChanged) {
            this.itemChanged({ newTokenInfo: this.selectedTokenInfo });
          }
        }, 0);
      }
    }
  }

  tokenListChanged(): void {
    this.defaultTokenAddressChanged();
  }

  // getLabel(index: number): string {
  //   return this.tokenList[index].name;
  // }
}
