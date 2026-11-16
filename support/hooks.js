const { Before, After, setDefaultTimeout } = require('@cucumber/cucumber');
const { DriverFactory } = require('../utils/driverFactory');
const { takeScreenshot } = require('../utils/screenshotHelper');

setDefaultTimeout(60000);

Before(async function (scenario) {
  const hasCredentialsTag = scenario.pickle.tags.some(t => t.name === '@needs_credentials');
  if (hasCredentialsTag && (!this.config.testEmail || !this.config.testPassword)) {
    return 'skipped';
  }
  this.driver = await DriverFactory.create(this.config.browser, this.config.headless);
  this.timeoutSeconds = this.config.timeout;
  if (this.config.headless) {
    await this.driver.manage().window().setRect({ width: 1920, height: 3000 });
  } else {
    await this.driver.manage().window().maximize();
  }
});

After(async function (scenario) {
  if (!this.driver) return;
  try {
    if (scenario.result.status === 'FAILED') {
      await takeScreenshot(this.driver, scenario.pickle.name);
    }
    await this.driver.manage().deleteAllCookies();
  } finally {
    await this.driver.quit();
  }
});
