import { DialogController } from "aurelia-dialog";
import { autoinject } from "aurelia-framework";
import "../../../styles/styles.scss";
import axios from "axios";
import { ConsoleLogService } from "services/ConsoleLogService";

@autoinject
export class Disclaimer {

  model: IDisclaimerModel;
  okButton: HTMLElement;
  disclaimer: string;
  loading = true;
  error: string;

  constructor(
    private controller: DialogController,
    private consoleLogService: ConsoleLogService,
  ) { }

  public activate(model: IDisclaimerModel): void {
    this.model = model;
  }

  public async attached(): Promise<void> {
    this.disclaimer = await axios.get(this.model.dislaimerUrl)
      .then((response) => {
        if (response.data) {
          return response.data;
        } else {
          this.consoleLogService.logMessage("Disclaimer: something went wrong", "error");
          return null;
        }
      })
      .catch((error) => {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          this.error = `Error: ${error.response.data} status: ${error.response.status}`;
          this.consoleLogService.logMessage(error.response.data, "error");
          this.consoleLogService.logMessage(error.response.status, "error");
          this.consoleLogService.logMessage(error.response.headers, "error");
        } else if (error.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          this.error = error.request;
          this.consoleLogService.logMessage(error.request, "error");
        } else {
          // Something happened in setting up the request that triggered an Error
          this.error = error.message;
          this.consoleLogService.logMessage(error.message, "error");
        }
        return null;
      });

    this.loading = false;

    // attach-focus doesn't work
    this.okButton.focus();
  }
}

interface IDisclaimerModel {
  dislaimerUrl: string;
}
