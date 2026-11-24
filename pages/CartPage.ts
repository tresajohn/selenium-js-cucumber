import { By, WebElement } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  get cartRows(): By {
    return By.css('#cart_info_table tbody tr');
  }
  get itemNames(): By {
    return By.css('.cart_description h4 a');
  }
  get proceedCheckout(): By {
    return By.css('a.btn.check_out');
  }

  async getCartItems(): Promise<WebElement[]> {
    return this.getElements(this.cartRows);
  }

  async getCartItemNames(): Promise<string[]> {
    const nameEls = await this.getElements(this.itemNames);
    const names: string[] = [];
    for (const el of nameEls) {
      names.push(await el.getText());
    }
    return names;
  }

  async proceedToCheckout(): Promise<void> {
    await this.click(this.proceedCheckout);
  }
}
