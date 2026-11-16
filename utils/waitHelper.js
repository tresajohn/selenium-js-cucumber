const { until } = require('selenium-webdriver');

class WaitHelper {
  constructor(driver, timeoutSeconds = 10) {
    this.driver = driver;
    this.timeout = timeoutSeconds * 1000;
  }

  async untilVisible(locator) {
    const el = await this.driver.wait(until.elementLocated(locator), this.timeout);
    await this.driver.wait(until.elementIsVisible(el), this.timeout);
    return el;
  }

  async untilClickable(locator) {
    const el = await this.driver.wait(until.elementLocated(locator), this.timeout);
    await this.driver.wait(until.elementIsEnabled(el), this.timeout);
    return el;
  }

  async untilAllVisible(locator) {
    return await this.driver.wait(until.elementsLocated(locator), this.timeout);
  }
}

module.exports = { WaitHelper };
