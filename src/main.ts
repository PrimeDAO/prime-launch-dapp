import { PinataIpfsClient } from "./services/PinataIpfsClient";
import { Aurelia } from "aurelia-framework";
import * as environment from "../config/environment.json";
import { PLATFORM } from "aurelia-pal";
import { AllowedNetworks, EthereumService, Networks } from "services/EthereumService";
import { EventConfigException } from "services/GeneralEvents";
import { ConsoleLogService } from "services/ConsoleLogService";
import { ContractsService } from "services/ContractsService";
import { EventAggregator } from "aurelia-event-aggregator";
import { SeedService } from "services/SeedService";
import { IpfsService } from "services/IpfsService";

export function configure(aurelia: Aurelia): void {
  aurelia.use
    .standardConfiguration()
    .feature(PLATFORM.moduleName("resources/index"))
    .plugin(PLATFORM.moduleName("aurelia-animator-css"))
    .plugin(PLATFORM.moduleName("aurelia-dialog"), (configuration) => {
      // custom configuration
      configuration.settings.keyboard = false;
    })
    // .globalResources([
    //   // PLATFORM.moduleName("dashboard/dashboard"),
    // ])
  ;

  if (process.env.NODE_ENV === "development") {
    aurelia.use.developmentLogging();
  }

  if (environment.testing) {
    aurelia.use.plugin(PLATFORM.moduleName("aurelia-testing"));
  }

  aurelia.start().then(async () => {
    aurelia.container.get(ConsoleLogService);
    try {
      const ethereumService = aurelia.container.get(EthereumService);
      ethereumService.initialize(
        process.env.NETWORK as AllowedNetworks ??
          (process.env.NODE_ENV === "development" ? Networks.Kovan : Networks.Mainnet));

      aurelia.container.get(ContractsService);

      const seedService = aurelia.container.get(SeedService);

      seedService.initialize();

      const ipfsService = aurelia.container.get(IpfsService);
      ipfsService.ipfs = aurelia.container.get(PinataIpfsClient);

    } catch (ex) {
      const eventAggregator = aurelia.container.get(EventAggregator);
      eventAggregator.publish("handleException", new EventConfigException("Sorry, couldn't connect to ethereum", ex));
      alert(`Sorry, couldn't connect to ethereum: ${ex.message}`);
    }
    aurelia.setRoot(PLATFORM.moduleName("app"));
  });
}
