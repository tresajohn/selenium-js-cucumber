const { By } = require('selenium-webdriver');
const { BasePage } = require('./BasePage');

class RegistrationPage extends BasePage {
  static PASSWORD = By.css("[data-qa='password']");
  static FIRST_NAME = By.css("[data-qa='first_name']");
  static LAST_NAME = By.css("[data-qa='last_name']");
  static ADDRESS = By.css("[data-qa='address']");
  static STATE = By.css("[data-qa='state']");
  static CITY = By.css("[data-qa='city']");
  static ZIPCODE = By.css("[data-qa='zipcode']");
  static MOBILE = By.css("[data-qa='mobile_number']");
  static CREATE_ACCOUNT = By.css("[data-qa='create-account']");
  static ACCOUNT_CREATED = By.css("[data-qa='account-created'] b");

  async completeRegistration(password = 'Test@1234') {
    await this._dismissConsent();
    await this.typeText(RegistrationPage.PASSWORD, password);
    await this.typeText(RegistrationPage.FIRST_NAME, 'Test');
    await this.typeText(RegistrationPage.LAST_NAME, 'User');
    await this.typeText(RegistrationPage.ADDRESS, '123 Test Street');
    await this.typeText(RegistrationPage.STATE, 'TestState');
    await this.typeText(RegistrationPage.CITY, 'TestCity');
    await this.typeText(RegistrationPage.ZIPCODE, '12345');
    await this.typeText(RegistrationPage.MOBILE, '1234567890');
    await this.click(RegistrationPage.CREATE_ACCOUNT);
    await this.wait.untilVisible(RegistrationPage.ACCOUNT_CREATED);
  }

  async isRegistered() {
    return this.isVisible(RegistrationPage.ACCOUNT_CREATED);
  }
}

module.exports = { RegistrationPage };
