import { BaseStage } from "newSeed/baseStage";

export class Stage6 extends BaseStage {
  close(): void {
    this.router.navigate("/");
  }
}
