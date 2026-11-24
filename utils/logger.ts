/* eslint-disable no-console */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LEVEL_LABEL: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  private readonly context: string;

  constructor(context: string) {
    this.context = context;
  }

  static create(context: string): Logger {
    return new Logger(context);
  }

  static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  static getLogLevel(): LogLevel {
    return Logger.logLevel;
  }

  private write(level: LogLevel, msg: string, error?: unknown): void {
    if (level < Logger.logLevel) return;
    const label = LEVEL_LABEL[level];
    if (process.env.CI) {
      const entry: Record<string, unknown> = {
        ts: new Date().toISOString(),
        level: label,
        ctx: this.context,
        msg,
      };
      if (error !== undefined) entry.error = error instanceof Error ? error.message : String(error);
      console.info(JSON.stringify(entry));
    } else {
      const ts = new Date().toISOString();
      console.info(`${ts} [${label}] [${this.context}] ${msg}`);
    }
  }

  debug(msg: string): void {
    this.write(LogLevel.DEBUG, msg);
  }

  info(msg: string): void {
    this.write(LogLevel.INFO, msg);
  }

  warn(msg: string): void {
    this.write(LogLevel.WARN, msg);
  }

  error(msg: string, error?: unknown): void {
    this.write(LogLevel.ERROR, msg, error);
  }

  step(n: number, description: string): void {
    this.info(`Step ${n}: ${description}`);
  }

  testStart(name: string): void {
    this.info(`► ${name}`);
  }

  testEnd(name: string): void {
    this.info(`✓ ${name}`);
  }
}
