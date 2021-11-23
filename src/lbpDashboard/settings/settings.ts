import { bindable } from "aurelia-framework";
import { LbpManager } from "entities/LbpManager";
import "./settings.scss";

export class Settings {
  @bindable lbpManager: LbpManager;
}
