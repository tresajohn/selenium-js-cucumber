import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
  get placeOrder(): By {
    return By.css("a[href='/payment']");
  }
  get cardName(): By {
    return By.css("[data-qa='name-on-card']");
  }
  get cardNumber(): By {
    return By.css("[data-qa='card-number']");
  }
  get cvc(): By {
    return By.css("[data-qa='cvc']");
  }
  get expiryMonth(): By {
    return By.css("[data-qa='expiry-month']");
  }
  get expiryYear(): By {
    return By.css("[data-qa='expiry-year']");
  }
  get payButton(): By {
    return By.css("[data-qa='pay-button']");
  }
  get successMsg(): By {
    return By.css("[data-qa='order-placed']");
  }

  async confirmOrder(): Promise<void> {
    await this.click(this.placeOrder);
    await this.typeText(this.cardName, 'Test User QA');
    await this.typeText(this.cardNumber, '4111111111111111');
    await this.typeText(this.cvc, '111');
    await this.typeText(this.expiryMonth, '12');
    await this.typeText(this.expiryYear, '2027');
    await this.click(this.payButton);
  }

  async isOrderPlaced(): Promise<boolean> {
    return this.isVisible(this.successMsg);
  }

  async getSuccessMessage(): Promise<string> {
    return this.getText(this.successMsg);
  }
}
