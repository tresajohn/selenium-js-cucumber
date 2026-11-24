import { JiraHelper } from '../utils/jiraHelper';
import { getConfig } from '../config/config';
import { Config } from '../config/config';

function test_jira_helper_disabled_when_no_token() {
  const config = { ...getConfig(), jiraApiToken: '' } as Config;
  const helper = new JiraHelper(config);
  if ((helper as unknown as Record<string, unknown>).enabled !== false)
    throw new Error('should be disabled');
  console.log('PASS: disabled when no token');
}

function test_priority_smoke_is_high() {
  const config = { ...getConfig(), jiraApiToken: 'fake' } as Config;
  const helper = new JiraHelper(config);
  const priority = (helper as unknown as Record<string, unknown>)._priority as (
    tags: string[]
  ) => string;
  if (priority(['@smoke', '@regression']) !== 'High') throw new Error('Expected High');
  console.log('PASS: smoke → High priority');
}

function test_priority_regression_is_medium() {
  const config = { ...getConfig(), jiraApiToken: 'fake' } as Config;
  const helper = new JiraHelper(config);
  const priority = (helper as unknown as Record<string, unknown>)._priority as (
    tags: string[]
  ) => string;
  if (priority(['@regression']) !== 'Medium') throw new Error('Expected Medium');
  console.log('PASS: regression → Medium priority');
}

function test_strip_ansi_removes_escape_codes() {
  const config = { ...getConfig(), jiraApiToken: 'fake' } as Config;
  const helper = new JiraHelper(config);
  const stripAnsi = (helper as unknown as Record<string, unknown>)._stripAnsi as (
    s: string
  ) => string;
  const stripped = stripAnsi('[31mRed error[0m');
  if (stripped !== 'Red error') throw new Error(`ANSI strip failed: ${stripped}`);
  console.log('PASS: ANSI codes stripped from error message');
}

test_jira_helper_disabled_when_no_token();
test_priority_smoke_is_high();
test_priority_regression_is_medium();
test_strip_ansi_removes_escape_codes();
