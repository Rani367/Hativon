/**
 * Production-ready logging utility
 *
 * Replaces console.log/console.error with structured logging
 * that can be easily integrated with monitoring services
 */

type LogLevel = "error";

interface LogContext {
  [key: string]: unknown;
}

/**
 * Log a message with optional context
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
  // In development, use console for immediate feedback
  if (process.env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    console.error(`[${timestamp}] [ERROR] ${message}${contextStr}`);
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

  // Use console.error to ensure logs are captured by Vercel/monitoring services
  console.error(JSON.stringify(logEntry));
}

/**
 * Log an error message
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: LogContext,
): void {
  const errorContext: LogContext = { ...context };

  if (error instanceof Error) {
    errorContext.error = error.message;
    errorContext.stack = error.stack;
  } else if (error) {
    errorContext.error = String(error);
  }

  log("error", message, errorContext);
}
