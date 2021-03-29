import { autoinject } from "aurelia-framework";
import { DateService, TimespanResolution } from "../../services/DateService";

@autoinject
export class TimespanValueConverter {
  constructor(private dateService: DateService) {

  }
  /**
   * convert between milliseconds in the viewmodel and a string.
   */
  public toView(value: number, resolution?: TimespanResolution): string | null {
    if (typeof resolution === "string") {
      resolution = TimespanResolution[resolution as string];
    }
    return this.dateService.ticksToTimeSpanString(value, resolution);
  }
}
