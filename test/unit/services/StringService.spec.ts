import { splitByWordSeparators } from "services/StringService";

describe("splitByWordSeparators", () => {
  it("comma", () => {
    const input = "0x5E5594D7065D8E2CB274acea7CB191c467eA589e,0xe0b609917c7387bd674b6F2a874097c4136502F9,0x2Dfe8259e14B591D63a02Ad810CD502C29d56292,0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1";
    const result = splitByWordSeparators(input);
    expect(result).toStrictEqual([
      "0x5E5594D7065D8E2CB274acea7CB191c467eA589e",
      "0xe0b609917c7387bd674b6F2a874097c4136502F9",
      "0x2Dfe8259e14B591D63a02Ad810CD502C29d56292",
      "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1",
    ]);
  });

  it("\n", () => {
    const input = "0x5E5594D7065D8E2CB274acea7CB191c467eA589e\n0xe0b609917c7387bd674b6F2a874097c4136502F9\n0x2Dfe8259e14B591D63a02Ad810CD502C29d56292\n0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1";
    const result = splitByWordSeparators(input);
    expect(result).toStrictEqual([
      "0x5E5594D7065D8E2CB274acea7CB191c467eA589e",
      "0xe0b609917c7387bd674b6F2a874097c4136502F9",
      "0x2Dfe8259e14B591D63a02Ad810CD502C29d56292",
      "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1",
    ]);
  });

  it("\r\n", () => {
    const input = "0x5E5594D7065D8E2CB274acea7CB191c467eA589e\r\n0xe0b609917c7387bd674b6F2a874097c4136502F9\r\n0x2Dfe8259e14B591D63a02Ad810CD502C29d56292\r\n0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1";
    const result = splitByWordSeparators(input);
    expect(result).toStrictEqual([
      "0x5E5594D7065D8E2CB274acea7CB191c467eA589e",
      "0xe0b609917c7387bd674b6F2a874097c4136502F9",
      "0x2Dfe8259e14B591D63a02Ad810CD502C29d56292",
      "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1",
    ]);
  });
});
