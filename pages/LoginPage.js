const { By } = require('selenium-webdriver');
const { BasePage } = require('./BasePage');

class LoginPage extends BasePage {
  static EMAIL = By.css("[data-qa='login-email']");
  static PASSWORD = By.css("[data-qa='login-password']");
  static SUBMIT = By.css("[data-qa='login-button']");
  static ERROR_MSG = By.xpath("//p[contains(text(),'Your email or password is incorrect')]");
  static LOGOUT_LINK = By.css("a[href='/logout']");

  static SIGNUP_NAME = By.css("[data-qa='signup-name']");
  static SIGNUP_EMAIL = By.css("[data-qa='signup-email']");
  static SIGNUP_SUBMIT = By.css("[data-qa='signup-button']");
  static SIGNUP_ERROR = By.xpath("//p[contains(text(),'Email Address already exist')]");

  async login(email, password) {
    await this.typeText(LoginPage.EMAIL, email);
    await this.typeText(LoginPage.PASSWORD, password);
    await this.click(LoginPage.SUBMIT);
  }

  async getErrorMessage() {
    return this.getText(LoginPage.ERROR_MSG);
  }

  async isLoggedIn() {
    return this.isVisible(LoginPage.LOGOUT_LINK);
  }

  async fillSignup(name, email) {
    await this.typeText(LoginPage.SIGNUP_NAME, name);
    await this.typeText(LoginPage.SIGNUP_EMAIL, email);
    await this.click(LoginPage.SIGNUP_SUBMIT);
  }

  async getSignupError() {
    return this.getText(LoginPage.SIGNUP_ERROR);
  }
}

module.exports = { LoginPage };
