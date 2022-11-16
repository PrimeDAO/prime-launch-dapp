/* eslint-disable no-bitwise */
import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "./alert.scss";

export enum ShowButtonsEnum {
  OK = 0x1,
  Cancel = 0x2,
}

@autoinject
export class Alert {

  private model: IAlertModel;
  private buttons: ShowButtonsEnum;
  private okButton: HTMLElement;
  private cancelButton: HTMLElement;
  showCancelButton: boolean;
  showOkButton: boolean;
  private buttonTextPrimary: string;
  private buttonTextSecondary: string;

  constructor(private controller: DialogController) { }


  public activate(model: IAlertModel): void {
    this.model = model;
    this.buttons = model.buttons ?? ShowButtonsEnum.OK;
    this.showCancelButton = !!(this.buttons & ShowButtonsEnum.Cancel);
    this.showOkButton = !!(this.buttons & ShowButtonsEnum.OK);
    this.buttonTextPrimary = model.buttonTextPrimary ?? "OK";
    this.buttonTextSecondary = model.buttonTextSecondary ?? "CANCEL";
  }

  public attached(): void {
    // attach-focus doesn't work
    if (this.buttons & ShowButtonsEnum.OK) {
      this.okButton.focus();
    }
  }
}

export interface IAlertModel {
  message: string;
  className?: string;
  buttons?: ShowButtonsEnum;
  buttonTextPrimary?: string;
  buttonTextSecondary?: string;
}
