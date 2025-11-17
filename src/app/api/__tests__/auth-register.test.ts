import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { User } from '@/types/user.types';

// Mock dependencies before importing
vi.mock('@/lib/users', () => ({
  createUser: vi.fn(),
  usernameExists: vi.fn(),
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

import { POST } from '@/app/api/auth/register/route';
import { createUser, usernameExists } from '@/lib/users';
import { createAuthCookie } from '@/lib/auth/jwt';
import { isDatabaseAvailable } from '@/lib/db/client';

const mockUser: User = {
  id: 'user-123',
  username: 'newuser',
  displayName: 'New User',
  email: undefined,
  grade: 'ח',
  classNumber: 2,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const createRequest = (body: Record<string, unknown>): NextRequest => {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const validRegistrationData = {
  username: 'newuser',
  password: 'password123',
  displayName: 'New User',
  grade: 'ח',
  classNumber: 2,
};

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isDatabaseAvailable).mockResolvedValue(true);
    vi.mocked(usernameExists).mockResolvedValue(false);
    vi.mocked(createUser).mockResolvedValue(mockUser);
    vi.mocked(createAuthCookie).mockReturnValue('authToken=test; HttpOnly');
  });

  describe('Database Availability', () => {
    it('returns 503 when database is not available', async () => {
      vi.mocked(isDatabaseAvailable).mockResolvedValue(false);

      const request = createRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.success).toBe(false);
      expect(data.message).toContain('מקומי');
    });
  });

  describe('Validation', () => {
    it('returns 400 when username is missing', async () => {
      const request = createRequest({
        password: 'password123',
        displayName: 'User',
        grade: 'ח',
        classNumber: 2,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when password is missing', async () => {
      const request = createRequest({
        username: 'newuser',
        displayName: 'User',
        grade: 'ח',
        classNumber: 2,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when displayName is missing', async () => {
      const request = createRequest({
        username: 'newuser',
        password: 'password123',
        grade: 'ח',
        classNumber: 2,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when grade is missing', async () => {
      const request = createRequest({
        username: 'newuser',
        password: 'password123',
        displayName: 'User',
        classNumber: 2,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 when classNumber is missing', async () => {
      const request = createRequest({
        username: 'newuser',
        password: 'password123',
        displayName: 'User',
        grade: 'ח',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Username Validation', () => {
    it('returns 400 for username shorter than 3 characters', async () => {
      const request = createRequest({
        ...validRegistrationData,
        username: 'ab',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('3-50');
    });

    it('returns 400 for username with special characters', async () => {
      const request = createRequest({
        ...validRegistrationData,
        username: 'user@name',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for username with spaces', async () => {
      const request = createRequest({
        ...validRegistrationData,
        username: 'user name',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('accepts username with underscores', async () => {
      const request = createRequest({
        ...validRegistrationData,
        username: 'user_name_123',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts username with numbers', async () => {
      const request = createRequest({
        ...validRegistrationData,
        username: 'user123',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Password Validation', () => {
    it('returns 400 for password shorter than 8 characters', async () => {
      const request = createRequest({
        ...validRegistrationData,
        password: '1234567',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toContain('8');
    });

    it('accepts password exactly 8 characters', async () => {
      const request = createRequest({
        ...validRegistrationData,
        password: '12345678',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });
  });

  describe('Grade Validation', () => {
    it('accepts valid grade ז', async () => {
      const request = createRequest({
        ...validRegistrationData,
        grade: 'ז',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts valid grade ח', async () => {
      const request = createRequest({
        ...validRegistrationData,
        grade: 'ח',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts valid grade ט', async () => {
      const request = createRequest({
        ...validRegistrationData,
        grade: 'ט',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts valid grade י', async () => {
      const request = createRequest({
        ...validRegistrationData,
        grade: 'י',
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('returns 400 for invalid grade', async () => {
      const request = createRequest({
        ...validRegistrationData,
        grade: 'א',
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Class Number Validation', () => {
    it('accepts valid class number 1', async () => {
      const request = createRequest({
        ...validRegistrationData,
        classNumber: 1,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('accepts valid class number 4', async () => {
      const request = createRequest({
        ...validRegistrationData,
        classNumber: 4,
      });

      const response = await POST(request);

      expect(response.status).toBe(201);
    });

    it('returns 400 for class number 0', async () => {
      const request = createRequest({
        ...validRegistrationData,
        classNumber: 0,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('returns 400 for class number 5', async () => {
      const request = createRequest({
        ...validRegistrationData,
        classNumber: 5,
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe('Duplicate Username', () => {
    it('returns 409 when username already exists', async () => {
      vi.mocked(usernameExists).mockResolvedValue(true);

      const request = createRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.message).toContain('קיים');
    });
  });

  describe('Successful Registration', () => {
    it('returns 201 with user data', async () => {
      const request = createRequest(validRegistrationData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.user).toEqual(mockUser);
    });

    it('sets auth cookie in response headers', async () => {
      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.headers.get('Set-Cookie')).toBe(
        'authToken=test; HttpOnly'
      );
    });

    it('calls createUser with registration data', async () => {
      const request = createRequest(validRegistrationData);
      await POST(request);

      expect(createUser).toHaveBeenCalledWith(validRegistrationData);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 on unexpected error', async () => {
      vi.mocked(createUser).mockRejectedValue(new Error('Database error'));

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it('returns 409 when createUser throws duplicate error', async () => {
      vi.mocked(createUser).mockRejectedValue(
        new Error('שם המשתמש כבר קיים במערכת')
      );

      const request = createRequest(validRegistrationData);
      const response = await POST(request);

      expect(response.status).toBe(409);
    });
  });
});
