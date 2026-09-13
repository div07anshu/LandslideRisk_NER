import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';

// requireAuth talks to Supabase — mock it so tests never hit a real project.
jest.mock('../config/supabaseClient');

const mockGetUser = jest.fn();
const mockIlike = jest.fn();
const mockLimit = jest.fn();
const mockMaybeSingle = jest.fn();

(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

(getSupabaseAdminClient as jest.Mock).mockReturnValue({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnValue({ ilike: mockIlike }),
  })),
});

const app = createApp();
const AUTH = 'Bearer valid-token';

// The error handler logs 5xx via console.error — expected for the
// supabase-error case below; silence it so the test output stays readable.
jest.spyOn(console, 'error').mockImplementation(() => undefined);

beforeEach(() => {
  mockGetUser.mockReset();
  mockIlike.mockReset();
  mockLimit.mockReset();
  mockMaybeSingle.mockReset();

  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1', email: 'u@example.com', role: 'authenticated' } },
    error: null,
  });

  // Chainable: .ilike('District', ..).ilike('State', ..)?.limit(1).maybeSingle()
  mockIlike.mockReturnValue({ ilike: mockIlike, limit: mockLimit });
  mockLimit.mockReturnValue({ maybeSingle: mockMaybeSingle });
});

describe('GET /api/risk/district-details', () => {
  it('missing auth → 401', async () => {
    const res = await request(app).get('/api/risk/district-details?district=Anjaw');
    expect(res.status).toBe(401);
  });

  it('missing district query param → 400', async () => {
    const res = await request(app)
      .get('/api/risk/district-details')
      .set('Authorization', AUTH);

    expect(res.status).toBe(400);
  });

  it('found → 200 with the matching row', async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { District: 'Anjaw', State: 'Arunachal Pradesh', Population: 21167 },
      error: null,
    });

    const res = await request(app)
      .get('/api/risk/district-details?district=Anjaw')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: { District: 'Anjaw', State: 'Arunachal Pradesh', Population: 21167 },
    });
    expect(mockIlike).toHaveBeenCalledWith('District', 'Anjaw');
  });

  it('state query param also filters by State', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    await request(app)
      .get('/api/risk/district-details?district=Anjaw&state=Arunachal+Pradesh')
      .set('Authorization', AUTH);

    expect(mockIlike).toHaveBeenCalledWith('District', 'Anjaw');
    expect(mockIlike).toHaveBeenCalledWith('State', 'Arunachal Pradesh');
  });

  it('no match → 200 with null data', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null });

    const res = await request(app)
      .get('/api/risk/district-details?district=Nowhere')
      .set('Authorization', AUTH);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: null });
  });

  it('supabase error → 5xx', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('boom') });

    const res = await request(app)
      .get('/api/risk/district-details?district=Anjaw')
      .set('Authorization', AUTH);

    expect(res.status).toBeGreaterThanOrEqual(500);
  });
});
