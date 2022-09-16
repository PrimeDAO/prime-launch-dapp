import { ISeedConfig } from "newLaunch/seed/config";
import { autoinject } from "aurelia-framework";
import { BaseStage } from "newLaunch/baseStage";
import { DateService, TimespanResolution } from "./../../../services/DateService";

@autoinject
export class Stage6 extends BaseStage<ISeedConfig> {
  dateService = new DateService();
  private formattedCliffOf: string;
  private formattedVestedFor: string;

  attached(){
    this.formattedCliffOf = this.launchConfig.launchDetails.vestingCliff && this.dateService.ticksToTimeSpanString(this.launchConfig.launchDetails.vestingCliff * 1000, TimespanResolution.largest);
    this.formattedVestedFor = this.launchConfig.launchDetails.vestingPeriod && this.dateService.ticksToTimeSpanString(this.launchConfig.launchDetails.vestingPeriod * 1000, TimespanResolution.largest);
  }

  toggle(): void {
    return;
  }
}
