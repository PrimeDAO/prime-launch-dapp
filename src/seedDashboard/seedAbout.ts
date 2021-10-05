import { EthereumService } from "services/EthereumService";
import { containerless, computedFrom } from "aurelia-framework";
import { bindable } from "aurelia-typed-observable-plugin";
import { Seed } from "entities/Seed";

@containerless
export class SeedAbout{

  @bindable seed: Seed;
  @bindable type: string;

  constructor(private ethereumService: EthereumService) {}

  linkIcons = new Map<string, string>([
    ["twitter", "fab fa-twitter"],
    ["telegram", "fab fa-telegram-plane"],
    ["discord", "fab fa-discord"],
    ["youtube", "fab fa-youtube"],
    ["medium", "fab fa-medium-m"],
    ["github", "fab fa-github"],
    ["website", "fa fa-globe-americas"],
    ["misc", "fa fa-external-link-alt"],
    ["home", "fas fa-home"],
    ["pdf", "fas fa-file-pdf"],
  ]);

  formatLink(link: string): string {
    const pattern = /^(?:http(s)?:\/\/)/i;
    if (!pattern.test(link)) {
      return "//" + link;
    }
  }

  iconClassForLinkType(type: string): string {
    return this.linkIcons.get(type.toLowerCase()) ?? this.linkIcons.get("misc");
  }

  @computedFrom("seed.userHydrated", "ethereumService.defaultAccountAddress")
  get showAdminDashboardLink(): boolean {
    return this.seed?.userHydrated && (this.ethereumService.defaultAccountAddress === this.seed?.admin);
  }
}
