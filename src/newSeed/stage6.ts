import { EventAggregator } from "aurelia-event-aggregator";
import { Router } from "aurelia-router";
import { autoinject } from "aurelia-framework";
import { computedFrom } from "aurelia-framework";
import { DateService } from "./../services/DateService";
import { BaseStage } from "newSeed/baseStage";
import { TimespanResolution } from "./../services/DateService";

@autoinject
export class Stage6 extends BaseStage {
  constructor(private dateService: DateService, router: Router, eventAggregator: EventAggregator) {
    super(router, eventAggregator);
  }

  @computedFrom("seedConfig.seedDetails.vestingDays")
  get vestingDays(): string {
    return this.dateService.ticksToTimeSpanString(this.seedConfig.seedDetails.vestingDays * 1000, TimespanResolution.minutes);
  }
  @computedFrom("seedConfig.seedDetails.vestingCliff")
  get vestingCliff(): string {
    return this.dateService.ticksToTimeSpanString(this.seedConfig.seedDetails.vestingCliff * 1000, TimespanResolution.minutes);
  }
}
