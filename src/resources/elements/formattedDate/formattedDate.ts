import {
  autoinject,
  bindable,
  containerless,
} from "aurelia-framework";
import tippy from "tippy.js";

@autoinject
@containerless
export class FormattedDate {
  @bindable tooltip: string;

  private dateElement: HTMLElement;

  public attached(): void {
    this.setTooltip();
  }

  private setTooltip() {
    tippy(this.dateElement, {
      appendTo: () => document.body, // because is "interactive" and otherwise messes with the layout on hover
      zIndex: 10005,
    });
  }
}
