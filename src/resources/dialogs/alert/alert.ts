import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";

@autoinject
export class Alert {

  private model: IAlertModel;
  private okButton: HTMLElement;

  constructor(private controller: DialogController) { }

  public activate(model: IAlertModel): void {
    this.model = model;
    require("./alert.scss");
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }
}

interface IAlertModel {
  message: string;
}
