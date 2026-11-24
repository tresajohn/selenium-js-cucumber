import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import Formatter, { IFormatterOptions } from '@cucumber/cucumber/lib/formatter';
import { Envelope } from '@cucumber/messages';

interface FlakyTest {
  title: string;
  feature: string;
  passedOnAttempt: number;
}

interface StartedEntry {
  attempt: number;
  testCaseId: string;
}

export class FlakyFormatter extends Formatter {
  private threshold: number;
  private startedById = new Map<string, StartedEntry>();
  private retriedIds = new Set<string>();
  private flakyTests: FlakyTest[] = [];
  private totalTests = 0;

  constructor(options: IFormatterOptions) {
    super(options);
    this.threshold = parseFloat(process.env.FLAKY_THRESHOLD ?? '0.10');

    options.eventBroadcaster.on('envelope', (envelope: Envelope) => {
      if (envelope.testCaseStarted) {
        const { id, testCaseId, attempt } = envelope.testCaseStarted;
        this.startedById.set(id, { attempt, testCaseId });
      }

      if (envelope.testCaseFinished) {
        const { testCaseStartedId, willBeRetried } = envelope.testCaseFinished;
        const entry = this.startedById.get(testCaseStartedId);
        if (!entry) return;

        if (willBeRetried) {
          this.retriedIds.add(entry.testCaseId);
        } else {
          this.totalTests++;
          if (this.retriedIds.has(entry.testCaseId) && entry.attempt > 0) {
            const testCase = this.eventDataCollector
              .getTestCaseAttempts()
              .find((a) => a.testCase.id === entry.testCaseId);
            const title = testCase?.pickle?.name ?? entry.testCaseId;
            const feature = testCase?.pickle?.uri ?? '';
            this.flakyTests.push({ title, feature, passedOnAttempt: entry.attempt + 1 });
          }
          this.retriedIds.delete(entry.testCaseId);
        }
      }

      if (envelope.testRunFinished) {
        this._writeReport();
      }
    });
  }

  private _writeReport(): void {
    const flakyCount = this.flakyTests.length;
    const flakyRate = this.totalTests > 0 ? flakyCount / this.totalTests : 0;
    const thresholdExceeded = flakyRate > this.threshold;

    const report = {
      runDate: new Date().toISOString(),
      totalTests: this.totalTests,
      flakyCount,
      flakyRate: parseFloat(flakyRate.toFixed(4)),
      threshold: this.threshold,
      thresholdExceeded,
      flakyTests: this.flakyTests,
    };

    const dir = join(process.cwd(), 'test-results');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'flaky-report.json'), JSON.stringify(report, null, 2));

    if (thresholdExceeded) {
      process.exitCode = 1;
    }
  }
}
