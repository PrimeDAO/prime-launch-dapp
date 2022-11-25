import axios from "axios";
import { Shared } from "../../../src/shared/shared";
import { ISeedConfig } from "../../../src/newLaunch/seed/config";
import { IAddClassParams } from "../../../src/types/types";
import { SeedBuilder, SeedClassesBuilder } from "./builders/E2eSeedBuilder";
import {
  CLASS_1_WITH_ALLOWLISTED_ADDRESSES,
  CLASS_2_WITH_ALLOWLISTED_ADDRESSES,
  CLASS_3_WITH_ALLOWLISTED_ADDRESSES,
  MINIMUM_PERMISSIONED_SEED,
  MINIMUM_SEED,
  MINIMUM_PERMISSIONED_SEED_WITH_CLASS,
} from "../../fixtures/seedFixtures";
import { delay } from "./utilities";

axios.defaults.adapter = require("axios/lib/adapters/http");

const baseUrl = "http://localhost:4000";

async function createSeed(seedBuilder: SeedBuilder = MINIMUM_SEED) {
  const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  let seedConfig = seedBuilder.seed;
  seedConfig = adjustTimeForTesting(seedConfig);

  const params = Shared.convertToContractSeedParam(
    seedConfig,
    address,
    seedBuilder.id,
  );
  const response = await axios.post(`${baseUrl}/seed/create`, params);
  return response.data;
}

function adjustTimeForTesting(seedConfig: ISeedConfig) {
  const wantedStartDate = Date.parse(seedConfig.launchDetails.startDate);
  const currentDate = new Date();
  currentDate.setMilliseconds(0);
  const currentDateMilli = Date.parse(currentDate.toISOString());
  currentDate.toISOString();

  const highestStartDate = Math.max(wantedStartDate, currentDateMilli);
  const twentySeconds = 20 * 1000;
  const startDateWithBuffer = highestStartDate + twentySeconds;
  const finalStartDate = new Date(startDateWithBuffer).toISOString();
  seedConfig.launchDetails.startDate = finalStartDate;

  // end date
  const oneDay = 24 * 60 * 60 * 1000;
  const endDateWithBuffer = highestStartDate + oneDay;
  const finalEndDate = new Date(endDateWithBuffer).toISOString();
  seedConfig.launchDetails.endDate = finalEndDate;

  return seedConfig;
}

export class E2eApi {
  public static async createSeed(seedBuilder?: SeedBuilder) {
    const response = await createSeed(seedBuilder);
    return response;
  }

  public static async addClassToSeed(
    seedId: string,
    seedClassParams?: IAddClassParams,
  ) {
    if (!seedClassParams) {
      seedClassParams = SeedClassesBuilder.createNewClass();
    }

    const response = await axios.post(`${baseUrl}/seed/${seedId}/addClass`, {
      seedId,
      addClassParams: {
        ...seedClassParams,
        classAllowlists: seedClassParams.classAllowlists.map(list => Array.from(list))
      },
    });
    return response.data;
  }
}

async function run() {
  // const firstSeed = await createSeed(MINIMUM_SEED);
  // const firstSeed = await createSeed(MINIMUM_PERMISSIONED_SEED);
  const secondSeed = await createSeed(MINIMUM_PERMISSIONED_SEED_WITH_CLASS);
  await delay(500);
  const seedId = secondSeed.newSeed;
  await E2eApi.addClassToSeed(seedId, CLASS_1_WITH_ALLOWLISTED_ADDRESSES);
  await delay(500);
  await E2eApi.addClassToSeed(seedId, CLASS_2_WITH_ALLOWLISTED_ADDRESSES);
  await delay(500);
  await E2eApi.addClassToSeed(seedId, CLASS_3_WITH_ALLOWLISTED_ADDRESSES);
}
// run();
