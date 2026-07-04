import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { rateLimit } from '../middleware/rateLimit';
import {
  createJob,
  listJobs,
  getJob,
  cancelJob,
} from '../controllers/jobController';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole('ADMIN', 'ANALYST'),
  rateLimit({ windowSeconds: 60, maxRequests: 30 }),
  createJob
);
router.get('/', listJobs);
router.get('/:id', getJob);
router.patch('/:id/cancel', requireRole('ADMIN', 'ANALYST'), cancelJob);

export default router;
