import { Router } from 'express';
import { 
  getDepartments, 
  getDepartmentById, 
  createDepartment, 
  updateDepartment, 
  deleteDepartment 
} from '../controllers/departmentController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateDepartment } from '../validators/orgValidator';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes: Admin only
router.use(authenticate, checkActive, authorize(UserRole.ADMIN));

router.get('/', getDepartments);
router.post('/', validateDepartment, validateRequest, createDepartment);
router.get('/:id', getDepartmentById);
router.patch('/:id', validateDepartment, validateRequest, updateDepartment);
router.delete('/:id', deleteDepartment);

export default router;
