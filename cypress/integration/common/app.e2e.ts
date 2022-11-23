
export class E2eApp {
  public static getBanner(bannerMessage: string) {
    return cy.contains("[data-test='banner-message']", bannerMessage);
  }
}
