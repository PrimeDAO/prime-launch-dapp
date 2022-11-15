Feature: Add or edit Contributor Class
  Background: Admin is in Admin Dashboard page
    Given I navigate to the Home page
    And I'm the Admin of the Seed
    And I'm connected to the app

  Scenario: Admin adds a Contributor Class
    Given I navigate to the Admin Dashboard
  # 	Given the seed has not started
  	When I want to add a Class
    And fill out the Class informations
    And the information is displayed in the Classes overview
    And I confirm the Class addition
    Then the new Class should be added
  #   Then fills in the details for adding a class ("Class name", "Class Purchase limit", "Project token purchase limit", "vesting period", "cliff period"and "Allowlist")
  # 	And confirms the addition
  # 	And confirms the Metamask transaction

  @focus
  Scenario: Admin edits a Contributor Class
    And I navigate to the Admin Dashboard
    When I edit a Class
    Then the changes to the Class should be reflected
    And adding new Classes should be disabled

  	# Given the seed has not started
  	# When the admin selects "Edit Class"
  	# Then the admin can edit the class input fields ("Class name", "Class Purchase limit", "Project token purchase limit", "vesting period", and "Allowlist")
  	# And confirms the edition
  	# And confirms the Metamask transaction

  # # Limitation
  # #  - FE: mocks not ready, and hesitant to add new user flows
  # Scenario: Admin add a whitelist
  # 	Given the seed has not started
  # 	When the admin selects "Edit Class"
  # 	Then the admin can add a whitelist to a contributor class
