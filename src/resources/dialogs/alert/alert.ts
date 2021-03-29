import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "../../../styles/styles.scss";

@autoinject
export class Alert {

  private model: IAlertModel;
  private okButton: HTMLElement;

  constructor(private controller: DialogController) { }

  public activate(model: IAlertModel): void {
    this.model = model;
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }
}

interface IAlertModel {
  message: string;
}
