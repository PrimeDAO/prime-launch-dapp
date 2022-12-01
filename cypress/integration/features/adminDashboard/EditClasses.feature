Feature: Edit Contributor Class
  Background: Admin is in Admin Dashboard page
    # Given 1 seed
    # And the Seed has 1 contributor class
    # Given I navigate to the Home page
    # And I'm the Admin of the Seed
    # And I'm connected to the app
    # And I navigate to the Admin Dashboard

  Scenario: Admin edits a Contributor Class
    Given 1 seed
    And 1 seed
    And the Seed has 2 Classes
    And I navigate to the Home page
    And I'm the Admin of the Seed
    And I'm connected to the app

    # When I edit a Class
    # Then the changes to the Class should be reflected
    # And adding new Classes should be disabled
