import { By, WebDriver, WebElement } from 'selenium-webdriver';
import { WaitHelper } from '../utils/waitHelper';

export class BasePage {
  protected driver: WebDriver;
  protected wait: WaitHelper;

  constructor(driver: WebDriver, timeoutSeconds = 10) {
    this.driver = driver;
    this.wait = new WaitHelper(driver, timeoutSeconds);
  }

  protected async _dismissConsent(): Promise<void> {
    await this.driver.sleep(2000);
    await this.driver.executeScript(`
      document.querySelectorAll(
        '.fc-dialog-overlay, .fc-dialog-container, .fc-consent-root'
      ).forEach(el => el.remove());
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    `);
    try {
      const consentWait = new WaitHelper(this.driver, 2);
      const btn = await consentWait.untilClickable(By.css('.fc-cta-consent'));
      await btn.click();
    } catch {
      // banner absent or already removed
    }
  }

  async navigate(url: string): Promise<void> {
    await this.driver.get(url);
    await this.driver.wait(
      () =>
        this.driver.executeScript('return document.readyState === "complete"') as Promise<boolean>,
      30000
    );
    await this._dismissConsent();
  }

  async click(locator: By): Promise<void> {
    const el = await this.wait.untilClickable(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
    try {
      await el.click();
    } catch {
      await this.driver.executeScript('arguments[0].click();', el);
    }
  }

  async typeText(locator: By, text: string): Promise<void> {
    const el = await this.wait.untilClickable(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
    await el.clear();
    try {
      await el.sendKeys(text);
    } catch {
      await this.driver.executeScript('arguments[0].value = arguments[1];', el, text);
    }
  }

  async getText(locator: By): Promise<string> {
    const el = await this.wait.untilVisible(locator);
    return el.getText();
  }

  async isVisible(locator: By): Promise<boolean> {
    try {
      await this.wait.untilVisible(locator);
      return true;
    } catch {
      return false;
    }
  }

  async getTitle(): Promise<string> {
    return this.driver.getTitle();
  }

  async getElements(locator: By): Promise<WebElement[]> {
    try {
      await this.wait.untilVisible(locator);
      return this.driver.findElements(locator);
    } catch {
      return [];
    }
  }
}
