const { By } = require('selenium-webdriver');
const { BasePage } = require('./BasePage');

class CheckoutPage extends BasePage {
  static PLACE_ORDER = By.css("a[href='/payment']");
  static CARD_NAME = By.css("[data-qa='name-on-card']");
  static CARD_NUMBER = By.css("[data-qa='card-number']");
  static CVC = By.css("[data-qa='cvc']");
  static EXPIRY_MONTH = By.css("[data-qa='expiry-month']");
  static EXPIRY_YEAR = By.css("[data-qa='expiry-year']");
  static PAY_BUTTON = By.css("[data-qa='pay-button']");
  static SUCCESS_MSG = By.css("[data-qa='order-placed']");

  async confirmOrder() {
    await this.click(CheckoutPage.PLACE_ORDER);
    await this.typeText(CheckoutPage.CARD_NAME, 'Test User QA');
    await this.typeText(CheckoutPage.CARD_NUMBER, '4111111111111111');
    await this.typeText(CheckoutPage.CVC, '111');
    await this.typeText(CheckoutPage.EXPIRY_MONTH, '12');
    await this.typeText(CheckoutPage.EXPIRY_YEAR, '2027');
    await this.click(CheckoutPage.PAY_BUTTON);
  }

  async isOrderPlaced() {
    return this.isVisible(CheckoutPage.SUCCESS_MSG);
  }

  async getSuccessMessage() {
    return this.getText(CheckoutPage.SUCCESS_MSG);
  }
}

module.exports = { CheckoutPage };
