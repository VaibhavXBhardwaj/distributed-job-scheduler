import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  createJob,
  listJobs,
  getJob,
  cancelJob,
} from '../controllers/jobController';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('ADMIN', 'ANALYST'), createJob);
router.get('/', listJobs);
router.get('/:id', getJob);
router.patch('/:id/cancel', requireRole('ADMIN', 'ANALYST'), cancelJob);

export default router;
