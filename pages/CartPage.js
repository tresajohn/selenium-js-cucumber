const { By } = require('selenium-webdriver');
const { BasePage } = require('./BasePage');

class CartPage extends BasePage {
  static CART_ROWS = By.css('#cart_info_table tbody tr');
  static ITEM_NAMES = By.css('.cart_description h4 a');
  static PROCEED_CHECKOUT = By.css('a.btn.check_out');

  async getCartItems() {
    return this.getElements(CartPage.CART_ROWS);
  }

  async getCartItemNames() {
    const nameEls = await this.getElements(CartPage.ITEM_NAMES);
    const names = [];
    for (const el of nameEls) {
      names.push(await el.getText());
    }
    return names;
  }
}

module.exports = { CartPage };
