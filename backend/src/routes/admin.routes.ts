import { Router } from 'express';
import { getDashboardStats } from '../controllers/adminController';
import {
  listReports,
  getReportById,
  updateReportStatus,
} from '../controllers/adminReportsController';
import { listUsers, updateUserRole } from '../controllers/adminUsersController';
import {
  listRiskZones,
  createRiskZone,
  updateRiskZone,
  deleteRiskZone,
} from '../controllers/adminRiskZonesController';
import { getRiskConfig, updateRiskConfig } from '../controllers/adminRiskConfigController';
import { listAuditLogs } from '../controllers/adminAuditLogsController';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = Router();

// Every admin route requires a valid session AND the ADMIN role — checked
// server-side on each request, independent of any frontend gating.
router.use(requireAuth, requireAdmin);

router.get('/dashboard/stats', getDashboardStats);

router.get('/reports', listReports);
router.get('/reports/:id', getReportById);
router.patch('/reports/:id/status', updateReportStatus);

router.get('/users', listUsers);
router.patch('/users/:id/role', updateUserRole);

router.get('/risk-zones', listRiskZones);
router.post('/risk-zones', createRiskZone);
router.patch('/risk-zones/:id', updateRiskZone);
router.delete('/risk-zones/:id', deleteRiskZone);

router.get('/risk-config', getRiskConfig);
router.put('/risk-config', updateRiskConfig);

// Read-only by design — see adminAuditLogsController.ts. No POST/PATCH/DELETE
// route exists for audit_logs anywhere in this API.
router.get('/audit-logs', listAuditLogs);

export default router;
