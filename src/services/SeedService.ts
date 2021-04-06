import { Address } from "services/EthereumService";

export interface ISeed {
  address: Address;
  description: string;
  /**
   * SVG icon for the pool
   */
  icon: string;
  name: string;
  /**
   * the pool doesn't actually exist yet, but we want to present a preview in the UI
   */
  preview: boolean;
  story: string;
}

export class SeedService {

}
