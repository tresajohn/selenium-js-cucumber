import { By } from 'selenium-webdriver';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  get productItems(): By {
    return By.css('.product-image-wrapper');
  }
  get modalContinue(): By {
    return By.css('.modal-footer .btn-success');
  }
  get searchInput(): By {
    return By.css('#search_product');
  }
  get searchButton(): By {
    return By.css('#submit_search');
  }
  get productNames(): By {
    return By.css('.features_items .product-image-wrapper .productinfo p');
  }

  async navigateHome(baseUrl: string): Promise<void> {
    await this.navigate(baseUrl);
  }

  async addFirstProductToCart(): Promise<void> {
    const products = await this.getElements(this.productItems);
    if (products.length === 0) throw new Error('No products found on home page');
    const firstProduct = products[0];
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", firstProduct);
    await this.driver.executeScript(
      `
      const btn = arguments[0].querySelector('.productinfo .add-to-cart')
                || arguments[0].querySelector('.add-to-cart');
      if (btn) btn.click();
    `,
      firstProduct
    );
    await this.driver.sleep(500);
    try {
      const continueBtn = await this.wait.untilClickable(this.modalContinue);
      await continueBtn.click();
    } catch {
      // no modal shown
    }
  }

  async searchProduct(keyword: string): Promise<void> {
    const origin = (await this.driver.executeScript('return window.location.origin')) as string;
    await this.navigate(`${origin}/products`);
    const inp = await this.wait.untilClickable(this.searchInput);
    await inp.clear();
    await inp.sendKeys(keyword);
    // executeScript click returns immediately (no WebDriver navigation-block like el.click())
    await this.driver.executeScript("document.getElementById('submit_search').click()");
    await this.driver.wait(
      () =>
        this.driver.executeScript('return document.readyState === "complete"') as Promise<boolean>,
      30000
    );
    await this._dismissConsent();
  }

  async getProductNames(): Promise<string[]> {
    const els = await this.getElements(this.productNames);
    const names: string[] = [];
    for (const el of els) {
      names.push(await el.getText());
    }
    return names;
  }
}
