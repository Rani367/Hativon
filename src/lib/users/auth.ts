import type { User } from '@/types/user.types';
import bcrypt from 'bcryptjs';
import { getUserWithPassword } from './queries';

/**
 * Validate user credentials (username + password)
 * Used during login to authenticate users
 *
 * @param username - Username to validate
 * @param password - Plain text password to check
 * @returns User object if credentials are valid, null otherwise
 */
export async function validatePassword(
  username: string,
  password: string
): Promise<User | null> {
  const user = await getUserWithPassword(username);

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return null;
  }

  // Remove password hash before returning user object
  const { passwordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
