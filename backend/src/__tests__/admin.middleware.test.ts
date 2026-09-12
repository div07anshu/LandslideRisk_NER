import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';

// Mock the centralized Supabase client so tests never touch a real project.
jest.mock('../config/supabaseClient');

const mockGetUser = jest.fn();
(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

const mockMaybeSingle = jest.fn();
(getSupabaseAdminClient as jest.Mock).mockReturnValue({
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      }),
    }),
  }),
});

const app = createApp();

function authenticateAs(role: string | null) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123', email: 'user@example.com', role: 'authenticated' } },
    error: null,
  });
  mockMaybeSingle.mockResolvedValue({ data: role ? { role } : null, error: null });
}

describe('requireAdmin middleware — GET /api/admin/dashboard/stats', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockMaybeSingle.mockReset();
  });

  it('1. rejects an unauthenticated request → 401', async () => {
    const res = await request(app).get('/api/admin/dashboard/stats');

    expect(res.status).toBe(401);
    expect(mockMaybeSingle).not.toHaveBeenCalled();
  });

  it('2. rejects an authenticated PUBLIC user → 403', async () => {
    authenticateAs('PUBLIC');

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.error.message).toMatch(/admin access required/i);
  });

  it('3. rejects an authenticated FIELD_OFFICER user → 403', async () => {
    authenticateAs('FIELD_OFFICER');

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('4. defaults a user with no profile row to PUBLIC → 403', async () => {
    authenticateAs(null);

    const res = await request(app)
      .get('/api/admin/dashboard/stats')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });
});
