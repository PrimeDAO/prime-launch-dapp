import { BaseStage } from "newSeed/baseStage";

export class Stage4 extends BaseStage {
  readFile(event:any): void {
    if (event.target.files[0]) {
      this.seedConfig.seedDetails.whitelist.whitelistFile = event.target.files[0];
    }
  }
}
