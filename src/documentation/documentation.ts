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
        title: "Seed Launch",
        settings: {
          content: require("/src/documentation/seedLaunch.md").default,
        },
      },
      {
        route: ["liquid-launch"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document3"),
        name: "document3",
        title: "Liquid Launch",
        settings: {
          content: require("/src/documentation/liquidLaunch.md").default,
        },
      },
      {
        route: ["contribute-to-a-launch"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document4"),
        name: "document4",
        title: "Contribute to a Launch",
        settings: {
          content: require("/src/documentation/contributeToALaunch.md").default,
        }
      },
      {
        route: ["host-a-launch"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document5"),
        name: "document5",
        title: "Host a Launch",
        settings: {
          content: require("/src/documentation/hostALaunch.md").default,
        }
      },
      {
        route: ["prime-support"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document6"),
        name: "document6",
        title: "Prime Support and Services",
        settings: {
          content: require("/src/documentation/primeSupportAndServices.md").default,
        }
      },
      {
        route: ["FAQ"],
        nav: true,
        moduleId: PLATFORM.moduleName("./document7"),
        name: "document7",
        title: "FAQ",
        settings: {
          content: require("/src/documentation/FAQ.md").default
        }
      },

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
