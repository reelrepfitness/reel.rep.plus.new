/**
 * Production-safe logging utility
 * Logs only in development mode, silent in production
 */

const isDevelopment = __DEV__;

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix;
  }

  private formatMessage(level: LogLevel, ...args: any[]): any[] {
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}]` : '';
    return [`[${timestamp}]${prefixStr}[${level.toUpperCase()}]`, ...args];
  }

  log(...args: any[]) {
    if (isDevelopment) {
      console.log(...this.formatMessage('log', ...args));
    }
  }

  info(...args: any[]) {
    if (isDevelopment) {
      console.info(...this.formatMessage('info', ...args));
    }
  }

  warn(...args: any[]) {
    if (isDevelopment) {
      console.warn(...this.formatMessage('warn', ...args));
    }
  }

  error(...args: any[]) {
    // Always log errors, even in production (can integrate with error tracking service)
    console.error(...this.formatMessage('error', ...args));

    // TODO: In production, send to error tracking service (Sentry, etc.)
    // if (!isDevelopment) {
    //   sendToErrorTracking(args);
    // }
  }

  debug(...args: any[]) {
    if (isDevelopment) {
      console.debug(...this.formatMessage('debug', ...args));
    }
  }
}

// Create module-specific loggers
export const createLogger = (moduleName: string) => new Logger(moduleName);

// Default logger
export const logger = new Logger();

// Convenience exports
export default logger;
