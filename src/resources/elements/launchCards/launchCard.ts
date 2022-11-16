import { autoinject } from "aurelia-framework";
import { Seed } from "entities/Seed";
import { LbpManager } from "entities/LbpManager";
import "./launchCard.scss";

@autoinject
export class LaunchCard {
  launch: Seed | LbpManager;
  container: HTMLElement;
}
