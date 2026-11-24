import path from 'path';
import 'dotenv/config';

export interface Config {
  baseUrl: string;
  browser: string;
  headless: boolean;
  timeout: number;
  jiraBaseUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
  jiraProjectKey: string;
  jiraIssueType: string;
  testEmail: string;
  testPassword: string;
}

export function getConfig(): Config {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require(path.join(__dirname, 'config.json'));

  const headlessEnv = process.env.HEADLESS;
  const headless =
    headlessEnv !== undefined ? headlessEnv.toLowerCase() === 'true' : data.headless;

  return {
    baseUrl: data.base_url,
    browser: process.env.BROWSER || data.browser || 'chrome',
    headless,
    timeout: parseInt(data.timeout || '10', 10),
    jiraBaseUrl: process.env.JIRA_BASE_URL || data.jira.base_url,
    jiraEmail: process.env.JIRA_EMAIL || '',
    jiraApiToken: process.env.JIRA_API_TOKEN || '',
    jiraProjectKey: process.env.JIRA_PROJECT_KEY || data.jira.project_key,
    jiraIssueType: data.jira.issue_type,
    testEmail: process.env.TEST_EMAIL || '',
    testPassword: process.env.TEST_PASSWORD || '',
  };
}
