import { readFileSync } from 'fs';
import { Config } from '../config/config';
import { Logger } from './logger';

export interface FailureContext {
  scenarioName: string;
  featureFile: string;
  tags: string[];
  errorMessage: string;
  screenshotPath: string | null;
  ciRunUrl: string;
  commitSha: string;
  durationMs: number;
}

export class JiraHelper {
  private config: Config;
  private logger: Logger;
  private enabled: boolean;

  constructor(config: Config) {
    this.config = config;
    this.logger = Logger.create('JiraHelper');
    this.enabled = !!config.jiraApiToken;
  }

  private _priority(tags: string[]): string {
    return tags.includes('@smoke') ? 'High' : 'Medium';
  }

  private _stripAnsi(s: string): string {
    return s.replace(/\x1B\[[0-9;]*m/g, '');
  }

  private _labels(tags: string[]): string[] {
    const labels = ['automation-failure', 'cucumber', 'selenium'];
    for (const tag of tags) {
      const clean = tag.replace('@', '');
      if (!labels.includes(clean)) labels.push(clean);
    }
    return labels;
  }

  private _buildAdfBody(failure: FailureContext): object {
    const cleanError = this._stripAnsi(failure.errorMessage);
    return {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Environment' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `Feature: ${failure.featureFile} | CI: ${failure.ciRunUrl || 'local'} | SHA: ${failure.commitSha || 'unknown'}`,
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Failed Scenario' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: failure.scenarioName }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Actual Result' }],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'text' },
          content: [{ type: 'text', text: cleanError }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Expected Result' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Scenario should pass without errors.' }],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Automation Reference' }],
        },
        {
          type: 'codeBlock',
          attrs: { language: 'bash' },
          content: [
            {
              type: 'text',
              text: `npx cucumber-js --tags "@name:${failure.scenarioName.replace(/ /g, '_')}"`,
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: 'Triage Checklist' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '[ ] Reproduced manually' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '[ ] Root cause identified' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: '[ ] Fix verified in CI' }],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  private async _ticketExists(scenarioName: string): Promise<boolean> {
    const jql = `project = "${this.config.jiraProjectKey}" AND summary = "${scenarioName}" AND statusCategory != Done`;
    const url = `${this.config.jiraBaseUrl}/rest/api/3/issue/picker?query=${encodeURIComponent(scenarioName)}&currentJQL=${encodeURIComponent(jql)}`;
    try {
      const res = await fetch(url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.jiraEmail}:${this.config.jiraApiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { sections: Array<{ issues: unknown[] }> };
      const issues = data.sections?.flatMap((s) => s.issues) ?? [];
      return issues.length > 0;
    } catch {
      return false;
    }
  }

  async createTicket(failure: FailureContext): Promise<string | null> {
    if (!this.enabled) return null;

    try {
      const exists = await this._ticketExists(failure.scenarioName);
      if (exists) {
        this.logger.info(`Ticket already exists for: ${failure.scenarioName}`);
        return null;
      }

      const body = {
        fields: {
          project: { key: this.config.jiraProjectKey },
          summary: `[Auto] Selenium failure: ${failure.scenarioName}`,
          issuetype: { name: this.config.jiraIssueType },
          priority: { name: this._priority(failure.tags) },
          labels: this._labels(failure.tags),
          description: this._buildAdfBody(failure),
        },
      };

      const res = await fetch(`${this.config.jiraBaseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.jiraEmail}:${this.config.jiraApiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        this.logger.error(`Jira ticket creation failed: ${res.status}`);
        return null;
      }

      const data = (await res.json()) as { key: string };
      this.logger.info(`Jira ticket created: ${data.key}`);

      if (failure.screenshotPath) {
        await this._attachScreenshot(data.key, failure.screenshotPath);
      }

      return data.key;
    } catch (err) {
      this.logger.error('Jira integration error', err);
      return null;
    }
  }

  private async _attachScreenshot(issueKey: string, screenshotPath: string): Promise<void> {
    try {
      const fileBuffer = readFileSync(screenshotPath);
      const filename = screenshotPath.split('/').pop() ?? 'screenshot.png';
      const formData = new FormData();
      formData.append('file', new Blob([fileBuffer], { type: 'image/png' }), filename);

      await fetch(`${this.config.jiraBaseUrl}/rest/api/3/issue/${issueKey}/attachments`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.config.jiraEmail}:${this.config.jiraApiToken}`).toString('base64')}`,
          'X-Atlassian-Token': 'no-check',
        },
        body: formData,
      });
    } catch (err) {
      this.logger.error('Screenshot attachment failed', err);
    }
  }
}
