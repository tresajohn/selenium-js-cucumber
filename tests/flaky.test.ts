import { FlakyFormatter } from '../utils/flakyFormatter';
import { IFormatterOptions } from '@cucumber/cucumber';

function test_flaky_formatter_exports_class() {
  if (typeof FlakyFormatter !== 'function') throw new Error('FlakyFormatter not a class');
  console.log('PASS: FlakyFormatter exported');
}

function makeFormatterStub(): IFormatterOptions {
  return {
    eventBroadcaster: { on: () => {} },
    parsedArgvOptions: {},
    cleanup: async () => {},
    log: () => {},
    colorFns: {} as IFormatterOptions['colorFns'],
    cwd: process.cwd(),
    eventDataCollector: {
      getTestCaseAttempts: () => [],
    } as unknown as IFormatterOptions['eventDataCollector'],
    snippetBuilder: {} as IFormatterOptions['snippetBuilder'],
    stream: process.stdout as unknown as IFormatterOptions['stream'],
    supportCodeLibrary: {} as IFormatterOptions['supportCodeLibrary'],
  } as unknown as IFormatterOptions;
}

function test_threshold_default_is_010() {
  delete process.env.FLAKY_THRESHOLD;
  const f = new FlakyFormatter(makeFormatterStub());
  if ((f as unknown as Record<string, unknown>).threshold !== 0.1)
    throw new Error(`Expected 0.10 got ${(f as unknown as Record<string, unknown>).threshold}`);
  console.log('PASS: threshold default 0.10');
}

test_flaky_formatter_exports_class();
test_threshold_default_is_010();
