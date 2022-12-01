import { ONE_SECONDS_IN_MILLISECONDS } from "shared/shared";

export class SecondToMillisValueConverter {
  public toView(seconds: number): number {
    return seconds * ONE_SECONDS_IN_MILLISECONDS;
  }
}
