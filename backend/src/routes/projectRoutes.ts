import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import {
  createProject,
  listProjects,
  getProject,
  deleteProject,
} from '../controllers/projectController';

const router = Router();

router.use(authenticate);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.delete('/:id', requireRole('ADMIN'), deleteProject);

export default router;
