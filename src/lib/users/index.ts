/**
 * User management module
 *
 * This module provides a complete API for managing user accounts including:
 * - User CRUD operations (create, read, update, delete)
 * - Query functions (get users, check username availability)
 * - Authentication (password validation)
 * - Session management (last login tracking)
 *
 * All exports are organized into focused submodules for maintainability.
 */

// Query functions
export {
  getUserById,
  getUserByUsername,
  getAllUsers,
  usernameExists,
} from './queries';

// CRUD operations
export {
  createUser,
  updateUser,
  updateLastLogin,
  deleteUser,
} from './storage';

// Authentication
export {
  validatePassword,
} from './auth';
