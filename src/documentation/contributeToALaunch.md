To contribute to a launch and receive tokens, follow the steps outlined below.

## Setup

1. Have a compatible wallet set up. Prime Launch connects to most Ethereum wallets, including Metamask and all wallets compatible with WalletConnect. If you don't have an Ethereum wallet yet, set up a <a href="https://metamask.io/" target="_blank" rel="noopener noreferrer">Metamask account</a> or use a WalletConnect-enabled mobile wallet like <a href="https://rainbow.me/" target="_blank" rel="noopener noreferrer">Rainbow</a> or <a href="https://www.argent.xyz/" target="_blank" rel="noopener noreferrer">Argent</a>.
2. Next up, you will need to fund your wallet with some of the tokens you want to contribute to the Launch (funding tokens) and some ETH for paying transaction costs (~$25 worth of ETH is safe). Most wallets will give you instructions on how to acquire those tokens and ETH.
4. On the <a href="/launches">Launches page</a>, you can view the upcoming launches and see which funding tokens the project is accepting in its launch.

## Contributing to a Seed Launch

To contribute to a Seed Launch, you must hold some of the launch's funding token.

In the "Contribute" box, exchange the funding token for rights to claim a fixed amount of the project token when the launch ends. Contributors can reclaim the tokens they contributed anytime before the launch ends (but will lose rights to claim project tokens if they do).

Seed Launches end when the maximum funding is reached or the contribution time window is over (whether or not the funding target is reached). If the launch ends and the funding target has not been reached, no project tokens will be distributed and contributors can reclaim their funding tokens. 

If the funding target or the maximum funding is reached, contributors can claim project tokens in the "Claim" box after the launch ends. Note, however, that many Seed Launches will have vesting periods with cliffs and/or vesting time:
- Cliff: a period of time before any tokens can be claimed
- Vest: a period of time following the cliff during which tokens will be unlocked linearly

For example, take a Seed Launch with a 3 day cliff and a 10 day vest. A contributor who has contributed enough to claim 10 tokens will have to wait 3 days for the cliff, after which their 10 tokens will unlock gradually over the next 10 days.

## Contributing to a Liquid Launch

To contribute to a Liquid Launch, you must have any token with liquidity on the Balancer Protocol, for example, ETH, DAI, USDC, or D2D.

In the "Contribute" box on the right of the screen, connect with your wallet and accept the Prime Launch Policy. Afterward, select the token and amount you would want to exchange for the project token and click the approve button in the Contribute box to start the transaction to approve these tokens to be spent inside Prime Launch. Once confirmed, you can now click on Contribute, which will begin the transaction to swap your tokens for the project's tokens.

## How a Liquid Launch LBP functions

Liquidity Bootstrapping Pools (LBPs) are adjustable Balancer pools used to bootstrap initial liquidity for a token and the initial price discovery of new assets. LBPs are liquidity pools that change weights over time. As the weights change, they create selling pressure on the project token, leading to the price of a project token dropping if there is no buying pressure.


The pool weights initially favor D2D (96%) and will gradually move to an equilibrium where D2D is 50% of the pool. The linear step-down creates constant downward pressure on the price, balancing the upward buy pressure, ideally keeping the price oscillating around perceived market value. This relatively stable price discourages arbitrage bot manipulation as they can't count on the steadily decreasing price.

In practice, this means that contributors should avoid participating too early in Liquid Launches because the valuation will be high, and no price discovery has taken place. The closer to the end of the Liquid Launch, the project token has experienced more price discovery, creating a more stable environment for new contributors. 

To understand more about LBs, please check [this detailed Medium](https://medium.com/balancer-protocol/building-liquidity-into-token-distribution-a49d4286e0d4) article or visit the Launch support channel in [Prime’s Discord](https://discord.com/invite/primedao).
