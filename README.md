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

## <a name="poolConfig"></a> Pool Configuration

Prime Pool refers to a list of pools that it will display to its users, looking at runtime for this list in the master branch of this repository at [/src/poolConfigurations/pools.json](https://github.com/PrimeDAO/prime-pool-dapp/blob/master/src/poolConfigurations/pools.json).

Notes on a few of the pool entries:

| Property      | Description |
| ----------- | ----------- |
| description   | Appears on the All Pools page. Plain text only. |
| story      | Appears on the "Overview" tab of the [*] Pool page.  You can use HTML, and divs may have the classes `para` and `header`. |
| icon      | Appears on the All Pools and [*] Pool page.  Must be SVG. Use single quotes, not double. |
| addresses | Address of the `ConfigurableRightsPool` |
| preview | If true, the pool will appear only as an unclickable button on the All Pools page |

## <a name="dependencies"></a> Dependencies

Various code dependencies include:

* ethplorer<span>.</span>io, at api.ethplorer.io, for token information
* coingecko, at api.coingecko.com/api/v3/coins,  for token information
* the Balancer subgraph, at api.thegraph.com/subgraphs/name/balancer-labs/balancer, for pool information
* the PrimeDAO API, at api.primedao.io/circulatingSupply, for the total supply of PRIME
* [d3](https://d3js.org/) for the pool donut graph
* [lightweight-charts](https://github.com/tradingview/lightweight-charts) for the pool marketcap sparkline graph
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

## Deploy

### <a name="env"></a> Environment Variables

Make sure you have in your environment (or in a .env file) the following:

```
IPFS_DEPLOY_PINATA__SECRET_API_KEY=
IPFS_DEPLOY_PINATA__API_KEY=
RIVET_ID=
INFURA_ID=
ETHPLORER_KEY=
ETHERSCAN_KEY=
```

### IPFS

To deploy the dApp to IPFS you must first create your build in the `dist` folder using one of the [build commands above](#build).

Then the fastest way to deploy the site on ipfs is using [Pinata](https://pinata.cloud/). Pinata will automatically deploy the code to IPFS, generating a hash of the code, and the "pin" the hash so that it remains in a cache and doesn't eventually fall out of easy sight of the cloud of IPFS nodes.

Make sure you added your Pinata `IPFS_DEPLOY_PINATA__API_KEY` and `IPFS_DEPLOY_PINATA__SECRET_API_KEY` in a .env file.

Install IPFS: [https://docs.ipfs.io/install/ipfs-desktop/](https://docs.ipfs.io/install/ipfs-desktop/)

Then run:

```
ipfs daemon
```

And in another shell:

```
npm run ipfs-deploy
```

Note that this command has shown you the hash that has been pinned in IPFS, and which you will need to associate with an ENS URI like `primepool.eth.link`.  You'll also find the hash in Pinata.

You can also use the Pinata website to upload the `dist` folder directly from your computer.

Or you can directly upload to ipfs using the following command, but note this won't pin the hash.  Note you still have to have `ipfs daemon` running.

```
ipfs add dist -r dist
```

### ENS

Having deployed and pinned the hash in IPFS, you can associate it with a URI like `primepool.eth.link` using [https://app.ens.domains/](https://app.ens.domains/).

You have to be a controller of the ENS domain.  On the domain's details page, add or edit the `content` record so it looks something like this:

<img src="./documentation/ensScreenshot.jpg"/>

### Verify

To verify that the code you are building is the same as what you see stored in IPFS, you can compute the hash of the code and compare it to the hash stored in IPFS.

To calculate the ipfs hash you will need the [environment variables](#env) that were used for the original build.

Next run `npm ci` to install fresh dependencies.

Then run `npm run build` to generate a clean build.

Now with the build at your disposal you can calculate the hash of the folder by running `ipfs add dist -r -n dist`.

(Install IPFS from here: [https://docs.ipfs.io/install/ipfs-desktop/](https://docs.ipfs.io/install/ipfs-desktop/))
