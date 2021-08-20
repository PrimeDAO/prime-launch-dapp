import { SeedService } from "services/SeedService";
import "./selectPackage.scss";

export class SelectPackage {
  private seedFee: number;

  constructor() {
    this.seedFee = SeedService.seedFee * 100;
  }
}
