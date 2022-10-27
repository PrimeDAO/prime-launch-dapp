import { BigNumber } from "ethers";
import { fromWei, toWei } from "services/EthereumService";


describe("EthereumService", () => {
  fit("fromWei", () => {
    const result = fromWei(BigNumber.from("1000000000000000000"), 18);/*?*/
    expect(result).toBe("1.0");
  });
  fit("toWei", () => {
    const result = toWei(BigNumber.from("1"), 18);/*?*/
    expect(result.toString()).toBe("1000000000000000000");
  });
});
