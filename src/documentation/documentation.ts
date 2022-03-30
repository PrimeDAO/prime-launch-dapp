import { PLATFORM } from "aurelia-pal";
import { singleton, computedFrom } from "aurelia-framework";
import { Router, RouterConfiguration } from "aurelia-router";
import {activationStrategy } from "aurelia-router";
import axios from "axios";
const marked = require("marked");

import "./documentation.scss";

@singleton(false)
export class Documentation {
  router: Router;
  numDocs: number;

  @computedFrom("router.currentInstruction")
  get nextDocTitle(): string {
    const docNumber = this.router.currentInstruction.config.settings.docNumber;
    if (docNumber < this.numDocs) {
      return this.router.routes[docNumber + 1].title;
    } else {
      return "";
    }
  }

  @computedFrom("router.currentInstruction")
  get previousDocTitle(): string {
    const docNumber = this.router.currentInstruction.config.settings.docNumber;
    if (docNumber > 1) {
      return this.router.routes[docNumber - 1].title;
    } else {
      return "";
    }
  }

  async configureRouter(config: RouterConfiguration, router: Router): Promise<void> {

    config.title = "Documentation";

    let documentsSpec: Array<{ title: string, url: string }>;

    await axios.get(process.env.DOCUMENTS_LIST_CONFIG)
      .then((response) => {
        if (response.data && response.data.documents) {
          documentsSpec = response.data.documents;
        }
      });

    const markdowns = [];

    /**
     * preload the markdown or else the pages will load with visible flickering
     */
    for (const doc of documentsSpec) {
      await axios.get(doc.url)
        .then((response) => {
          if (response.data && response.data.length) {
            markdowns.push(marked(response.data));
          }
        });
    }

    /**
     * activationStrategy is docspec.filespecso baseDocument will be reactivated on each change
     * in route (see https://aurelia.io/docs/routing/configuration#reusing-an-existing-view-model)
     */
    const routes = documentsSpec.map((docspec: {title: string, url: string }, ndx: number) => {
      const route = {
        route: [docspec.title.replaceAll(" ", "")],
        nav: true,
        moduleId: PLATFORM.moduleName("./baseDocument"),
        title: docspec.title,
        activationStrategy: activationStrategy.replace,
        settings: {
          content: markdowns[ndx],
          docNumber: ndx+1,
        },
      };
      if (ndx === 0) {
        route.route.push("");
      }
      return route;
    });

    config.map(routes);

    this.numDocs = documentsSpec.length;

    this.router = router;
  }

  next(): void {
    const docNumber = this.router.currentInstruction.config.settings.docNumber;
    if (docNumber < this.numDocs) {
      // @ts-ignore
      this.router.navigate(this.router.routes[docNumber + 1].route);
    }
  }

  previous(): void {
    const docNumber = this.router.currentInstruction.config.settings.docNumber;
    if (docNumber > 1) {
      // @ts-ignore
      this.router.navigate(this.router.routes[docNumber - 1].route);
    }
  }
}
