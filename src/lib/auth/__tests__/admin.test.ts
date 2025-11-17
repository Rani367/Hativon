import { describe, it, expect, vi, beforeEach } from 'vitest';

// We need to test verifyAdminPassword in isolation
// The module reads ADMIN_PASSWORD at import time, so we test with current env value
describe('Admin Authentication', () => {
  describe('verifyAdminPassword', () => {
    // Use the value set in test setup
    const TEST_ADMIN_PASSWORD = 'test-admin-password';

    beforeEach(() => {
      vi.resetModules();
    });

    it('returns true for correct password', async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword(TEST_ADMIN_PASSWORD);

      expect(result).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('wrong-password');

      expect(result).toBe(false);
    });

    it('returns false for empty password input', async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('');

      expect(result).toBe(false);
    });

    it('returns false when ADMIN_PASSWORD env is not set', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      process.env.ADMIN_PASSWORD = '';
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('any-password');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'ADMIN_PASSWORD environment variable is not set'
      );

      consoleErrorSpy.mockRestore();
    });

    it('is case-sensitive', async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('TEST-ADMIN-PASSWORD');

      expect(result).toBe(false);
    });

    it('handles special characters in password', async () => {
      process.env.ADMIN_PASSWORD = 'p@ssw0rd!#$%';
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('p@ssw0rd!#$%');

      expect(result).toBe(true);
    });

    it('rejects partial password match', async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('test-admin');

      expect(result).toBe(false);
    });

    it('rejects password with extra characters', async () => {
      process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('test-admin-password-extra');

      expect(result).toBe(false);
    });

    it('handles whitespace in password correctly', async () => {
      process.env.ADMIN_PASSWORD = ' password with spaces ';
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword(' password with spaces ');

      expect(result).toBe(true);
    });

    it('does not match if whitespace is missing', async () => {
      process.env.ADMIN_PASSWORD = ' password with spaces ';
      const { verifyAdminPassword } = await import('../admin');

      const result = verifyAdminPassword('password with spaces');

      expect(result).toBe(false);
    });
  });
});
