import { autoinject } from "aurelia-framework";
import { BaseStage } from "newSeed/baseStage";
import { Router } from "aurelia-router";
import { SeedService } from "services/SeedService";
import { EventAggregator } from "aurelia-event-aggregator";
import { EventConfigException } from "services/GeneralEvents";

@autoinject
export class Stage6 extends BaseStage {
  constructor(
    router: Router,
    eventAggregator: EventAggregator,
    private seedService: SeedService) {
    super(router, eventAggregator);
  }

  async submit(): Promise<void> {
    try {
      this.eventAggregator.publish("seed.creating", true);
      // eslint-disable-next-line quotes
      // this.seedService.deploySeed(JSON.parse('{"general":{"customLinks":[{"media":"twitter","url":"https://twitter.com"},{"media":"discord","url":"https://discord.com"}],"projectName":"Doug Test","projectWebsite":"http://www.douglaskent.com","category":"No particular category","whitepaper":"https://medium.com/balancer-protocol/bonding-surfaces-balancer-protocol-ff6d3d05d577","github":"https://github.com/PrimeDAO/prime-launch-dapp"},"projectDetails":{"summary":"Summary: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed facilisis justo ex, at fringilla nulla tempor et. Sed ut blandit diam. Vivamus .","proposition":"Propositon: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed facilisis justo ex, at fringilla nulla tempor et. Sed ut blandit diam. Vivam.","category":"Category: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed facilisis justo ex, at fringilla nulla tempor et. Sed ut blandit diam. Vivam."},"tokenDetails":{"tokenDistrib":[{"category":"DAO","amount":"12345000000000000000000","lockup":"10"}],"fundingAddress":"0x6b175474e89094c44da98b954eedeac495271d0f","seedAddress":"0xE59064a8185Ed1Fca1D17999621eFedfab4425c9","maxSupply":"1000000000000000000000000","initSupply":"100000000000000000000000"},"contactDetails":{"remarks":"Remarks: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed in urna arcu. Vestibulum sagittis lorem at posuere imperdiet. Morbi dignissim maximus porttitor. Orci varius natoque penatibus et magnis dis parturient montes, nascetur nisi.","contactEmail":"toot@tank.com","logo":"https://uploads-ssl.webflow.com/5edb98724bc6a593d21794f1/5eecd0883ec7b3409a3542b7_CL%20logo%20black-p-500.png"},"seedDetails":{"baseCurrency":"DAI","whitelist":{"isWhitelist":false},"geoBlock":true,"legalDisclaimer":true,"seedTokens":"500000000000000000000","pricePerToken":"100000000000000000000","seedTarget":"100000000000000000000","seedMax":"500000000000000000000","vestingDays":"30000000000000000000","vestingCliff":"10000000000000000000","startDate":"2021-05-18T16:00:00.000Z","endDate":"2021-05-25T16:00:00.000Z"}}'));
      this.stageStates[this.stageNumber+1].seedHash = await this.seedService.deploySeed(this.seedConfig);
      // this.eventAggregator.publish("handleInfo", `Successfully pinned seed registration hash at: https://gateway.pinata.cloud/ipfs/${this.seedHash}`);
      this.next();
    } catch (ex) {
      this.eventAggregator.publish("handleException", new EventConfigException("Sorry, an error occurred", ex));
    }
    finally {
      this.eventAggregator.publish("seed.creating", false);
    }
  }
}
