import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import axios from "axios";
import { ConsoleLogService } from "services/ConsoleLogService";
import "../dialogs.scss";
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
  ) { }

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
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMsg = `Error fetching disclaimer: HTTP status ${err.response.status} at ${this.model.disclaimerUrl}`;
          this.consoleLogService.logMessage(err.response.data, "error");
          this.consoleLogService.logMessage(err.response.status, "error");
          this.consoleLogService.logMessage(err.response.headers, "error");
        } else if (err.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          errorMsg = `Error fetching disclaimer: ${err.message} at ${this.model.disclaimerUrl}`;
          this.consoleLogService.logMessage(err.message, "error");
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMsg = `Error fetching disclaimer: ${err.message} at ${this.model.disclaimerUrl}`;
          this.consoleLogService.logMessage(err.message, "error");
        }
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
