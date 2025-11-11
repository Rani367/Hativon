/**
 * Production-ready logging utility
 *
 * Replaces console.log/console.error with structured logging
 * that can be easily integrated with monitoring services
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log a message with optional context
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  // In development, use console for immediate feedback
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';

    switch (level) {
      case 'error':
        console.error(`[${timestamp}] [ERROR] ${message}${contextStr}`);
        break;
      case 'warn':
        console.warn(`[${timestamp}] [WARN] ${message}${contextStr}`);
        break;
      case 'info':
        console.log(`[${timestamp}] [INFO] ${message}${contextStr}`);
        break;
    }
    return;
  }

  // In production, structure logs for monitoring services
  // This can be easily integrated with services like Datadog, Sentry, etc.
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };

  // For now, use console.error for all levels in production
  // This ensures logs are captured by Vercel/monitoring services
  console.error(JSON.stringify(logEntry));
}

/**
 * Log an error message
 */
export function logError(message: string, error?: Error | unknown, context?: LogContext): void {
  const errorContext: LogContext = { ...context };

  if (error instanceof Error) {
    errorContext.error = error.message;
    errorContext.stack = error.stack;
  } else if (error) {
    errorContext.error = String(error);
  }

  log('error', message, errorContext);
}

/**
 * Log a warning message
 */
export function logWarn(message: string, context?: LogContext): void {
  log('warn', message, context);
}

/**
 * Log an info message
 */
export function logInfo(message: string, context?: LogContext): void {
  log('info', message, context);
}

/**
 * Default export for convenience
 */
export const logger = {
  error: logError,
  warn: logWarn,
  info: logInfo,
};
