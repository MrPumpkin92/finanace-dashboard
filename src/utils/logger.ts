/**
 * Logging Utility
 */

import pino from 'pino';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const baseLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
});

export class Logger {
  public static debug(message: string, context?: unknown): void {
    baseLogger.debug(context ?? {}, message);
  }

  public static info(message: string, context?: unknown): void {
    baseLogger.info(context ?? {}, message);
  }

  public static warn(message: string, context?: unknown): void {
    baseLogger.warn(context ?? {}, message);
  }

  public static error(message: string, context?: unknown): void {
    baseLogger.error(context ?? {}, message);
  }
}
