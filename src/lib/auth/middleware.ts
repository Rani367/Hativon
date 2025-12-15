import { cookies } from "next/headers";
import { User } from "@/types/user.types";
import { verifyToken } from "./jwt";
import { getUserById } from "../users";
import { isDatabaseAvailable } from "../db/client";

/**
 * Get current user from auth token
 * Returns null if not authenticated or token is invalid
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("authToken");

    if (!authToken?.value) {
      return null;
    }

    const payload = verifyToken(authToken.value);

    if (!payload) {
      return null;
    }

    // Check if this is the legacy admin user
    if (payload.userId === "legacy-admin") {
      // Return mock admin user for legacy mode
      return {
        id: "legacy-admin",
        username: "admin",
        displayName: "Admin",
        email: undefined,
        grade: "ז",
        classNumber: 1,
        isTeacher: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: undefined,
      };
    }

    // Try to fetch fresh user data from database
    // If database is unavailable, fall back to JWT payload to keep user authenticated
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      // Database unavailable - construct user from valid JWT payload
      // This ensures users stay authenticated during temporary DB issues
      return {
        id: payload.userId,
        username: payload.username,
        displayName: payload.username, // Best we can do without DB
        email: undefined,
        grade: undefined,
        classNumber: undefined,
        isTeacher: false, // Conservative default
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: undefined,
      };
    }

    // Fetch fresh user data from database
    const user = await getUserById(payload.userId);

    // If user not found in DB but JWT was valid, they may have been deleted
    // In this case, return null to force re-authentication
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Require authentication for route
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
