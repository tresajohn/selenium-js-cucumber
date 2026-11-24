import {
  Before,
  After,
  BeforeAll,
  setDefaultTimeout,
  setWorldConstructor,
  ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { DriverFactory } from '../utils/driverFactory';
import { takeScreenshot } from '../utils/screenshotHelper';
import { JiraHelper, FailureContext } from '../utils/jiraHelper';
import { getConfig } from '../config/config';
import { TypedWorld } from './world';

setWorldConstructor(TypedWorld);
setDefaultTimeout(60000);

let jiraHelper: JiraHelper;

BeforeAll(function () {
  jiraHelper = new JiraHelper(getConfig());
});

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
  let screenshotPath: string | null = null;
  try {
    if (scenario.result?.status === 'FAILED') {
      screenshotPath = await takeScreenshot(this.driver, scenario.pickle.name);
      const tags = scenario.pickle.tags.map((t) => t.name);
      const failure: FailureContext = {
        scenarioName: scenario.pickle.name,
        featureFile: scenario.pickle.uri ?? '',
        tags,
        errorMessage: scenario.result.message ?? '',
        screenshotPath,
        ciRunUrl: process.env.GITHUB_RUN_URL ?? '',
        commitSha: process.env.GITHUB_SHA ?? '',
        durationMs: scenario.result.duration?.nanos ? scenario.result.duration.nanos / 1e6 : 0,
      };
      await jiraHelper.createTicket(failure);
    }
    await this.driver.manage().deleteAllCookies();
  } finally {
    await this.driver.quit();
  }
});
