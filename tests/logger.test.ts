import { Logger, LogLevel } from '../utils/logger';

function capture(fn: () => void): string {
  const lines: string[] = [];
  const orig = console.info;
  console.info = (s: string) => lines.push(s);
  fn();
  console.info = orig;
  return lines.join('\n');
}

function test_pretty_format_outside_ci() {
  const orig = process.env.CI;
  delete process.env.CI;
  const logger = Logger.create('TestCtx');
  const out = capture(() => logger.info('hello'));
  if (!out.includes('[INFO]') || !out.includes('[TestCtx]') || !out.includes('hello'))
    throw new Error(`Pretty format failed: ${out}`);
  if (orig !== undefined) process.env.CI = orig;
  console.log('PASS: pretty format');
}

function test_json_format_in_ci() {
  process.env.CI = 'true';
  const logger = Logger.create('TestCtx');
  const out = capture(() => logger.info('hello'));
  const parsed = JSON.parse(out);
  if (parsed.level !== 'INFO' || parsed.ctx !== 'TestCtx' || parsed.msg !== 'hello')
    throw new Error(`JSON format failed: ${out}`);
  delete process.env.CI;
  console.log('PASS: CI JSON format');
}

function test_level_filter() {
  Logger.setLogLevel(LogLevel.WARN);
  const logger = Logger.create('TestCtx');
  const out = capture(() => {
    logger.debug('skip');
    logger.info('skip');
    logger.warn('keep');
  });
  if (out.includes('skip') || !out.includes('keep')) throw new Error(`Level filter failed: ${out}`);
  Logger.setLogLevel(LogLevel.INFO);
  console.log('PASS: level filter');
}

function test_empty_string_ci_uses_pretty() {
  process.env.CI = '';
  const logger = Logger.create('TestCtx');
  const out = capture(() => logger.info('hello'));
  if (out.startsWith('{')) throw new Error(`CI="" should produce pretty format, got: ${out}`);
  delete process.env.CI;
  console.log('PASS: CI="" uses pretty format');
}

test_pretty_format_outside_ci();
test_json_format_in_ci();
test_level_filter();
test_empty_string_ci_uses_pretty();
