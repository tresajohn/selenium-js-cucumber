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
    // Trigger hover via JS events (more reliable in headless than Selenium Actions)
    await this.driver.executeScript(`
      const el = arguments[0];
      el.dispatchEvent(new MouseEvent('mouseover', {bubbles: true, cancelable: true}));
      el.dispatchEvent(new MouseEvent('mouseenter', {bubbles: true, cancelable: true}));
    `, firstProduct);
    await this.driver.sleep(800);
    // Try overlay button first, fallback to any visible add-to-cart
    await this.driver.executeScript(`
      const overlay = arguments[0].querySelector('.product-overlay .add-to-cart');
      const any = document.querySelector('.product-overlay .add-to-cart');
      const btn = overlay || any;
      if (btn) btn.click();
    `, firstProduct);
    await this.driver.sleep(500);
    try {
      const continueBtn = await this.wait.untilClickable(HomePage.MODAL_CONTINUE);
      await continueBtn.click();
    } catch {
      // no modal
    }
    await this.driver.sleep(1000);
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
