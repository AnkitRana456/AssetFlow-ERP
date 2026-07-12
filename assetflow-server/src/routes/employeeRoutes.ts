import { Router } from 'express';
import { 
  getEmployees, 
  getEmployeeById, 
  updateEmployee, 
  promoteEmployee, 
  updateEmployeeStatus 
} from '../controllers/employeeController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { 
  validateEmployeeUpdate, 
  validateEmployeePromotion, 
  validateEmployeeStatus 
} from '../validators/orgValidator';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes: Admin only
router.use(authenticate, checkActive, authorize(UserRole.ADMIN));

router.get('/', getEmployees);
router.get('/:id', getEmployeeById);
router.patch('/:id', validateEmployeeUpdate, validateRequest, updateEmployee);
router.patch('/promote/:id', validateEmployeePromotion, validateRequest, promoteEmployee);
router.patch('/status/:id', validateEmployeeStatus, validateRequest, updateEmployeeStatus);

export default router;
