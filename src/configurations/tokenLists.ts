export interface ITokenListConfigMap {
  PrimeDao: {
    Payments: string;
  }
  // Balancer: {
  //   Default: string;
  //   Vetted: string;
  // };
  // External: string[];
}

export interface ITokenListMapByNetwork {
  [networkKey: string]: ITokenListConfigMap;
}

/**
 * Mapping of the TokenLists used on each network
 */
export const TOKEN_LIST_MAP: ITokenListMapByNetwork = {
  "mainnet": {
    PrimeDao: {
      Payments:
        "https://raw.githubusercontent.com/PrimeDAO/tokenlists/main/primePayment.json",
    },
    // Balancer: {
    //   Default:
    //     "https://storageapi.fleek.co/balancer-team-bucket/assets/listed.tokenlist.json",
    //   Vetted:
    //     "https://storageapi.fleek.co/balancer-team-bucket/assets/vetted.tokenlist.json",
    // },
    // External: [
    //   "ipns://tokens-uniswap-org",
    //   "tokenlist.zerion.eth",
    //   "tokens.1inch.eth",
    //   "tokenlist.aave.eth",
    //   // 'https://tokens.coingecko.com/uniswap/all.json', Breaks balance/allowance fetching
    //   "https://umaproject.org/uma.tokenlist.json",
    // ],
  },
  "rinkeby": {
    PrimeDao: {
      Payments:
        "",
    },
    // Balancer: {
    //   Default:
    //     "https://storageapi.fleek.co/balancer-team-bucket/assets/listed.tokenlist.json",
    //   Vetted:
    //     "https://storageapi.fleek.co/balancer-team-bucket/assets/vetted.tokenlist.json",
    // },
    // External: [
    //   "ipns://tokens-uniswap-org",
    //   // 'https://tokens.coingecko.com/uniswap/all.json',
    //   "https://umaproject.org/uma.tokenlist.json",
    // ],
  },
};
