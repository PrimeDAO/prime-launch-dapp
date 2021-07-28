import { singleton } from "aurelia-framework";
import { RouteConfig } from "aurelia-router";

@singleton(false)
export abstract class BaseDocument {
  content: string;
  title: string;
  activate(_params: unknown, routeConfig: RouteConfig): void {
    this.title = routeConfig.title;
    this.content = routeConfig.settings.content;
  }
}
