import { By, WebDriver, WebElement, until } from 'selenium-webdriver';

export class WaitHelper {
  private driver: WebDriver;
  private timeout: number;

  constructor(driver: WebDriver, timeoutSeconds = 10) {
    this.driver = driver;
    this.timeout = timeoutSeconds * 1000;
  }

  async untilVisible(locator: By): Promise<WebElement> {
    const el = await this.driver.wait(until.elementLocated(locator), this.timeout);
    await this.driver.wait(until.elementIsVisible(el), this.timeout);
    return el;
  }

  async untilClickable(locator: By): Promise<WebElement> {
    const el = await this.driver.wait(until.elementLocated(locator), this.timeout);
    await this.driver.wait(until.elementIsVisible(el), this.timeout);
    await this.driver.wait(until.elementIsEnabled(el), this.timeout);
    return el;
  }

  async untilAllVisible(locator: By): Promise<WebElement[]> {
    return this.driver.wait(until.elementsLocated(locator), this.timeout);
  }
}
