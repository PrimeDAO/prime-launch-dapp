# The PrimeDAO’s Home for IDOs

This is the [PrimeDAO](primedao.eth.link) web interface enabling the creation of and interaction with IDOs.

## Technical Description

This project is bootstrapped by [aurelia-cli](https://github.com/aurelia/cli).

It is written mostly in Typescript, HTML and SCSS, and is bundled using Webpack.

For more information about bundling, go to https://aurelia.io/docs/cli/webpack

## Install
Install dependencies with the following command:
```
npm ci
```

## <a name="build"></a> Build
There are several ways to build and run the application.  Each of the following build commands will output to the `dist` folder. After building, run following to launch the result in the browser:

```
npm run start
```

### Build with optimized code against mainnet
`npm run build`

(This is the production build.)

### Build with optimized code against kovan

`npm run build-kovan`

### Build unoptimized code against kovan

`npm run build-dev`

### Build unoptimized code against mainnet

`npm run build-dev-mainnet`

## Debug

Each of the following commands will serve up a site that will support Hot Module Reload (HMR).  You can then use your favorate debugger to launch the app at http://localhost:3330.

### Build and serve, running against kovan
`npm run serve-dev`

### Build and serve, running against mainnet
`npm run serve-dev-mainnet`

## Update Required Contracts Information

Prime Pool relies on solidity contract addresses and ABIs that it obtains from the [contracts package](https://github.com/PrimeDAO/contracts). In the case that any of these contracts change, you may clone the contracts package in a folder sibling to this one, and run a script to pull the required information from the contracts package into this one, by running the following:

```
npm run fetchContracts
```

## Featured Seeds List

Prime Launch refers to a list of Seeds that it will display as "Featured" to its users, looking at runtime for this list in the master branch of this repository at [/src/configurations/featuredSeeds.json](https://github.com/PrimeDAO/prime-launch-dapp/blob/master/src/configurations/featuredSeeds.json).

## <Pool name="dependencies"></Pool> Dependencies

Various code dependencies include:

* ethplorer<span>.</span>io, at api.ethplorer.io, for token information
* coingecko, at api.coingecko.com/api/v3/coins,  for token information
* the Balancer subgraph, at api.thegraph.com/subgraphs/name/balancer-labs/balancer, for pool information
* [Web3Modal](https://github.com/Web3Modal/web3modal) for selecting wallet providers
* [ethers.js](https://docs.ethers.io/v5/) for interacting with ethereum and wallet providers
* [Rivet](https://rivet.cloud/) for the mainnet provider

## Lint

Run `npm run lint` and confirm that lint succeeds before git commits.

You can run `npm run lint.fix` to have lint automatically fix all  fixable errors.

## Automated Tests

Run `npm run test`.

To run in watch mode, `npm run test --watch`.

## Webpack Analyzer

To run the Webpack Bundle Analyzer, do `npm run analyze` (production build).

## Run Locally or Host Centrally

### <a name="env"></a> Environment Variables

Make sure you have in your environment (or in a ".env" file) the following:

```
DEPLOY_PINATA__SECRET_API_KEY=
DEPLOY_PINATA__API_KEY=
RIVET_ID=
INFURA_ID=
ETHPLORER_KEY=
ETHERSCAN_KEY=
PINATA_API_KEY=
PINATA_SECRET_API_KEY=
PINATA_API_KEY_TEST=
PINATA_SECRET_API_KEY_TEST=
IPSTACK_API_KEY=
```

When building for production, the build will look for variables in ".env.production".

