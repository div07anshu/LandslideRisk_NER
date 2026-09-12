import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';

jest.mock('../config/supabaseClient');

const mockGetUser = jest.fn();
(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

let callerRoleResult: { data: unknown; error: unknown };
let logsListResult: { data: unknown; error: unknown; count?: number };
const mockListUsers = jest.fn();

// Records every filter applied to the audit_logs query so tests can assert
// on them without a full fake PostgREST query engine.
const appliedFilters: Record<string, unknown> = {};

function makeAuditLogsBuilder() {
  const builder: Record<string, unknown> = {};

  builder.select = jest.fn(() => builder);
  builder.eq = jest.fn((col: string, val: unknown) => {
    appliedFilters[col] = val;
    return builder;
  });
  builder.gte = jest.fn((col: string, val: unknown) => {
    appliedFilters[`${col}_gte`] = val;
    return builder;
  });
  builder.lte = jest.fn((col: string, val: unknown) => {
    appliedFilters[`${col}_lte`] = val;
    return builder;
  });
  builder.order = jest.fn(() => builder);
  builder.range = jest.fn(() => Promise.resolve(logsListResult));

  return builder;
}

const mockFrom = jest.fn((table: string) => {
  if (table === 'profiles') {
    return {
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn(() => Promise.resolve(callerRoleResult)),
        }),
      }),
    };
  }
  return makeAuditLogsBuilder();
});

(getSupabaseAdminClient as jest.Mock).mockReturnValue({
  from: mockFrom,
  auth: { admin: { listUsers: mockListUsers } },
});

const app = createApp();

function authenticateAsAdmin() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'admin-1', email: 'admin@example.com', role: 'authenticated' } },
    error: null,
  });
  callerRoleResult = { data: { role: 'ADMIN' }, error: null };
}

describe('Admin audit logs — /api/admin/audit-logs', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockClear();
    mockListUsers.mockReset();
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    callerRoleResult = { data: null, error: null };
    logsListResult = { data: [], error: null, count: 0 };
    for (const key of Object.keys(appliedFilters)) delete appliedFilters[key];
  });

  it('1. rejects an unauthenticated request → 401 (audit logs not exposed to unauthorized users)', async () => {
    const res = await request(app).get('/api/admin/audit-logs');
    expect(res.status).toBe(401);
  });

  it('2. rejects a non-admin request → 403 (audit logs not exposed to unauthorized users)', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com', role: 'authenticated' } },
      error: null,
    });
    callerRoleResult = { data: { role: 'FIELD_OFFICER' }, error: null };

    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('3. lists audit logs for an admin, newest first, enriched with actor email', async () => {
    authenticateAsAdmin();
    logsListResult = {
      data: [
        {
          id: 'log-1',
          actor_user_id: 'admin-1',
          action: 'USER_ROLE_CHANGED',
          resource_type: 'user',
          resource_id: 'user-2',
          metadata: { oldRole: 'PUBLIC', newRole: 'ANALYST' },
          created_at: '2024-06-01T00:00:00Z',
        },
      ],
      error: null,
      count: 1,
    };
    mockListUsers.mockResolvedValue({
      data: { users: [{ id: 'admin-1', email: 'admin@example.com', created_at: '2023-01-01T00:00:00Z', last_sign_in_at: null }] },
      error: null,
    });

    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toEqual([
      {
        id: 'log-1',
        actorUserId: 'admin-1',
        actorEmail: 'admin@example.com',
        action: 'USER_ROLE_CHANGED',
        resourceType: 'user',
        resourceId: 'user-2',
        metadata: { oldRole: 'PUBLIC', newRole: 'ANALYST' },
        createdAt: '2024-06-01T00:00:00Z',
      },
    ]);
    expect(res.body.data.total).toBe(1);
  });

  it('4. applies pagination params', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/audit-logs?page=2&pageSize=5')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.page).toBe(2);
    expect(res.body.data.pageSize).toBe(5);
  });

  it('5. filters by action, resourceType, and actorUserId', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/audit-logs?action=RISK_ZONE_DELETED&resourceType=risk_zone&actorUserId=admin-1')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(appliedFilters.action).toBe('RISK_ZONE_DELETED');
    expect(appliedFilters.resource_type).toBe('risk_zone');
    expect(appliedFilters.actor_user_id).toBe('admin-1');
  });

  it('6. filters by date range', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/audit-logs?dateFrom=2024-01-01&dateTo=2024-12-31')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(appliedFilters.created_at_gte).toBe(new Date('2024-01-01').toISOString());
    expect(appliedFilters.created_at_lte).toBe(new Date('2024-12-31').toISOString());
  });

  it('7. rejects an invalid date filter → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/audit-logs?dateFrom=not-a-date')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(422);
  });

  it('8. there is no endpoint to modify or delete an audit log entry', async () => {
    authenticateAsAdmin();

    const patchRes = await request(app)
      .patch('/api/admin/audit-logs/log-1')
      .set('Authorization', 'Bearer valid-token')
      .send({ action: 'TAMPERED' });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete('/api/admin/audit-logs/log-1')
      .set('Authorization', 'Bearer valid-token');
    expect(deleteRes.status).toBe(404);
  });
});
