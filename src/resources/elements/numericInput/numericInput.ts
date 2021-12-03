import { ConsoleLogService } from "services/ConsoleLogService";
import {
  autoinject,
  bindingMode,
  computedFrom,
} from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { BigNumber } from "ethers";
import { fromWei, toWei } from "services/EthereumService";
import { NumberService } from "services/NumberService";
import { Utils } from "services/utils";

@autoinject
export class NumericInput {

  @bindable.booleanAttr public decimal = true;
  @bindable public css?: string;
  @bindable({ defaultBindingMode: bindingMode.oneTime }) public id?: string;
  /**
   * what to display when there is no value
   */
  @bindable.string public defaultText = "";
  /**
   * handle should return falsey to accept the key.  Only fired on key strokes that have
   * already passed the default character filter.
   */
  @bindable public handleChange: ({ keyCode: number }) => boolean;
  @bindable public autocomplete = "off";
  @bindable.booleanAttr public disabled;
  /**
   * Assumed to be in Wei and will be converted to ETH for the user and back to Wei for parent component.
   * Else value us set to  whatever string the user types.
   * If nothing is entered, then value is set to `defaultText`.
   */
  @bindable({ defaultBindingMode: bindingMode.twoWay }) public value: number | BigNumber | string;
  /**
   * if true then value is converted from wei to eth for editing
   */
  @bindable.booleanAttr public notWei?: boolean = false;
  /**
   * if isWei, then the number of decimals involved in the conversion
   */
  @bindable.number public decimals?: number = 18;
  @bindable.booleanAttr public outputAsString?: boolean = false;
  @bindable.string public placeholder = "";

  private element: HTMLInputElement;

  private _innerValue: string;

  private ignoreValueChanged = false;

  @computedFrom("_innerValue")
  private get innerValue() {
    return this._innerValue;
  }

  private set innerValue(newValue: string) {
    this._innerValue = newValue;
    /**
     * update value from input control
     */
    if ((newValue === null) || (typeof newValue === "undefined") ||
        ((typeof newValue === "string") && newValue.trim() === "")) {
      this.value = undefined;
    } else {
      // assuming here that the input element will always give us a string
      try {
        if (newValue !== ".") {
          console.log("newValue: ", newValue);

          let value: BigNumber | number | string = this.notWei ? Number(newValue) : toWei(newValue, this.decimals);
          if (this.outputAsString) {
            value = value.toString();
          }
          this.ignoreValueChanged = true;
          this.value = value;
        }
      } catch (ex) {
        this.consoleLogService.logMessage(`nummericInput exception: ${Utils.extractExceptionMessage(ex)}`);
        this.ignoreValueChanged = true;
        this.value = undefined;
      }
    }
  }

  constructor(
    private numberService: NumberService,
    private consoleLogService: ConsoleLogService) {
  }

  private decimalsChanged() {
    this.valueChanged(this.value, null);
  }

  private valueChanged(newValue: string | BigNumber | number, oldValue: string | BigNumber | number ) {

    if (this.ignoreValueChanged) {
      this.ignoreValueChanged = false;
      return;
    }

    if ((newValue === undefined) || (newValue === null)) {
      this._innerValue = this.defaultText || undefined;
    } else if (newValue.toString() !== oldValue?.toString()) {
      try {
        let newStringValue: string;
        if (this.notWei) {
          newStringValue = newValue.toString();
        } else {
          newStringValue = fromWei(newValue.toString(), this.decimals);
        }
        /**
         * don't let the new string reformat the user's input
         */
        if (this.numberService.fromString(this._innerValue) !== this.numberService.fromString(newStringValue)) {
          this._innerValue = newStringValue;
        }
      } catch {
        this._innerValue = undefined;
      }
    }
  }

  public attached(): void {
    this.element.addEventListener("keydown", (e) => { this.keydown(e); });
    // this.hydrateFromDefaultValue();
  }

  public detached(): void {
    if (this.element) {
      this.element.removeEventListener("keydown", (e) => { this.keydown(e); });
    }
  }

  // http://stackoverflow.com/a/995193/725866
  private isNavigationOrSelectionKey(e): boolean {
    // Allow: backspace, delete, tab, escape, enter and .
    const currentValue = this.element.value as string;
    let returnValue = false;
    if (Utils.allowableNumericInput(e)) {
      // let it happen, don't do anything
      returnValue = true;
    } else {
      /**
       * decimals are allowed, is a decimal, and there is not already a decimal
       */
      if ((this.decimal && (e.key === ".") &&
        (!currentValue || !currentValue.length || (currentValue.indexOf(".") === -1)))) {
        returnValue =true;
      }
    }
    return returnValue;
  }

  // http://stackoverflow.com/a/995193/725866
  private keydown(e) {
    if (!this.isNavigationOrSelectionKey(e)) {
      // If it's not a number, prevent the keypress...
      if (isNaN(Number(e.key))) {
        e.preventDefault();
      }
    }
    if (this.handleChange) {
      if (this.handleChange({ keyCode: e.keyCode })) {
        e.preventDefault();
      }
    }
  }
}
