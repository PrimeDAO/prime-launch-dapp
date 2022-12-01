import { inverseMapping } from "../../src/shared/shared-objects";

export const E2E_ADDRESSES = {
  ConnectedPublicUser: "0x0000000000000000000000000000000000000000",
  HardhatRoot: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  ProposalLead: "0xE834627cDE2dC8F55Fe4a26741D3e91527A8a498",
  CurveLabsMainLaunch: "0xB86fa0cfEEA21558DF988AD0ae22F92a8EF69AC1",
  Class1_User1: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  Class1_User2: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  Class2_User1: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  Class2_User2: "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  Class3_User1: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  User6: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
  User7: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
  User8: "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
  User9: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
  userNotAllowlisted: "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
};

E2E_ADDRESSES["Class1_NewlyAdded1"] = E2E_ADDRESSES.User6;

export const INVERSED_E2E_ADDRESSES_MAP = inverseMapping(E2E_ADDRESSES);


export const ALLOWLISTED_ADDRESSES = Object.values(E2E_ADDRESSES).filter(
  (address) => address !== E2E_ADDRESSES.userNotAllowlisted,
);

export const ALLOWLIST_CLASS_1 = [
  E2E_ADDRESSES.Class1_User1,
  E2E_ADDRESSES.Class1_User2,
];
export const ALLOWLIST_CLASS_2 = [
  E2E_ADDRESSES.Class2_User1,
  E2E_ADDRESSES.Class2_User2,
];
export const ALLOWLIST_CLASS_3 = [E2E_ADDRESSES.Class3_User1];

export const E2E_ADDRESSES_PRIVATE_KEYS = {
  [E2E_ADDRESSES.HardhatRoot]: process.env.ADDRESSES_HARDHAT_ROOT,
  [E2E_ADDRESSES.ProposalLead]: process.env.ADDRESSES_PROPOSAL_LEAD,
  [E2E_ADDRESSES.CurveLabsMainLaunch]:
    process.env.ADDRESSES_CURVE_LABS_MAIN_LAUNCH,
  [E2E_ADDRESSES.Class1_User1]: process.env.ADDRESSES_HARDHAT_USER_1,
  [E2E_ADDRESSES.Class1_User2]: process.env.ADDRESSES_HARDHAT_USER_2,
  [E2E_ADDRESSES.Class2_User1]: process.env.ADDRESSES_HARDHAT_USER_3,
  [E2E_ADDRESSES.Class2_User2]: process.env.ADDRESSES_HARDHAT_USER_4,
  [E2E_ADDRESSES.Class3_User1]: process.env.ADDRESSES_HARDHAT_USER_5,
  [E2E_ADDRESSES.User6]: process.env.ADDRESSES_HARDHAT_USER_6,
  [E2E_ADDRESSES.User7]: process.env.ADDRESSES_HARDHAT_USER_7,
  [E2E_ADDRESSES.User8]: process.env.ADDRESSES_HARDHAT_USER_8,
  [E2E_ADDRESSES.User9]: process.env.ADDRESSES_HARDHAT_USER_9,
  [E2E_ADDRESSES.userNotAllowlisted]:
    process.env.ADDRESSES_HARDHAT_USER_NOT_ALLOWLISTED,
};
