import { bindable } from "aurelia-typed-observable-plugin";
import "./tokenPair.scss";

export class TokenPair {
  @bindable token1: string;
  @bindable token2: string;
}
