import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import axios from "axios";
import { AxiosService } from "services/axiosService";
import { ConsoleLogService } from "services/ConsoleLogService";
const marked = require("marked");

@autoinject
export class Disclaimer {

  model: IDisclaimerModel;
  okButton: HTMLElement;
  disclaimer: string;
  loading = true;
  checked = false

  constructor(
    private controller: DialogController,
    private consoleLogService: ConsoleLogService,
    private axiosService: AxiosService ) { }

  public activate(model: IDisclaimerModel): void {
    this.model = model;
  }

  public async attached(): Promise<void> {
    let errorMsg: string;
    this.disclaimer = await axios.get(this.model.disclaimerUrl)
      .then((response) => {
        if (response.data) {
          this.loading = false;
          return response.data;
        } else {
          this.loading = false;
          this.consoleLogService.logMessage("Disclaimer: something went wrong", "error");
          return null;
        }
      })
      .catch((err) => {
        errorMsg = `Error fetching disclaimer: ${this.axiosService.axiosErrorHandler(err)}`;
        this.loading = false;
        return null;
      });

    if (!this.disclaimer) {
      this.controller.close(false, errorMsg);
    } else {
      // attach-focus doesn't work
      this.okButton.focus();
    }
  }

  get disclaimerHtml(): string {
    return this.disclaimer ? marked(this.disclaimer) : "";
  }
}

interface IDisclaimerModel {
  disclaimerUrl: string;
  title: string;
}
