import {
  SeedBuilder,
  SeedClassesBuilder,
} from "../integration/common/builders/E2eSeedBuilder";
import { getRandomId } from "../integration/common/utilities";
import {
  ALLOWLIST_CLASS_1,
  ALLOWLIST_CLASS_2,
  ALLOWLIST_CLASS_3,
  E2E_ADDRESSES,
} from "./walletFixtures";

export const MINIMUM_SEED = SeedBuilder.create("MINIMUM_SEED").withGeneral({
  projectName: "MINIMUM_SEED",
});

export const MINIMUM_PERMISSIONED_SEED = SeedBuilder.create(
  "MINIMUM_PERMISSIONED_SEED",
).withLaunchDetails({ isPermissoned: true });

/**
 * ************************
 * CLASSES
 * ************************
 */
export const MINIMUM_PERMISSIONED_SEED_WITH_CLASS = SeedBuilder.create(
  "MINIMUM_PERMISSIONED_SEED_WITH_CLASS",
  MINIMUM_PERMISSIONED_SEED.seed,
)
  .withGeneral({ projectName: "MINIMUM_PERMISSIONED_SEED_WITH_CLASS" })
  .withLaunchDetails({ allowList: [E2E_ADDRESSES.HardhatRoot] });

export const MINIMUM_SEED_CLASS = SeedClassesBuilder.create().seedClass;

export const CLASS_1_WITH_ALLOWLISTED_ADDRESSES = SeedClassesBuilder.create()
  .withClassName(`Class_1_${getRandomId()}`)
  .withAllowlists(ALLOWLIST_CLASS_1).seedClass;
export const CLASS_2_WITH_ALLOWLISTED_ADDRESSES = SeedClassesBuilder.create()
  .withClassName(`Class_2_${getRandomId()}`)
  .withAllowlists(ALLOWLIST_CLASS_2).seedClass;
export const CLASS_3_WITH_ALLOWLISTED_ADDRESSES = SeedClassesBuilder.create()
  .withClassName(`Class_3_${getRandomId()}`)
  .withAllowlists(ALLOWLIST_CLASS_3).seedClass;
