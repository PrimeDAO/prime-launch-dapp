import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "./congratulations.scss";
// import "@stackoverflow/stacks/dist/css/stacks.min.css";

@autoinject
export class Congratulations {

  private model: ICongratulationsModel;
  private okButton: HTMLElement;

  constructor(private controller: DialogController) { }

  public activate(model: ICongratulationsModel): void {
    this.model = model;
  }

  public attached(): void {
    // attach-focus doesn't work
    this.okButton.focus();
  }
}

interface ICongratulationsModel {
  message: string;
}
