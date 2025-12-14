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

    // Check if database is available
    const dbAvailable = await isDatabaseAvailable();
    if (!dbAvailable) {
      return null;
    }

    // Fetch fresh user data from database
    const user = await getUserById(payload.userId);

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
