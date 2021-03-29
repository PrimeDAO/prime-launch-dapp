import {
  autoinject,
  computedFrom,
  containerless,
} from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { NumberService } from "services/numberService";
import tippy from "tippy.js";

@autoinject
@containerless
export class FormattedNumber {

  /**
   * how many significant digits we want to display
   */
  //  @bindable public format?: string;
  @bindable public precision?: string | number;
  @bindable.booleanAttr public average = true;
  @bindable public mantissa?: string | number;
  @bindable public value: number | string;
  @bindable public placement = "top";
  @bindable public defaultText = "--";
  @bindable.booleanAttr public thousandsSeparated = false;


  private text: string;
  private textElement: HTMLElement;
  private _value: number | string;

  constructor(private numberService: NumberService) {
  }

  public valueChanged(): void {
    if ((this.value === undefined) || (this.value === null)) {
      this.text = this.defaultText;
      return;
    }

    this._value = this.value;

    let text = null;

    if ((this._value !== null) && (this._value !== undefined)) {
      text = this.numberService.toString(Number(this._value),
        {
          precision: this.precision ? this.precision : (this.average ? 3 : undefined),
          average: this.average,
          mantissa: this.mantissa !== undefined ? this.mantissa : undefined,
          thousandSeparated: this.thousandsSeparated,
        },
      );
    }

    this.text = text ?? this.defaultText;

    this.setTooltip();
  }

  public attached(): void {
    this.setTooltip();
  }

  // public detached(): void {
  //   tippy(this.textElement, "dispose");
  // }

  @computedFrom("_value")
  private get tooltip():string {
    return this._value?.toString(10);
  }

  private setTooltip() {
    if (this.textElement && this.value) {
      // tippy(this.textElement, "dispose");
      const instance = tippy(this.textElement, {
        appendTo: () => document.body, // because is "interactive" and otherwise messes with the layout on hover
        zIndex: 10005,
      });
      instance.setContent(this.value.toString());
    }
  }
}
