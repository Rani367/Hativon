import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { User } from '@/types/user.types';

// Mock dependencies before importing
vi.mock('@/lib/users', () => ({
  validatePassword: vi.fn(),
  updateLastLogin: vi.fn(),
}));

vi.mock('@/lib/auth/jwt', () => ({
  createAuthCookie: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logError: vi.fn(),
}));

import { POST } from '@/app/api/auth/login/route';
import { validatePassword, updateLastLogin } from '@/lib/users';
import { createAuthCookie } from '@/lib/auth/jwt';
import { isDatabaseAvailable } from '@/lib/db/client';

const mockUser: User = {
  id: 'user-123',
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  grade: 'ח',
  classNumber: 2,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const createRequest = (body: Record<string, unknown>): NextRequest => {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isDatabaseAvailable).mockResolvedValue(true);
    vi.mocked(createAuthCookie).mockReturnValue('authToken=test; HttpOnly');
  });

  describe('Validation', () => {
    it('returns 400 when username is missing', async () => {
      const request = createRequest({ password: 'password123' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('שם משתמש');
    });

    it('returns 400 when password is missing', async () => {
      const request = createRequest({ username: 'testuser' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('סיסמה');
    });

    it('returns 400 when both fields are missing', async () => {
      const request = createRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for empty username', async () => {
      const request = createRequest({ username: '', password: 'password123' });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for empty password', async () => {
      const request = createRequest({ username: 'testuser', password: '' });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Database Authentication', () => {
    it('returns 200 with user data for valid credentials', async () => {
      vi.mocked(validatePassword).mockResolvedValue(mockUser);

      const request = createRequest({
        username: 'testuser',
        password: 'correctpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
    });

    it('sets auth cookie in response headers', async () => {
      vi.mocked(validatePassword).mockResolvedValue(mockUser);

      const request = createRequest({
        username: 'testuser',
        password: 'correctpassword',
      });

      const response = await POST(request);

      expect(response.headers.get('Set-Cookie')).toBe(
        'authToken=test; HttpOnly'
      );
    });

    it('updates last login timestamp', async () => {
      vi.mocked(validatePassword).mockResolvedValue(mockUser);

      const request = createRequest({
        username: 'testuser',
        password: 'correctpassword',
      });

      await POST(request);

      expect(updateLastLogin).toHaveBeenCalledWith('user-123');
    });

    it('returns 401 for invalid credentials', async () => {
      vi.mocked(validatePassword).mockResolvedValue(null);

      const request = createRequest({
        username: 'testuser',
        password: 'wrongpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('שגויים');
    });

    it('returns 401 for non-existent user', async () => {
      vi.mocked(validatePassword).mockResolvedValue(null);

      const request = createRequest({
        username: 'nonexistent',
        password: 'anypassword',
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });
  });

  describe('Legacy Admin Mode', () => {
    beforeEach(() => {
      vi.mocked(isDatabaseAvailable).mockResolvedValue(false);
      process.env.ADMIN_PASSWORD = 'admin123';
    });

    it('returns 200 for admin credentials in legacy mode', async () => {
      const request = createRequest({
        username: 'admin',
        password: 'admin123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.id).toBe('legacy-admin');
      expect(data.user.username).toBe('admin');
    });

    it('returns 401 for wrong admin password', async () => {
      const request = createRequest({
        username: 'admin',
        password: 'wrongpassword',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('returns 401 for non-admin username', async () => {
      const request = createRequest({
        username: 'notadmin',
        password: 'admin123',
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('returns 503 when ADMIN_PASSWORD is not set', async () => {
      process.env.ADMIN_PASSWORD = '';

      const request = createRequest({
        username: 'admin',
        password: 'anypassword',
      });

      const response = await POST(request);

      expect(response.status).toBe(503);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on unexpected error', async () => {
      vi.mocked(validatePassword).mockRejectedValue(new Error('Database error'));

      const request = createRequest({
        username: 'testuser',
        password: 'password123',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });

    it('handles JSON parse error gracefully', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/auth/login',
        {
          method: 'POST',
          body: 'invalid-json',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
