// @ts-check
import {
  MINIMUM_PERMISSIONED_SEED_WITH_CLASS,
  CLASS_1_WITH_ALLOWLISTED_ADDRESSES,
  CLASS_2_WITH_ALLOWLISTED_ADDRESSES,
} from "../fixtures/seedFixtures";
import { createSeed, E2eApi } from "../integration/common/api.e2e";
import { delay } from "../integration/common/utilities";

async function run() {
  const firstSeed = await createSeed();
  // const firstSeed = await createSeed(MINIMUM_PERMISSIONED_SEED);
  const secondSeed = await createSeed(MINIMUM_PERMISSIONED_SEED_WITH_CLASS);
  await delay(500);
  const seedId = secondSeed.newSeed;
  await E2eApi.addClassToSeed(seedId, CLASS_1_WITH_ALLOWLISTED_ADDRESSES);
  await delay(500);
  await E2eApi.addClassToSeed(seedId, CLASS_2_WITH_ALLOWLISTED_ADDRESSES);
  // await delay(500);
  // await E2eApi.addClassToSeed(seedId, CLASS_3_WITH_ALLOWLISTED_ADDRESSES);
}
run();
