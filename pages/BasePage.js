const { By, until } = require('selenium-webdriver');
const { WaitHelper } = require('../utils/waitHelper');

const CONSENT_BTN = By.css('.fc-cta-consent');

class BasePage {
  constructor(driver, timeoutSeconds = 10) {
    this.driver = driver;
    this.wait = new WaitHelper(driver, timeoutSeconds);
  }

  async _dismissConsent() {
    try {
      const consentWait = new WaitHelper(this.driver, 3);
      const btn = await consentWait.untilClickable(CONSENT_BTN);
      await btn.click();
    } catch {
      // banner absent or already dismissed
    }
  }

  async navigate(url) {
    await this.driver.get(url);
    await this.driver.wait(
      () => this.driver.executeScript('return document.readyState === "complete"'),
      10000
    );
    await this._dismissConsent();
  }

  async click(locator) {
    const el = await this.wait.untilClickable(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
    try {
      await el.click();
    } catch {
      await this.driver.executeScript('arguments[0].click();', el);
    }
  }

  async typeText(locator, text) {
    const el = await this.wait.untilClickable(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
    await el.clear();
    try {
      await el.sendKeys(text);
    } catch {
      await this.driver.executeScript('arguments[0].value = arguments[1];', el, text);
    }
  }

  async getText(locator) {
    const el = await this.wait.untilVisible(locator);
    return el.getText();
  }

  async isVisible(locator) {
    try {
      await this.wait.untilVisible(locator);
      return true;
    } catch {
      return false;
    }
  }

  async getTitle() {
    return this.driver.getTitle();
  }

  async getElements(locator) {
    try {
      await this.wait.untilVisible(locator);
      return this.driver.findElements(locator);
    } catch {
      return [];
    }
  }


}

module.exports = { BasePage };
