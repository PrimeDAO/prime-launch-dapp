import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "./addClass.scss";
// import "@stackoverflow/stacks/dist/css/stacks.min.css";

@autoinject
export class AddClassModal {

  private model: IAddClassModal;
  private okButton: HTMLElement;

  constructor(private controller: DialogController) { }

  public activate(model: IAddClassModal): void {
    this.model = model;
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }
}

interface IAddClassModal {
  message: string;
}
