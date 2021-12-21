import { DateService, TimespanResolution } from "services/DateService";


type TimeArray = [
  days: number,
  hours: number,
  minutes: number,
  seconds: number
];
type TestData = [
  resolution: TimespanResolution,
  timeArray: TimeArray,
  expected: string
];

describe("DateService", () => {
  let dateService: DateService;
  beforeAll(() => {
    dateService = new DateService();
  });

  describe("#ticksToTimeSpanString", () => {
    /* prettier-ignore */
    const testData: TestData[] = [
      [TimespanResolution.largest, [1, 1, 1, 1], "1 day, 1 hour"],
      [TimespanResolution.largest, [1, 1, 1, 0], "1 day, 1 hour"],
      [TimespanResolution.largest, [1, 1, 0, 1], "1 day, 1 hour"],
      [TimespanResolution.largest, [1, 1, 0, 0], "1 day, 1 hour"],
      [TimespanResolution.largest, [1, 0, 1, 1], "1 day, 1 minute"],
      [TimespanResolution.largest, [1, 0, 1, 0], "1 day, 1 minute"],
      [TimespanResolution.largest, [1, 0, 0, 1], "1 day, 1 second"],
      [TimespanResolution.largest, [1, 0, 0, 0], "1 day, 0 seconds"],
      [TimespanResolution.largest, [0, 1, 1, 1], "1 hour, 1 minute"],
      [TimespanResolution.largest, [0, 1, 1, 0], "1 hour, 1 minute"],
      [TimespanResolution.largest, [0, 1, 0, 1], "1 hour, 1 second"],
      [TimespanResolution.largest, [0, 1, 0, 0], "1 hour, 0 seconds"],
      [TimespanResolution.largest, [0, 0, 1, 1], "1 minute, 1 second"],
      [TimespanResolution.largest, [0, 0, 1, 0], "1 minute, 0 seconds"],
      [TimespanResolution.largest, [0, 0, 0, 1], "1 second"],
      [TimespanResolution.largest, [0, 0, 0, 0], "0 seconds"],

      [TimespanResolution.days, [1, 1, 1, 1], "1 day"],
      [TimespanResolution.days, [1, 1, 1, 0], "1 day"],
      [TimespanResolution.days, [1, 1, 0, 1], "1 day"],
      [TimespanResolution.days, [1, 1, 0, 0], "1 day"],
      [TimespanResolution.days, [1, 0, 1, 1], "1 day"],
      [TimespanResolution.days, [1, 0, 1, 0], "1 day"],
      [TimespanResolution.days, [1, 0, 0, 1], "1 day"],
      [TimespanResolution.days, [1, 0, 0, 0], "1 day"],
      [TimespanResolution.days, [0, 1, 1, 1], ""],
      [TimespanResolution.days, [0, 1, 1, 0], ""],
      [TimespanResolution.days, [0, 1, 0, 1], ""],
      [TimespanResolution.days, [0, 1, 0, 0], ""],
      [TimespanResolution.days, [0, 0, 1, 1], ""],
      [TimespanResolution.days, [0, 0, 1, 0], ""],
      [TimespanResolution.days, [0, 0, 0, 1], ""],
      [TimespanResolution.days, [0, 0, 0, 0], ""],

      [TimespanResolution.hours, [1, 1, 1, 1], "1 day, 1 hour"],
      [TimespanResolution.hours, [1, 1, 1, 0], "1 day, 1 hour"],
      [TimespanResolution.hours, [1, 1, 0, 1], "1 day, 1 hour"],
      [TimespanResolution.hours, [1, 1, 0, 0], "1 day, 1 hour"],
      [TimespanResolution.hours, [1, 0, 1, 1], "1 day, 0 hours"],
      [TimespanResolution.hours, [1, 0, 1, 0], "1 day, 0 hours"],
      [TimespanResolution.hours, [1, 0, 0, 1], "1 day, 0 hours"],
      [TimespanResolution.hours, [1, 0, 0, 0], "1 day, 0 hours"],
      [TimespanResolution.hours, [0, 1, 1, 1], "1 hour"],
      [TimespanResolution.hours, [0, 1, 1, 0], "1 hour"],
      [TimespanResolution.hours, [0, 1, 0, 1], "1 hour"],
      [TimespanResolution.hours, [0, 1, 0, 0], "1 hour"],
      [TimespanResolution.hours, [0, 0, 1, 1], "0 hours"],
      [TimespanResolution.hours, [0, 0, 1, 0], "0 hours"],
      [TimespanResolution.hours, [0, 0, 0, 1], "0 hours"],
      [TimespanResolution.hours, [0, 0, 0, 0], "0 hours"],

      [TimespanResolution.minutes, [1, 1, 1, 1], "1 day, 1 hour, 1 minute"],
      [TimespanResolution.minutes, [1, 1, 1, 0], "1 day, 1 hour, 1 minute"],
      [TimespanResolution.minutes, [1, 1, 0, 1], "1 day, 1 hour, 0 minutes"],
      [TimespanResolution.minutes, [1, 1, 0, 0], "1 day, 1 hour, 0 minutes"],
      [TimespanResolution.minutes, [1, 0, 1, 1], "1 day, 0 hours, 1 minute"],
      [TimespanResolution.minutes, [1, 0, 1, 0], "1 day, 0 hours, 1 minute"],
      [TimespanResolution.minutes, [1, 0, 0, 1], "1 day, 0 hours, 0 minutes"],
      [TimespanResolution.minutes, [1, 0, 0, 0], "1 day, 0 hours, 0 minutes"],
      [TimespanResolution.minutes, [0, 1, 1, 1], "1 hour, 1 minute"],
      [TimespanResolution.minutes, [0, 1, 1, 0], "1 hour, 1 minute"],
      [TimespanResolution.minutes, [0, 1, 0, 1], "1 hour, 0 minutes"],
      [TimespanResolution.minutes, [0, 1, 0, 0], "1 hour, 0 minutes"],
      [TimespanResolution.minutes, [0, 0, 1, 1], "1 minute"],
      [TimespanResolution.minutes, [0, 0, 1, 0], "1 minute"],
      [TimespanResolution.minutes, [0, 0, 0, 1], "0 minutes"],
      [TimespanResolution.minutes, [0, 0, 0, 0], "0 minutes"],

      [TimespanResolution.seconds, [1, 1, 1, 1], "1 day, 1 hour, 1 minute, 1 second"],
      [TimespanResolution.seconds, [1, 1, 1, 0], "1 day, 1 hour, 1 minute, 0 seconds"],
      [TimespanResolution.seconds, [1, 1, 0, 1], "1 day, 1 hour, 0 minutes, 1 second"],
      [TimespanResolution.seconds, [1, 1, 0, 0], "1 day, 1 hour, 0 minutes, 0 seconds"],
      [TimespanResolution.seconds, [1, 0, 1, 1], "1 day, 0 hours, 1 minute, 1 second"],
      [TimespanResolution.seconds, [1, 0, 1, 0], "1 day, 0 hours, 1 minute, 0 seconds"],
      [TimespanResolution.seconds, [1, 0, 0, 1], "1 day, 0 hours, 0 minutes, 1 second"],
      [TimespanResolution.seconds, [1, 0, 0, 0], "1 day, 0 hours, 0 minutes, 0 seconds"],
      [TimespanResolution.seconds, [0, 1, 1, 1], "1 hour, 1 minute, 1 second"],
      [TimespanResolution.seconds, [0, 1, 1, 0], "1 hour, 1 minute, 0 seconds"],
      [TimespanResolution.seconds, [0, 1, 0, 1], "1 hour, 0 minutes, 1 second"],
      [TimespanResolution.seconds, [0, 1, 0, 0], "1 hour, 0 minutes, 0 seconds"],
      [TimespanResolution.seconds, [0, 0, 1, 1], "1 minute, 1 second"],
      [TimespanResolution.seconds, [0, 0, 1, 0], "1 minute, 0 seconds"],
      [TimespanResolution.seconds, [0, 0, 0, 1], "1 second"],
      [TimespanResolution.seconds, [0, 0, 0, 0], "0 seconds"],
    ];

    testData.forEach(([resolution, timeArray, expected]) => {
      it(`${timeArray} (${TimespanResolution[resolution]})`, () => {
        const asMs = DateTestHelper.toMs(timeArray);
        const result = dateService.ticksToTimeSpanString(asMs, resolution);
        expect(result).toBe(expected);
      });
    });
  });
});

class DateTestHelper {
  static toMs(input: TimeArray) {
    const [days, hours, minutes, seconds] = input;
    const daysMs = Math.floor(days * 86400000);
    const hoursMs = Math.floor(hours * 3600000);
    const minutesMs = Math.floor(minutes * 60000);
    const secondsMs = Math.floor(seconds * 1000);

    const sumMs = daysMs + hoursMs + minutesMs + secondsMs;
    return sumMs;
  }
}
