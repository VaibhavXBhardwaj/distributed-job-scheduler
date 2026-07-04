import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { registerWorker, heartbeat, claimJob } from '../controllers/workerController';

const router = Router();

router.use(authenticate);

router.post('/', registerWorker);
router.post('/:id/heartbeat', heartbeat);
router.post('/claim', claimJob);

export default router;
