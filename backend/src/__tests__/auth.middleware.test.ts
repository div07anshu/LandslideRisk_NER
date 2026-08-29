import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient } from '../config/supabaseClient';

// Mock the centralized Supabase client so tests never touch a real project.
jest.mock('../config/supabaseClient');

const mockGetUser = jest.fn();
(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

const app = createApp();

describe('requireAuth middleware — GET /api/auth/me', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
  });

  it('1. rejects a request with no Authorization header → 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/authorization header/i);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('2. rejects a malformed Authorization header → 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Token abc.def.ghi');

    expect(res.status).toBe(401);
    expect(mockGetUser).not.toHaveBeenCalled();
  });

  it('3. rejects an invalid / expired token → 401', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'invalid JWT', status: 401 },
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid or expired/i);
    expect(mockGetUser).toHaveBeenCalledWith('invalid-token');
  });

  it('4. allows a valid authenticated request → 200 with basic user info', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'authenticated',
          // extra fields that must NOT be exposed
          app_metadata: { provider: 'email' },
          user_metadata: { secret: 'nope' },
        },
      },
      error: null,
    });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      user: { id: 'user-123', email: 'user@example.com' },
    });
    expect(mockGetUser).toHaveBeenCalledWith('valid-token');
  });
});
