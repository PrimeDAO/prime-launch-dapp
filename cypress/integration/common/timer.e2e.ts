import { When } from "@badeball/cypress-cucumber-preprocessor/methods";
import { dayToMilliSeconds, secondsToMilliSeconds } from "../../../src/shared/shared";

When("I wait {int} day(s)", (numOfDays: number) => {
  cy.clock()
  const daysMillis = dayToMilliSeconds(numOfDays)
  cy.tick(daysMillis)
})

When("I wait {int} seconds(s)", (numOfSecondss: number) => {
  cy.clock()
  const secondssMillis = secondsToMilliSeconds(numOfSecondss)
  cy.tick(secondssMillis)
})
