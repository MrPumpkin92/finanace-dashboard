/**
 * Logging Utility
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: unknown;
}

export class Logger {
  private static formatMessage(level: LogLevel, message: string, context?: unknown): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  public static debug(message: string, context?: unknown): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  public static info(message: string, context?: unknown): void {
    console.info(this.formatMessage('info', message, context));
  }

  public static warn(message: string, context?: unknown): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  public static error(message: string, context?: unknown): void {
    console.error(this.formatMessage('error', message, context));
  }
}
