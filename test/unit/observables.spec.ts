/* eslint-disable no-console */
import { from, Observable, Subject } from "rxjs";
import { concatMap, map } from "rxjs/operators";
/* tslint:disable:no-console */
describe("Observables", () => {

  it("can create an observable", () => {
    const observable = Observable.create();
    expect(observable).not.toBeNull();
  });

  it("can map an observable", () => {
    const observable = from([2]).pipe(map((_o) => 1));
    expect(observable).not.toBeFalsy();
  });

  it("can subscribe to an observable", () => {
    const observable = from([2]);
    expect(observable).not.toBeFalsy();
    observable.subscribe(
      {
        complete: () => {
          console.log("Observer got a complete notification");
        },
        error: (err) => {
          console.log("Observer got an error: " + err);
          expect(true).toBeFalsy();
        },
        next: (x) => {
          console.log("Observer got a value: " + x);
          expect(x).toBe(2);
        },
      });
  });

  it("can subscribe to an dynamic array of objects", () => {
    const subject = new Subject();
    expect(subject).not.toBeFalsy();

    subject.subscribe(
      {
        complete: () => {
          console.log("Observer got a complete notification");
        },
        error: (err) => {
          console.log("Observer got an error: " + err);
          expect(true).toBeFalsy();
        },
        next: (x: { name: string }) => {
          console.log("Observer got a value: " + x.name);
          expect(x.name).toBe("Gabrielle");
        },
      });

    subject.next({ name: "Gabrielle" });

  });

  it("can create a synchronous queue of promises", async () => {

    const input = new Subject();
    expect(input).not.toBeFalsy();
    const throttledInput = input.pipe(concatMap((x) => {
      return from(new Promise(function(resolve, _reject) {
        setTimeout(() => {
          console.log("resolving to: " + x);
          resolve(x);
        }, 1000);
      }));
    }));

    expect(throttledInput).not.toBeFalsy();

    let count = 1;

    throttledInput.subscribe(
      {
        complete: () => {
          console.log("throttledInput sent a complete notification");
        },
        error: (err) => {
          console.log("throttledInput generated an error: " + err);
          expect(true).toBeFalsy();
        },
        next: (x) => {
          console.log(`throttledInput emitted: ${x} at ${new Date().getSeconds()} seconds after the minute`);
          expect(x).toBe(count++);
        },
      });

    input.next(1);
    input.next(2);
    input.next(3);

    await new Promise((resolve) => setTimeout(resolve, 4000));

  });
});
