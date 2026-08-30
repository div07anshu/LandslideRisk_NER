import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';

// requireAuth talks to Supabase — mock it so tests never hit a real project.
jest.mock('../config/supabaseClient');

const mockGetUser = jest.fn();
const mockInsert = jest.fn();
const mockSelect = jest.fn();

(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

(getSupabaseAdminClient as jest.Mock).mockReturnValue({
  from: jest.fn().mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
  }),
});

// The AI client uses global fetch — mock it so tests never hit FastAPI.
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const app = createApp();

const AUTH = 'Bearer valid-token';
const VALID_BODY = { latitude: 30.7333, longitude: 79.0667 };

const FASTAPI_OK = {
  probability: 0.1234,
  risk_score: 12.34,
  risk_level: 'LOW',
  features: {
    rainfall_24h: 5.2,
    rainfall_48h: 11,
    rainfall_7d: 40.6,
    average_humidity_24h: 82.5,
    soil_moisture: 0.312,
    elevation: 1345,
    slope: 18.44,
  },
};

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

// The error handler logs 5xx via console.error — expected for the failure-path
// cases below; silence it so the test output stays readable.
jest.spyOn(console, 'error').mockImplementation(() => undefined);

beforeEach(() => {
  mockGetUser.mockReset();
  mockFetch.mockReset();
  mockInsert.mockReset();
  mockSelect.mockReset();

  // Default: authenticated user.
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-1', email: 'u@example.com', role: 'authenticated' } },
    error: null,
  });

  // Default: successful database insert.
  mockInsert.mockResolvedValue({
    data: null,
    error: null,
  });

  // Default: successful database select.
  mockSelect.mockReturnValue({
    order: jest.fn().mockResolvedValue({
      data: [],
      error: null,
    }),
  });
});

describe('POST /api/risk/analyze', () => {
  it('missing auth → 401 and never calls FastAPI', async () => {
    const res = await request(app).post('/api/risk/analyze').send(VALID_BODY);

    expect(res.status).toBe(401);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('invalid coordinates → 400 and never calls FastAPI', async () => {
    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send({ latitude: 200, longitude: 79 });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/latitude/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('missing coordinates → 400', async () => {
    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send({});

    expect(res.status).toBe(400);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('successful FastAPI response → 200 with the prediction', async () => {
    mockFetch.mockResolvedValue(jsonResponse(200, FASTAPI_OK));

    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send(VALID_BODY);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: FASTAPI_OK });

    const [calledUrl, init] = mockFetch.mock.calls[0];
    expect(calledUrl).toBe('http://localhost:8000/api/risk/analyze');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(VALID_BODY);
  });

  it('FastAPI 500 → 502 without leaking upstream details', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(500, { detail: 'Risk prediction failed: boom at line 42' }),
    );

    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send(VALID_BODY);

    expect(res.status).toBe(502);
    expect(JSON.stringify(res.body)).not.toMatch(/boom|line 42|Risk prediction failed/);
  });

  it('FastAPI 422 → 502 (contract mismatch, not surfaced to client)', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(422, { detail: [{ loc: ['body', 'latitude'], msg: 'x' }] }),
    );

    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send(VALID_BODY);

    expect(res.status).toBe(502);
  });

  it('FastAPI timeout → 504', async () => {
    mockFetch.mockRejectedValue(
      Object.assign(new Error('The operation was aborted due to timeout'), {
        name: 'TimeoutError',
      }),
    );

    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send(VALID_BODY);

    expect(res.status).toBe(504);
    expect(res.body.error.message).toMatch(/timed out/i);
  });

  it('FastAPI unavailable (connection refused) → 502', async () => {
    mockFetch.mockRejectedValue(
      Object.assign(new TypeError('fetch failed'), {
        cause: { code: 'ECONNREFUSED' },
      }),
    );

    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send(VALID_BODY);

    expect(res.status).toBe(502);
    expect(res.body.error.message).toMatch(/unavailable/i);
  });

  it('malformed FastAPI response → 502', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse(200, { probability: 'not-a-number', risk_level: 'LOW' }),
    );

    const res = await request(app)
      .post('/api/risk/analyze')
      .set('Authorization', AUTH)
      .send(VALID_BODY);

    expect(res.status).toBe(502);
    expect(res.body.error.message).toMatch(/malformed/i);
  });
});
