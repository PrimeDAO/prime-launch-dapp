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
      {
        route: ["", "overview"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document1"),
        name: "document1",
        title: "Overview",
        settings: {
          content: require("/src/documentation/overview.md").default,
        },
      },
      {
        route: ["seed-launch"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document2"),
        name: "document2",
        title: "Seed Details & Benefits",
        settings: {
          content: require("/src/documentation/seedLaunch.md").default,
        },
      },
      {
        route: ["liquid-launch-lbp"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document3"),
        name: "document3",
        title: "Liquid Launch Details and Benefits",
        settings: {
          content: require("/src/documentation/liquidLaunch.md").default,
        },
      },
      // {
      //   route: ["document4"],
      //   nav: true,
      //   moduleId: PLATFORM.moduleName("./document4.html"),
      //   name: "document4",
      //   title: "Contribute to a Launch",
      // },
      // {
      //   route: ["document5"],
      //   nav: true,
      //   moduleId: PLATFORM.moduleName("./document5.html"),
      //   name: "document5",
      //   title: "Apply to Host a Launch",
      // },
      // {
      //   route: ["document6"],
      //   nav: true,
      //   moduleId: PLATFORM.moduleName("./document6.html"),
      //   name: "document6",
      //   title: "Prime support and services",
      // },
      // {
      //   route: ["document7"],
      //   nav: true,
      //   moduleId: PLATFORM.moduleName("./document7.html"),
      //   name: "document7",
      //   title: "FAQ",
      // },

      // {
      //   route: ["document8"],
      //   nav: true,
      //   moduleId: PLATFORM.moduleName("./document8.html"),
      //   name: "document8",
      //   title: "Host your own LBP",
      // },
    ];

    config.map(routes);

    this.router = router;
  }
}
