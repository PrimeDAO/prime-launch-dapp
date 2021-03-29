export class Utils {
  public static sleep(milliseconds: number): Promise<any> {
    return new Promise((resolve: (args: any[]) => void): any => setTimeout(resolve, milliseconds));
  }

  public static smallHexString(str: string): string {
    if (!str) {
      return "";
    }
    const len = str.length;
    return `${str.slice(0, 6)}...${str.slice(len - 4, len)}`;
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  // public static getObjectKeys(obj: any): Array<string> {
  //   const temp = [];
  //   for (const prop in obj) {
  //     if (obj.hasOwnProperty(prop)) {
  //       temp.push(prop);
  //     }
  //   }
  //   return temp;
  // }

  /**
   * run a timer after a count of milliseconds greater than the 32-bit max that chrome can handle
   * @param date
   * @param func
   */
  // public static runTimerAtDate(date: Date, func: () => void): void {
  //   const now = (new Date()).getTime();
  //   const then = date.getTime();
  //   const diff = Math.max((then - now), 0);
  //   if (diff > 0x7FFFFFFF) { // setTimeout limit is MAX_INT32=(2^31-1)
  //     setTimeout(() => { Utils.runTimerAtDate(date, func); }, 0x7FFFFFFF);
  //   } else {
  //     setTimeout(func, diff);
  //   }
  // }

  public static goto(where: string): void {
    window.open(where, "_blank", "noopener noreferrer");
  }

  public static toBoolean(value?: string | boolean): boolean {
    if (!value) {
      return false;
    }

    if (typeof(value) === "string") {
      switch (value.toLocaleLowerCase()) {
        case "true":
        case "1":
        case "on":
        case "yes":
          return true;
        default:
          return false;
      }
    } else {
      return value;
    }
  }
}
