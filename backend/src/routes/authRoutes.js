/** Endpoints for administrative access verification and security audit trails. */

import { Router } from 'express';
import { verifyAdmin, getAuditLogs, logAuthAccess } from '../controllers/authController.js';
import { requireAdminAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/auth/verify-admin', verifyAdmin);
router.post('/auth/log-access', logAuthAccess);
router.get('/auth/audit-logs', requireAdminAuth, getAuditLogs);

export default router;
