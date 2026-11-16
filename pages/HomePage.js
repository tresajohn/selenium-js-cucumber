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
    const firstProduct = products[0];
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", firstProduct);
    // Click the always-visible .productinfo .add-to-cart (no hover needed)
    await this.driver.executeScript(`
      const btn = arguments[0].querySelector('.productinfo .add-to-cart')
                || arguments[0].querySelector('.add-to-cart');
      if (btn) btn.click();
    `, firstProduct);
    await this.driver.sleep(500);
    try {
      const continueBtn = await this.wait.untilClickable(HomePage.MODAL_CONTINUE);
      await continueBtn.click();
    } catch {
      // no modal shown
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
