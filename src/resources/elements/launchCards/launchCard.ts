import { autoinject } from "aurelia-framework";
import { Router } from "aurelia-router";
import { Seed } from "entities/Seed";
import { Lbp } from "entities/Lbp";
import "./launchCard.scss";

@autoinject
export class LaunchCard {
  launch: Seed | Lbp;
  container: HTMLElement;

  constructor(
    private router: Router,
  ) {}

  activate(model: Seed | Lbp): void {
    this.launch = model;
  }
}
