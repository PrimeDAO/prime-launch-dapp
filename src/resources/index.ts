import { FrameworkConfiguration } from "aurelia-framework";
import { PLATFORM } from "aurelia-pal";

export function configure(config: FrameworkConfiguration): void {
  config.globalResources([
    PLATFORM.moduleName("./elements/banner/banner"),
    PLATFORM.moduleName("./elements/EtherscanLink/EtherscanLink"),
    PLATFORM.moduleName("./elements/EthBalance/EthBalance"),
    PLATFORM.moduleName("./elements/TokenBalance/TokenBalance"),
    PLATFORM.moduleName("./elements/UsersAddress/UsersAddress"),
    PLATFORM.moduleName("./elements/copyToClipboardButton/copyToClipboardButton"),
    PLATFORM.moduleName("./elements/numericInput/numericInput"),
    PLATFORM.moduleName("./elements/formattedNumber/formattedNumber"),
    PLATFORM.moduleName("./elements/ConnectButton/ConnectButton"),
    PLATFORM.moduleName("./elements/NetworkFeedback/NetworkFeedback"),
    PLATFORM.moduleName("./elements/modalscreen/modalscreen"),
    PLATFORM.moduleName("./elements/loading-dots/loading-dots"),
    PLATFORM.moduleName("./elements/sparkChart/spark-chart"),
    PLATFORM.moduleName("./elements/metamask-token-button/metamask-token-button"),
    PLATFORM.moduleName("./elements/donutChart/donut-chart"),
    PLATFORM.moduleName("./elements/inline-svg"),
    PLATFORM.moduleName("../pool/liquidity-buttons/liquidity-buttons"),
    PLATFORM.moduleName("../pools/weth-eth-exchange/weth-eth-exchange"),
    PLATFORM.moduleName("./value-converters/number"),
    PLATFORM.moduleName("./value-converters/ethwei"),
    PLATFORM.moduleName("./value-converters/date"),
    PLATFORM.moduleName("./value-converters/timespan"),
    PLATFORM.moduleName("./value-converters/boolean"),
    PLATFORM.moduleName("./value-converters/secondsDays"),
    PLATFORM.moduleName("./value-converters/smallHexString"),

    // PLATFORM.moduleName("./dialogs/alert/alert"),
    // PLATFORM.moduleName("./bindingBehaviors/asyncBinding"),
  ]);
}
