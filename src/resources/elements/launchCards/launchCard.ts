import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Seed } from "entities/Seed";
import { LbpManager } from "entities/LbpManager";
import "./launchCard.scss";

@autoinject
export class LaunchCard {
  launch: Seed | LbpManager;
  container: HTMLElement;

  constructor(
    private router: Router,
  ) {}

  activate(model: Seed | LbpManager): void {
    this.launch = model;
  }
}
