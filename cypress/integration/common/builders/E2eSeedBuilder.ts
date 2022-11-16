import { formatBytes32String } from "ethers/lib/utils";

import { e2eClassName } from "../e2eConstants";
import {
  toWei,
  DEFAULT_DECIMALS,
  ONE_DAY_IN_SECONDS,
} from "../../../../src/shared/shared";
import { IAddClassParams } from "../../../../src/types/types";

const defaultSeedClass = {
  classNames: e2eClassName,
  classCaps: toWei(1, DEFAULT_DECIMALS),
  individualCaps: toWei(1, DEFAULT_DECIMALS),
  vestingDurations: 1 * ONE_DAY_IN_SECONDS,
  vestingCliffs: 0 * ONE_DAY_IN_SECONDS,
  allowList: undefined,
};

export class SeedClassesBuilder {
  public seedClass: IAddClassParams = {
    classNames: [defaultSeedClass.classNames].map((className) =>
      formatBytes32String(className),
    ),
    classCaps: [defaultSeedClass.classCaps],
    individualCaps: [defaultSeedClass.individualCaps],
    classVestingDurations: [defaultSeedClass.vestingDurations],
    classVestingCliffs: [defaultSeedClass.vestingCliffs],
    classAllowlists: [defaultSeedClass.allowList],
  };

  public static create() {
    return new SeedClassesBuilder();
  }
}
