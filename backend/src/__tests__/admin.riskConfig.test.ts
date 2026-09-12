import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';
import { recordAuditLog } from '../services/auditLogService';

jest.mock('../config/supabaseClient');
jest.mock('../services/auditLogService');

const mockGetUser = jest.fn();
(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

let callerRoleResult: { data: unknown; error: unknown };
let riskConfigReadResult: { data: unknown; error: unknown };
let riskConfigUpsertResult: { data: unknown; error: unknown };

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

  // risk_config
  return {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        maybeSingle: jest.fn(() => Promise.resolve(riskConfigReadResult)),
      }),
    }),
    upsert: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        single: jest.fn(() => Promise.resolve(riskConfigUpsertResult)),
      }),
    }),
  };
});

(getSupabaseAdminClient as jest.Mock).mockReturnValue({ from: mockFrom });

const app = createApp();

function authenticateAsAdmin() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'admin-1', email: 'admin@example.com', role: 'authenticated' } },
    error: null,
  });
  callerRoleResult = { data: { role: 'ADMIN' }, error: null };
}

describe('Admin risk configuration — /api/admin/risk-config', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockClear();
    callerRoleResult = { data: null, error: null };
    riskConfigReadResult = { data: null, error: null };
    riskConfigUpsertResult = { data: null, error: null };
    (recordAuditLog as jest.Mock).mockReset();
    (recordAuditLog as jest.Mock).mockResolvedValue(true);
  });

  it('1. rejects an unauthenticated request → 401', async () => {
    const res = await request(app).get('/api/admin/risk-config');
    expect(res.status).toBe(401);
  });

  it('2. rejects a non-admin request → 403', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com', role: 'authenticated' } },
      error: null,
    });
    callerRoleResult = { data: { role: 'PUBLIC' }, error: null };

    const res = await request(app)
      .get('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('3. returns defaults (35/70) when no config row exists yet', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: { lowMax: 35, moderateMax: 70 } });
  });

  it('4. returns the saved thresholds when a config row exists', async () => {
    authenticateAsAdmin();
    riskConfigReadResult = { data: { low_max: 30, moderate_max: 65 }, error: null };

    const res = await request(app)
      .get('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ lowMax: 30, moderateMax: 65 });
  });

  it('5. rejects non-numeric thresholds → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .put('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token')
      .send({ lowMax: 'low', moderateMax: 70 });

    expect(res.status).toBe(422);
  });

  it('6. rejects lowMax >= moderateMax → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .put('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token')
      .send({ lowMax: 80, moderateMax: 70 });

    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/lowMax must be less than moderateMax/i);
  });

  it('7. rejects an out-of-range threshold → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .put('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token')
      .send({ lowMax: 35, moderateMax: 150 });

    expect(res.status).toBe(422);
  });

  it('8. accepts a valid update → 200', async () => {
    authenticateAsAdmin();
    riskConfigUpsertResult = {
      data: { low_max: 40, moderate_max: 75, updated_at: '2024-05-01T00:00:00Z' },
      error: null,
    };

    const res = await request(app)
      .put('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token')
      .send({ lowMax: 40, moderateMax: 75 });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      lowMax: 40,
      moderateMax: 75,
      updatedAt: '2024-05-01T00:00:00Z',
    });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'RISK_CONFIG_UPDATED',
        resourceType: 'risk_config',
        resourceId: '1',
        metadata: expect.objectContaining({ newLowMax: 40, newModerateMax: 75 }),
      }),
    );
  });

  it('9. surfaces auditWarning (without failing) when the audit write fails', async () => {
    authenticateAsAdmin();
    riskConfigUpsertResult = {
      data: { low_max: 40, moderate_max: 75, updated_at: '2024-05-01T00:00:00Z' },
      error: null,
    };
    (recordAuditLog as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .put('/api/admin/risk-config')
      .set('Authorization', 'Bearer valid-token')
      .send({ lowMax: 40, moderateMax: 75 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.auditWarning).toBe(true);
  });
});
