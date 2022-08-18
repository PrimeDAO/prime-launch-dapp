import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "./homeInfo.scss";

@autoinject
export class HomeInfoModal {

  model: IDisclaimerModel;
  okButton: HTMLElement;

  constructor(
    private controller: DialogController,
  ) { }

  public activate(model: IDisclaimerModel): void {
    this.model = model;
  }
}

interface IDisclaimerModel {
  disclaimerUrl: string;
  title: string;
}
