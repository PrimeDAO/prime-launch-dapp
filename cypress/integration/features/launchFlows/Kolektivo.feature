Feature: Kolektivo Launch
  Background: Admin is in Admin Dashboard page

  @focus
  Scenario: Seed setup - Contributing
    Given 1 seed
    And 1 permissioned seed
    And the Seed has 2 Classes
    And I navigate to the Home page
    And I'm the Admin of the Seed
    And I'm connected to the app

    Given I navigate to the Seed "MINIMUM_PERMISSIONED_SEED_WITH_CLASS"
    And I navigate to the Admin Dashboard
    And I fund the Seed

    # Given I navigate to the Home page
    # And I change the address to "Class1_User1"
    # And I'm connected to the app
    # And I navigate to the Seed "MINIMUM_PERMISSIONED_SEED_WITH_CLASS"

  @focus
  Scenario: Contribute - Admin
    Given I navigate to the Seed "MINIMUM_PERMISSIONED_SEED_WITH_CLASS"
    And I wait 6 seconds
    And I input the max amount
    And I unlock the amount
    And I contribute the amount

  @focus
  Scenario: Contribute - Class1_User1
    Given I navigate to the Home page
    And I change the address to "Class1_User1"
    And I'm connected to the app
    And I navigate to the Seed "MINIMUM_PERMISSIONED_SEED_WITH_CLASS"
    And I wait 5 seconds
    And I input the max amount
    And I unlock the amount
    And I contribute the amount
