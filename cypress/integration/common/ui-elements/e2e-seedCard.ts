import { SEED_DASHBOARD_PATH } from "../e2eConstants"

export class E2eSeedCards {
  public static getSeedCard() {
    return cy.get("[data-test='seed-card']")
  }

  public static getSeedCardById(id: string) {
    const seedHref = `${SEED_DASHBOARD_PATH}${id}`
    return cy.get(`[data-test='seed-card'][href='${seedHref}']`)
  }
}
