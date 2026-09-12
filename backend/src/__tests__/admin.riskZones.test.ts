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
let zonesListResult: { data: unknown; error: unknown; count?: number };
let zoneWriteResult: { data: unknown; error: unknown };

function makeZonesBuilder() {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = jest.fn(chain);
  builder.eq = jest.fn(chain);
  builder.or = jest.fn(chain);
  builder.order = jest.fn(chain);
  builder.range = jest.fn(() => Promise.resolve(zonesListResult));
  builder.insert = jest.fn(chain);
  builder.update = jest.fn(chain);
  builder.delete = jest.fn(chain);
  builder.single = jest.fn(() => Promise.resolve(zoneWriteResult));
  builder.maybeSingle = jest.fn(() => Promise.resolve(zoneWriteResult));

  return builder;
}

let lastZonesBuilder: ReturnType<typeof makeZonesBuilder> | null = null;

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
  lastZonesBuilder = makeZonesBuilder();
  return lastZonesBuilder;
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

describe('Admin risk zones — /api/admin/risk-zones', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockFrom.mockClear();
    callerRoleResult = { data: null, error: null };
    zonesListResult = { data: [], error: null, count: 0 };
    zoneWriteResult = { data: null, error: null };
    (recordAuditLog as jest.Mock).mockReset();
    (recordAuditLog as jest.Mock).mockResolvedValue(true);
  });

  it('1. rejects an unauthenticated request → 401', async () => {
    const res = await request(app).get('/api/admin/risk-zones');
    expect(res.status).toBe(401);
  });

  it('2. rejects a non-admin request → 403', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com', role: 'authenticated' } },
      error: null,
    });
    callerRoleResult = { data: { role: 'PUBLIC' }, error: null };

    const res = await request(app)
      .get('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('3. lists zones for an admin → 200', async () => {
    authenticateAsAdmin();
    zonesListResult = {
      data: [{ id: '1', name: 'Cherrapunji Ridge', risk_level: 'HIGH' }],
      error: null,
      count: 1,
    };

    const res = await request(app)
      .get('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.data.zones).toEqual(zonesListResult.data);
    expect(res.body.data.total).toBe(1);
  });

  it('3b. escapes a search term containing a comma instead of breaking the .or() filter', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/risk-zones?search=' + encodeURIComponent('Kohima, Nagaland'))
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(lastZonesBuilder?.or).toHaveBeenCalledWith(
      'name.ilike."%Kohima, Nagaland%",state.ilike."%Kohima, Nagaland%"',
    );
  });

  it('4. rejects an invalid riskLevel filter → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .get('/api/admin/risk-zones?riskLevel=SEVERE')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(422);
  });

  it('5. rejects creating a zone with no name → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ riskLevel: 'HIGH' });

    expect(res.status).toBe(422);
  });

  it('6. rejects creating a zone with an invalid riskLevel → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Zone', riskLevel: 'SEVERE' });

    expect(res.status).toBe(422);
  });

  it('7. rejects a latitude provided without a longitude → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Zone', riskLevel: 'HIGH', latitude: 25.5 });

    expect(res.status).toBe(422);
    expect(res.body.error.message).toMatch(/together/i);
  });

  it('8. rejects an out-of-range coordinate → 422', async () => {
    authenticateAsAdmin();

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Zone', riskLevel: 'HIGH', latitude: 200, longitude: 90 });

    expect(res.status).toBe(422);
  });

  it('9. creates a valid zone without coordinates → 201', async () => {
    authenticateAsAdmin();
    zoneWriteResult = {
      data: { id: '1', name: 'Test Zone', risk_level: 'HIGH', latitude: null, longitude: null },
      error: null,
    };

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Zone', riskLevel: 'HIGH' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: zoneWriteResult.data });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'RISK_ZONE_CREATED',
        resourceType: 'risk_zone',
        resourceId: '1',
      }),
    );
  });

  it('10. creates a valid zone with real coordinates → 201', async () => {
    authenticateAsAdmin();
    zoneWriteResult = {
      data: { id: '2', name: 'Cherrapunji Ridge', risk_level: 'HIGH', latitude: 25.3, longitude: 91.7 },
      error: null,
    };

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Cherrapunji Ridge', riskLevel: 'HIGH', latitude: 25.3, longitude: 91.7 });

    expect(res.status).toBe(201);
  });

  it('11. updates a zone → 200', async () => {
    authenticateAsAdmin();
    zoneWriteResult = { data: { id: '1', risk_level: 'MODERATE' }, error: null };

    const res = await request(app)
      .patch('/api/admin/risk-zones/1')
      .set('Authorization', 'Bearer valid-token')
      .send({ riskLevel: 'MODERATE' });

    expect(res.status).toBe(200);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'RISK_ZONE_UPDATED',
        resourceType: 'risk_zone',
        resourceId: '1',
        metadata: { changes: { risk_level: 'MODERATE' } },
      }),
    );
  });

  it('12. returns 404 updating a zone that does not exist', async () => {
    authenticateAsAdmin();
    zoneWriteResult = { data: null, error: null };

    const res = await request(app)
      .patch('/api/admin/risk-zones/missing')
      .set('Authorization', 'Bearer valid-token')
      .send({ riskLevel: 'MODERATE' });

    expect(res.status).toBe(404);
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it('13. deletes a zone → 200', async () => {
    authenticateAsAdmin();
    zoneWriteResult = { data: { id: '1', name: 'Test Zone', risk_level: 'HIGH' }, error: null };

    const res = await request(app)
      .delete('/api/admin/risk-zones/1')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'RISK_ZONE_DELETED',
        resourceType: 'risk_zone',
        resourceId: '1',
        metadata: { name: 'Test Zone', riskLevel: 'HIGH' },
      }),
    );
  });

  it('14. returns 404 deleting a zone that does not exist', async () => {
    authenticateAsAdmin();
    zoneWriteResult = { data: null, error: null };

    const res = await request(app)
      .delete('/api/admin/risk-zones/missing')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(404);
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it('15. surfaces auditWarning (without failing) when the audit write fails', async () => {
    authenticateAsAdmin();
    zoneWriteResult = {
      data: { id: '1', name: 'Test Zone', risk_level: 'HIGH', latitude: null, longitude: null },
      error: null,
    };
    (recordAuditLog as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .post('/api/admin/risk-zones')
      .set('Authorization', 'Bearer valid-token')
      .send({ name: 'Test Zone', riskLevel: 'HIGH' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.auditWarning).toBe(true);
  });
});
