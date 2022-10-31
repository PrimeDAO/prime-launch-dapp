import { autoinject, bindingMode, customElement } from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";
import { bindable } from "aurelia-typed-observable-plugin";
import { filterOutTestLaunches } from "launches/launches";

// for webpack
PLATFORM.moduleName("../launchCards/seedCard.html");
PLATFORM.moduleName("../launchCards/lbpCard.html");

@customElement("featuredlaunches")
@autoinject
export class FeaturedLaunches {
  @bindable.booleanAttr({ defaultBindingMode: bindingMode.fromView }) loading;
  @bindable({ defaultBindingMode: bindingMode.toView }) launchType;
  @bindable({ defaultBindingMode: bindingMode.toView}) launchesData;
}
