import request from 'supertest';
import { createApp } from '../app';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabaseClient';
import { recordAuditLog } from '../services/auditLogService';

// Mock the centralized Supabase client so tests never touch a real project.
jest.mock('../config/supabaseClient');
jest.mock('../services/auditLogService');

const mockGetUser = jest.fn();
(getSupabaseClient as jest.Mock).mockReturnValue({
  auth: { getUser: mockGetUser },
});

let profilesSelectResult: { data: unknown; error: unknown };
// Role lookup for the AUTHENTICATED CALLER, read by requireAdmin via
// profileService's `.select('role')` — independent of the target user below.
let callerRoleResult: { data: unknown; error: unknown };
// Profile lookup for the TARGET user being modified, read inside
// updateUserRole via `.select('id, role')`.
let targetProfileResult: { data: unknown; error: unknown };
let adminCountResult: { data: unknown; error: unknown; count?: number };
let profileUpdateResult: { data: unknown; error: unknown };

// `.from('profiles')` is called for several different purposes across a
// single request (caller role check, bulk select, target lookup, count,
// update) — dispatch by the exact select() column list, since call order
// isn't reliable across requireAdmin + the controller.
const mockFrom = jest.fn(() => {
  const builder: Record<string, unknown> = {};

  builder.select = jest.fn((columns: string, opts?: { count?: string; head?: boolean }) => {
    if (opts?.head) {
      return { eq: jest.fn(() => Promise.resolve(adminCountResult)) };
    }
    if (columns === 'role') {
      return { eq: jest.fn(() => ({ maybeSingle: jest.fn(() => Promise.resolve(callerRoleResult)) })) };
    }
    if (columns === 'id, role') {
      return {
        eq: jest.fn(() => ({ maybeSingle: jest.fn(() => Promise.resolve(targetProfileResult)) })),
      };
    }
    // bulk listing select('id, role, created_at')
    return Promise.resolve(profilesSelectResult);
  });

  builder.update = jest.fn(() => ({
    eq: jest.fn(() => ({
      select: jest.fn(() => ({
        maybeSingle: jest.fn(() => Promise.resolve(profileUpdateResult)),
      })),
    })),
  }));

  return builder;
});

const mockListUsers = jest.fn();

(getSupabaseAdminClient as jest.Mock).mockReturnValue({
  from: mockFrom,
  auth: { admin: { listUsers: mockListUsers } },
});

const app = createApp();

function authenticateAs(userId: string, role: string) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: userId, email: 'caller@example.com', role: 'authenticated' } },
    error: null,
  });
  callerRoleResult = { data: { role }, error: null };
}

describe('Admin user management — /api/admin/users', () => {
  beforeEach(() => {
    mockGetUser.mockReset();
    mockListUsers.mockReset();
    mockFrom.mockClear();
    profilesSelectResult = { data: [], error: null };
    callerRoleResult = { data: null, error: null };
    targetProfileResult = { data: null, error: null };
    adminCountResult = { data: null, error: null, count: 0 };
    profileUpdateResult = { data: null, error: null };
    mockListUsers.mockResolvedValue({ data: { users: [] }, error: null });
    (recordAuditLog as jest.Mock).mockReset();
    (recordAuditLog as jest.Mock).mockResolvedValue(true);
  });

  it('1. rejects an unauthenticated request → 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('2. rejects a non-admin request → 403', async () => {
    authenticateAs('user-1', 'PUBLIC');

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
  });

  it('3. lists users for an admin, merging profiles + auth metadata → 200', async () => {
    authenticateAs('admin-1', 'ADMIN');
    profilesSelectResult = {
      data: [{ id: 'user-2', role: 'FIELD_OFFICER', created_at: '2024-01-01T00:00:00Z' }],
      error: null,
    };
    mockListUsers.mockResolvedValue({
      data: {
        users: [
          {
            id: 'user-2',
            email: 'officer@example.com',
            created_at: '2024-01-01T00:00:00Z',
            last_sign_in_at: '2024-02-01T00:00:00Z',
          },
        ],
      },
      error: null,
    });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toEqual([
      {
        id: 'user-2',
        email: 'officer@example.com',
        role: 'FIELD_OFFICER',
        createdAt: '2024-01-01T00:00:00Z',
        lastSignInAt: '2024-02-01T00:00:00Z',
      },
    ]);
    expect(res.body.data.total).toBe(1);
  });

  it('4. rejects an invalid role filter → 422', async () => {
    authenticateAs('admin-1', 'ADMIN');

    const res = await request(app)
      .get('/api/admin/users?role=SUPERUSER')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(422);
  });

  it('5. rejects an invalid role on PATCH .../role → 422', async () => {
    authenticateAs('admin-1', 'ADMIN');

    const res = await request(app)
      .patch('/api/admin/users/user-2/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'SUPERUSER' });

    expect(res.status).toBe(422);
  });

  it('6. successfully changes another user\'s role → 200', async () => {
    authenticateAs('admin-1', 'ADMIN');
    targetProfileResult = { data: { id: 'user-2', role: 'PUBLIC' }, error: null };
    profileUpdateResult = {
      data: { id: 'user-2', role: 'ANALYST', updated_at: '2024-03-01T00:00:00Z' },
      error: null,
    };

    const res = await request(app)
      .patch('/api/admin/users/user-2/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'ANALYST' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, data: profileUpdateResult.data });
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'admin-1',
        action: 'USER_ROLE_CHANGED',
        resourceType: 'user',
        resourceId: 'user-2',
        metadata: { oldRole: 'PUBLIC', newRole: 'ANALYST' },
      }),
    );
  });

  it('6b. surfaces auditWarning (without failing) when the audit write fails', async () => {
    authenticateAs('admin-1', 'ADMIN');
    targetProfileResult = { data: { id: 'user-2', role: 'PUBLIC' }, error: null };
    profileUpdateResult = {
      data: { id: 'user-2', role: 'ANALYST', updated_at: '2024-03-01T00:00:00Z' },
      error: null,
    };
    (recordAuditLog as jest.Mock).mockResolvedValue(false);

    const res = await request(app)
      .patch('/api/admin/users/user-2/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'ANALYST' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.auditWarning).toBe(true);
  });

  it('7. rejects an admin changing their own role → 403', async () => {
    authenticateAs('admin-1', 'ADMIN');

    const res = await request(app)
      .patch('/api/admin/users/admin-1/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'PUBLIC' });

    expect(res.status).toBe(403);
    expect(recordAuditLog).not.toHaveBeenCalled();
  });

  it('8. returns 404 when the target user has no profile', async () => {
    authenticateAs('admin-1', 'ADMIN');
    targetProfileResult = { data: null, error: null };

    const res = await request(app)
      .patch('/api/admin/users/missing-user/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'PUBLIC' });

    expect(res.status).toBe(404);
  });

  it('9. refuses to demote the last remaining ADMIN → 409', async () => {
    authenticateAs('admin-1', 'ADMIN');
    targetProfileResult = { data: { id: 'user-2', role: 'ADMIN' }, error: null };
    adminCountResult = { data: null, error: null, count: 1 };

    const res = await request(app)
      .patch('/api/admin/users/user-2/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'PUBLIC' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/at least one ADMIN must remain/i);
  });

  it('10. allows demoting an ADMIN when other admins remain', async () => {
    authenticateAs('admin-1', 'ADMIN');
    targetProfileResult = { data: { id: 'user-2', role: 'ADMIN' }, error: null };
    adminCountResult = { data: null, error: null, count: 2 };
    profileUpdateResult = {
      data: { id: 'user-2', role: 'PUBLIC', updated_at: '2024-03-01T00:00:00Z' },
      error: null,
    };

    const res = await request(app)
      .patch('/api/admin/users/user-2/role')
      .set('Authorization', 'Bearer valid-token')
      .send({ role: 'PUBLIC' });

    expect(res.status).toBe(200);
  });
});
