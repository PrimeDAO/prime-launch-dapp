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
      { route: ["", "document1"], nav: true, moduleId: PLATFORM.moduleName("./document1.html"), name: "document1", title: "Menu Item 1"},
      { route: ["document2"], nav: true, moduleId: PLATFORM.moduleName("./document2.html"), name: "document2", title: "Menu Item 2"},
      { route: ["document3"], nav: true, moduleId: PLATFORM.moduleName("./document3.html"), name: "document3", title: "Menu Item 3"},
    ];

    config.map(routes);

    this.router = router;
  }
}
