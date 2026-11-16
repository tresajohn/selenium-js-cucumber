const { By } = require('selenium-webdriver');
const { BasePage } = require('./BasePage');

class ContactPage extends BasePage {
  static NAME = By.css("[data-qa='name']");
  static EMAIL = By.css("[data-qa='email']");
  static SUBJECT = By.css("[data-qa='subject']");
  static MESSAGE = By.css("[data-qa='message']");
  static SUBMIT = By.css("[data-qa='submit-button']");
  static SUCCESS_MSG = By.css('.contact-form .alert-success');

  async fillContactForm(name, email, subject, message) {
    await this.typeText(ContactPage.NAME, name);
    await this.typeText(ContactPage.EMAIL, email);
    await this.typeText(ContactPage.SUBJECT, subject);
    await this.typeText(ContactPage.MESSAGE, message);
  }

  async submitForm() {
    await this.click(ContactPage.SUBMIT);
    try {
      await this.driver.switchTo().alert().accept();
    } catch {
      // no alert
    }
  }

  async getSuccessMessage() {
    return this.getText(ContactPage.SUCCESS_MSG);
  }
}

module.exports = { ContactPage };
