import { NextResponse } from "next/server";

/**
 * Create a standardized error response
 * Only exposes error details in development mode for security
 */
export function createErrorResponse(
  message: string,
  error: unknown,
  status: number = 500
): NextResponse {
  const isDev = process.env.NODE_ENV === "development";
  const details = error instanceof Error ? error.message : String(error);

  return NextResponse.json(
    { error: message, ...(isDev && { details }) },
    { status }
  );
}
