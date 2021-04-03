/* eslint-disable linebreak-style */
import "./selectPackage.scss";

export class SelectPackage {
  // Declare state variables
  benefits: Array<string>;
  discounts: { [plan:string]:{discount: number, benefits: Array<string>}};
  constructor() {
    // TODO: Network call to get up to date values
    this.benefits=["support", "hosted"];
    this.discounts={
      "self-hosted": {
        discount: 0,
        benefits: ["support"],
      },
      "basic": {
        discount: 1,
        benefits: ["support"],
      },
      "prime": {
        discount: 2,
        benefits: ["support"],
      },
    };
  }
}
