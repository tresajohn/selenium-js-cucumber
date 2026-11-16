const { By } = require('selenium-webdriver');
const { BasePage } = require('./BasePage');

class HomePage extends BasePage {
  static PRODUCT_ITEMS = By.css('.product-image-wrapper');
  static ADD_TO_CART_BTN = By.css('.product-overlay .add-to-cart');
  static MODAL_CONTINUE = By.css('.modal-footer .btn-success');
  static SEARCH_INPUT = By.css('#search_product');
  static SEARCH_BUTTON = By.css('#submit_search');
  static PRODUCT_NAMES = By.css('.productinfo p');

  async navigateHome(baseUrl) {
    await this.navigate(baseUrl);
  }

  async addFirstProductToCart() {
    const products = await this.getElements(HomePage.PRODUCT_ITEMS);
    if (products.length === 0) throw new Error('No products found on home page');
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", products[0]);
    const actions = this.driver.actions({ async: true });
    await actions.move({ origin: products[0] }).perform();
    await this.driver.sleep(1000);
    const addBtns = await this.driver.findElements(HomePage.ADD_TO_CART_BTN);
    if (addBtns.length === 0) {
      // Fallback: JS-trigger click on the first overlay button directly
      await this.driver.executeScript(`
        const btn = document.querySelector('.product-overlay .add-to-cart');
        if (btn) btn.click();
      `);
    } else {
      await this.driver.executeScript('arguments[0].click();', addBtns[0]);
    }
    await this.driver.sleep(500);
    try {
      const continueBtn = await this.wait.untilClickable(HomePage.MODAL_CONTINUE);
      await continueBtn.click();
    } catch {
      // no modal
    }
  }

  async searchProduct(keyword) {
    const currentUrl = await this.driver.getCurrentUrl();
    if (!currentUrl.includes('/products')) {
      const origin = await this.driver.executeScript('return window.location.origin');
      await this.navigate(`${origin}/products`);
    }
    await this.typeText(HomePage.SEARCH_INPUT, keyword);
    await this.click(HomePage.SEARCH_BUTTON);
    try {
      await this.wait.untilVisible(HomePage.PRODUCT_NAMES);
    } catch {
      // no results is valid
    }
  }

  async getSearchResults() {
    return this.getElements(HomePage.PRODUCT_NAMES);
  }
}

module.exports = { HomePage };
