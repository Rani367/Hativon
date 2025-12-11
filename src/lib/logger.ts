// Simple error logger - outputs JSON in prod for log aggregation

export function logError(
  message: string,
  error?: Error | unknown,
  context?: Record<string, unknown>,
): void {
  const errorInfo: Record<string, unknown> = { ...context };

  if (error instanceof Error) {
    errorInfo.error = error.message;
    errorInfo.stack = error.stack;
  } else if (error) {
    errorInfo.error = String(error);
  }

  if (process.env.NODE_ENV === "development") {
    const contextStr = Object.keys(errorInfo).length
      ? ` ${JSON.stringify(errorInfo)}`
      : "";
    console.error(`[ERROR] ${message}${contextStr}`);
  } else {
    // structured json for prod logging
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: "error",
        message,
        ...errorInfo,
      }),
    );
  }
}
