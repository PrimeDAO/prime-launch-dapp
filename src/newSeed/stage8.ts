import { Router } from "aurelia-router";
import { EventAggregator } from "aurelia-event-aggregator";
import { autoinject } from "aurelia-framework";
import { BaseStage } from "newSeed/baseStage";
import { IpfsService } from "services/IpfsService";

@autoinject
export class Stage8 extends BaseStage {
  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private ipfsService: IpfsService) {
    super(router, eventAggregator);
  }

}
