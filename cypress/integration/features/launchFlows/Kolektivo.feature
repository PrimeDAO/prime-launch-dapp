Feature: Kolektivo Launch
  Background:
    And I navigate to the Home page
    And I'm the Admin of the Seed
    And I'm connected to the app

  # @focus
  Scenario: Seed setup - Contributing
    And 1 permissioned seed named "_27_KOLEKTIVO_CELO_TEST_SEED"
    And the Seed has 1 Class named "_27_KOLEKTIVO_SEED_CLASS"
    And I navigate to the Home page
    And I'm the Admin of the Seed
    And I'm connected to the app

    Given I navigate to the Seed "_27_KOLEKTIVO_CELO_TEST_SEED"
    And I navigate to the Admin Dashboard
    And I fund the Seed

  # @focus
  Scenario: Contribute - Admin
    Given I navigate to the Seed "_27_KOLEKTIVO_CELO_TEST_SEED"
    # And I input "100,000" to contribute
    # Then the max amount should be "100,000.0"
    # And I unlock the amount
    # And I contribute the amount

  @focus
  Scenario: Contribute - Class1_User1
    And I change the address to "Class1_User1"
    And I'm connected to the app
    And I navigate to the Seed "_27_KOLEKTIVO_CELO_TEST_SEED"
    # And I input the max amount to contribute
    # Then the max amount should be "50,000.0"
    # And I unlock the amount
    # And I contribute the amount

  # @focus
  Scenario: Contribute - Class1_NewlyAdded1
    Given I navigate to the Home page
    And I change the address to "Class1_NewlyAdded1"
    And I'm connected to the app
    And I navigate to the Seed "_27_KOLEKTIVO_CELO_TEST_SEED"
    And I input the max amount to contribute
    Then the max amount should be "50,000.0"
    And I unlock the amount
    And I contribute the amount

  # @focus
  Scenario: Retrieving Funds - Class1_User1
    Given I navigate to the Home page
    And I change the address to "Class1_User1"
    And I'm connected to the app
    And I navigate to the Seed "_27_KOLEKTIVO_CELO_TEST_SEED"

    And I input the max amount to claim
    And I claim the amount
    Then the address should have "15" transferred to it
