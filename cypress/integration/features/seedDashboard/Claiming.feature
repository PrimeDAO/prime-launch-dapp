Feature: Claiming

  # @focus
  Scenario: Setup - Claiming
    Given 1 seed
    And I navigate to the Home page
    And I'm the Admin of the Seed
    And I'm connected to the app
    And I navigate to the Seed "MINIMUM_SEED"
    And I navigate to the Admin Dashboard
    And I fund the Seed

  # @focus
  Scenario: Setup - Contributing
    Given I navigate to the Seed "MINIMUM_SEED"
    And I change the address to "Class1_User1"
    And I input the max amount to contribute
    And I unlock the amount
    And I contribute the amount

  # @focus
  Scenario: Claim amount
    Given I navigate to the Seed "MINIMUM_SEED"
    And I input the max amount to claim
    And I claim the amount
    Then the address should have the Individual Cap transferred to it

  # @focus
  # Scenario: Claim amount
  #   Given I navigate to the Seed "MINIMUM_SEED"
  #   And I input the max amount to claim
  #   And I claim the amount

  # @focus
  # Scenario: Claim amount - Verify amount transferred
  #   And I navigate to the Home page
  #   And I'm the Admin of the Seed
  #   And I'm connected to the app
  #   And I change the address to "Class1_User1"

  #   Then the address should have the Individual Cap transferred to it
