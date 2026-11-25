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
    return By.css('.productinfo p');
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
    const currentUrl = await this.driver.getCurrentUrl();
    if (!currentUrl.includes('/products')) {
      const origin = (await this.driver.executeScript('return window.location.origin')) as string;
      await this.navigate(`${origin}/products`);
    }
    await this.typeText(this.searchInput, keyword);
    await this.click(this.searchButton);
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
