A Liquid Launch is a public token offering that works by attempting to bootstrap the liquidity of a new token. Liquid Launches use Balancer V2's Liquidity Bootstrapping Pools (LBPs) to facilitate fair and efficient environments for distributing tokens. The mechanism has been utilized dozens of times with <a href="https://medium.com/perpetual-protocol/everything-you-need-to-know-about-the-first-liquidity-bootstrapping-pool-lbp-60a61b368c82" target="_blank" rel="noopener noreferrer">promising results.</a>

In the back end, a Liquid Launch is an adjustable Balancer V2 pool designed for initial distribution and price discovery of a new asset. The pool will generally start with a high weight of project tokens (e.g. 95%) and a small weight of funding tokens (e.g. 5% DAI). During the Liquid Launch, often 2 to 3 days, the pool weights are continuously rebalanced toward the funding token, which leads the project token's price to slowly decline. Contributors can participate at their preferred price point, while bots and arbitrageurs do not benefit from frontrunning (as buying early generally leads to overpaying).

The result is a fair and accessible token launch shown to effectively discover the market price of an asset and raise funds for the project team, without requiring prohibitive initial capital or enabling problematic frontrunning.

## Liquid Launch Benefits

- **Decentralized** — Prime Launch uses decentralized infrastructure and is run by a DAO
- **Capital-efficient** — LBPs help distribute more tokens at efficient price points with less initial capital
- **Fair** — LBPs' constant downward price pressure disincentivizes front-running and large buys from whales, giving better opportunities to your intended contributors
- **Multi-use** — configure your liquid launch to segue directly into another use-case (e.g to serve as a 50/50 AMM after the initial sale)
- **Multi-asset** — smart order routing means that users can trade any token in exchange for the project token at the price of higher slippage (using Balancer on the back end)

For a complete breakdown of how Liquid Launches work on the back end, please read Balancer's <a href="https://medium.com/balancer-protocol/a-primer-on-fair-token-launches-and-liquidity-bootstrapping-pools-11bab5ff33a2" target="_blank" rel="noopener noreferrer">primer</a> or visit the <a href="https://docs.balancer.fi/" target="_blank" rel="noopener noreferrer">Balancer V2 Documentation</a>.

To host a Liquid Launch, see <a href="/documentation/host-a-launch">Apply to host a Launch</a> or head straight to the <a href="/register">application page</a>. To contribute to a launch, see <a href="/documentation/contribute-to-a-launch">Contribute to a Launch</a> or view all upcoming launches <a href="/launches">here</a>.
