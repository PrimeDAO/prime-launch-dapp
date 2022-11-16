import axios from "axios";
import * as JSON from "../../fixtures/21-[lh]-real-test.json";
import { Shared } from "../../../src/shared/shared";
import { ISeedConfig } from "../../../src/newLaunch/seed/config";
import { IAddClassParams } from "../../../src/types/types";
import { SeedClassesBuilder } from "./builders/E2eSeedBuilder";

axios.defaults.adapter = require("axios/lib/adapters/http");

const baseUrl = "http://localhost:4000";
async function createSeed() {
  const address = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

  let seedConfig = JSON as unknown as ISeedConfig;
  seedConfig = adjustTimeForTesting(seedConfig);

  const params = Shared.convertToContractSeedParam(seedConfig, address, "");
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
  const tenSeconds = 10 * 1000;
  const startDateWithBuffer = highestStartDate + tenSeconds;
  startDateWithBuffer;
  const finalStartDate = new Date(startDateWithBuffer).toISOString();
  seedConfig.launchDetails.startDate = finalStartDate;
  seedConfig.launchDetails.startDate;

  // end date
  const oneDay = 24 * 60 * 60 * 1000;
  const finalEndDate = new Date(highestStartDate + oneDay).toISOString();
  seedConfig.launchDetails.endDate = finalEndDate;

  return seedConfig;
}


export class E2eApi {
  public static async createSeed() {
    const response = await createSeed();
    return response;
  }

  public static async addClassToSeed(
    seedId: string,
    seedClassParams?: IAddClassParams,
    ) {
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: api.e2e.ts ~ line 53 ~ addClassToSeed')
    if (!seedClassParams) {
      seedClassParams = SeedClassesBuilder.create().seedClass;
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: api.e2e.ts ~ line 53 ~ addClassToSeed')
    }
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: api.e2e.ts ~ line 53 ~ addClassToSeed')

    const response = await axios.post(`${baseUrl}/seed/${seedId}/addClass`, {
      seedId,
      addClassParams: seedClassParams,
    });
    /* prettier-ignore */ console.log('>>>> _ >>>> ~ file: api.e2e.ts ~ line 64 ~ response', response)
    return response.data;
  }
}

async function run() {
  const firstSeed = await createSeed();
  // setTimeout(async () => {
  //   firstSeed/*?*/
  //   const secondSeed = await createSeed();
  //    secondSeed/*?*/
  //   const classResponse = await E2eApi.addClassToSeed("0xCafac3dD18aC6c6e92c921884f9E4176737C052c");
  // }, 100)
}
run()
