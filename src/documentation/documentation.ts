import "./documentation.scss";
import { PLATFORM } from "aurelia-pal";
import { singleton } from "aurelia-framework";
import { Router, RouterConfiguration } from "aurelia-router";

@singleton(false)
export class Documentation {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = "Documentation";

    const routes = [
      { route: ["", "document1"], nav: true, moduleId: PLATFORM.moduleName("./document1.html"), name: "document1", title: "Overview"},
      { route: ["document2"], nav: true, moduleId: PLATFORM.moduleName("./document2.html"), name: "document2", title: "Seed Details & Benefits"},
      { route: ["document3"], nav: true, moduleId: PLATFORM.moduleName("./document3.html"), name: "document3", title: "Liquid Launch Details and Benefits" },
      { route: ["document4"], nav: true, moduleId: PLATFORM.moduleName("./document4.html"), name: "document4", title: "Contribute to a Launch" },
      { route: ["document5"], nav: true, moduleId: PLATFORM.moduleName("./document5.html"), name: "document5", title: "Apply to Host a Launch" },
      { route: ["document6"], nav: true, moduleId: PLATFORM.moduleName("./document6.html"), name: "document6", title: "Prime support and services" },
      { route: ["document7"], nav: true, moduleId: PLATFORM.moduleName("./document7.html"), name: "document7", title: "FAQ" },
      { route: ["document8"], nav: true, moduleId: PLATFORM.moduleName("./document8.html"), name: "document8", title: "Host your own LBP"},
    ];

    config.map(routes);

    this.router = router;
  }
}
