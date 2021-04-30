import { BaseStage } from "newSeed/baseStage";

export class Stage3 extends BaseStage {
  addTokenDistribution(index:number): void {
    if (index === -1) {
      // Skip check
      // Create a new custom link object
      this.seedConfig.tokenDetails.tokenDistrib.push({category: undefined, amount: undefined, lockup: undefined});
    } else {
      // Create a new custom link object
      this.seedConfig.tokenDetails.tokenDistrib.push({category: undefined, amount: undefined, lockup: undefined});
    }
  }
}
