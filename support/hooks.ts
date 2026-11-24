import {
  Before,
  After,
  setDefaultTimeout,
  setWorldConstructor,
  ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { DriverFactory } from '../utils/driverFactory';
import { takeScreenshot } from '../utils/screenshotHelper';
import { TypedWorld } from './world';

setWorldConstructor(TypedWorld);
setDefaultTimeout(60000);

Before(async function (this: TypedWorld, scenario: ITestCaseHookParameter) {
  const hasCredentialsTag = scenario.pickle.tags.some((t) => t.name === '@needs_credentials');
  if (hasCredentialsTag && (!this.config.testEmail || !this.config.testPassword)) {
    return 'skipped';
  }
  this.driver = await DriverFactory.create(this.config.browser, this.config.headless);
  this.timeoutMs = this.config.timeout * 1000;
  if (this.config.headless) {
    await this.driver.manage().window().setRect({ width: 1920, height: 3000 });
  } else {
    await this.driver.manage().window().maximize();
  }
});

After(async function (this: TypedWorld, scenario: ITestCaseHookParameter) {
  if (!this.driver) return;
  try {
    if (scenario.result?.status === 'FAILED') {
      await takeScreenshot(this.driver, scenario.pickle.name);
    }
    await this.driver.manage().deleteAllCookies();
  } finally {
    await this.driver.quit();
  }
});
