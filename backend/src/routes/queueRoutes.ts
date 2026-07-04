import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  createQueue,
  listQueues,
  getQueue,
  pauseResumeQueue,
} from '../controllers/queueController';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('ADMIN', 'ANALYST'), createQueue);
router.get('/', listQueues);
router.get('/:id', getQueue);
router.patch('/:id/status', requireRole('ADMIN', 'ANALYST'), pauseResumeQueue);

export default router;
