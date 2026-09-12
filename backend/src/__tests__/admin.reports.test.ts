import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';
import { recordAuditLog } from '../services/auditLogService';

// Mock the centralized Supabase client so tests never touch a real project.
jest.mock('../config/supabaseClient');
// Audit writes are tested in isolation here (call args), not via a real
// insert — see admin.auditLogs.test.ts for the read side.
jest.mock('../services/auditLogService');

const mockGetUser = jest.fn();
(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

// A minimal chainable query-builder stub. Each method returns `this` so
// arbitrary chains (`.select().eq().ilike().order().range()`) resolve, and
// the terminal value is read via whichever method ends the chain.
function makeQueryBuilder(result: { data: unknown; error: unknown; count?: number }) {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = jest.fn(chain);
  builder.eq = jest.fn(chain);
  builder.ilike = jest.fn(chain);
  builder.or = jest.fn(chain);
  builder.order = jest.fn(chain);
  builder.range = jest.fn(() => Promise.resolve(result));
  builder.limit = jest.fn(() => Promise.resolve(result));
  builder.maybeSingle = jest.fn(() => Promise.resolve(result));
  builder.update = jest.fn(chain);

  return builder;
}

let reportsResult: { data: unknown; error: unknown; count?: number };
let riskDataResult: { data: unknown; error: unknown };
let profilesResult: { data: { role: string } | null; error: unknown };

const mockFrom = jest.fn((table: string) => {
  if (table === 'profiles') return makeQueryBuilder(profilesResult);
  if (table === 'risk_data') return makeQueryBuilder(riskDataResult);
  return makeQueryBuilder(reportsResult);
});

(getSupabaseAdminClient as jest.Mock).mockReturnValue({
  from: mockFrom,
});

const app = createApp();

function authenticateAsAdmin() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'admin-1', email: 'admin@example.com', role: 'authenticated' } },
    error: null,
  });
  profilesResult = { data: { role: 'ADMIN' }, error: null };
}

describe('Admin report moderation — /api/admin/reports', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockClear();
    reportsResult = { data: [], error: null, count: 0 };
    riskDataResult = { data: [], error: null };
    profilesResult = { data: null, error: null };
    (recordAuditLog as jest.Mock).mockReset();
    (recordAuditLog as jest.Mock).mockResolvedValue(true);
  });

  it('1. rejects an unauthenticated request → 401', async () => {
    const res = await request(app).get('/api/admin/reports');
    expect(res.status).toBe(401);
  });

  it('2. rejects a non-admin request → 403', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com', role: 'authenticated' } },
      error: null,
    });
    profilesResult = { data: { role: 'PUBLIC' }, error: null };

    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('3. lists reports for an admin → 200 with envelope', async () => {
    authenticateAsAdmin();
    reportsResult = {
      data: [{ id: '1', title: 'Road crack', location: 'Kohima', status: 'PENDING' }],
      error: null,
      count: 1,
    };

    const res = await request(app)
      .get('/api/admin/reports')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      data: {
        reports: reportsResult.data,
        page: 1,
        pageSize: 10,
        total: 1,
      },
    });
  });

  it('4. rejects an invalid status filter → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/reports?status=VERIFIED')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/PENDING, INVESTIGATING, RESOLVED/);
  });

  it('5. rejects an invalid status on PATCH .../status → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .patch('/api/admin/reports/1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'REJECTED' });

    expect(res.status).toBe(422);
  });

  it('6. updates status to a valid value → 200', async () => {
    authenticateAsAdmin();
    reportsResult = {
      data: { id: '1', title: 'Road crack', status: 'INVESTIGATING' },
      error: null,
    };

    const res = await request(app)
      .patch('/api/admin/reports/1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'INVESTIGATING' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: reportsResult.data });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'REPORT_STATUS_CHANGED',
        resourceType: 'report',
        resourceId: '1',
        metadata: expect.objectContaining({ newStatus: 'INVESTIGATING' }),
      }),
    );
  });

  it('7. returns 404 when updating a report that does not exist', async () => {
    authenticateAsAdmin();
    reportsResult = { data: null, error: null };

    const res = await request(app)
      .patch('/api/admin/reports/missing/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(404);
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it('7b. surfaces auditWarning (without failing) when the audit write fails', async () => {
    authenticateAsAdmin();
    reportsResult = {
      data: { id: '1', title: 'Road crack', status: 'RESOLVED' },
      error: null,
    };
    (recordAuditLog as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .patch('/api/admin/reports/1/status')
      .set('Authorization', 'Bearer valid-token')
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.auditWarning).toBe(true);
  });

  it('8. returns a report with a best-effort risk_data match', async () => {
    authenticateAsAdmin();
    reportsResult = {
      data: { id: '1', title: 'Road crack', location: 'Kohima', status: 'PENDING' },
      error: null,
    };
    riskDataResult = { data: [{ Location: 'Kohima', Risk_level: 'HIGH' }], error: null };

    const res = await request(app)
      .get('/api/admin/reports/1')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.report).toEqual(reportsResult.data);
    expect(res.body.data.riskData).toEqual({ Location: 'Kohima', Risk_level: 'HIGH' });
  });

  it('9. returns 404 for a report id that does not exist', async () => {
    authenticateAsAdmin();
    reportsResult = { data: null, error: null };

    const res = await request(app)
      .get('/api/admin/reports/missing')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(404);
  });
});
