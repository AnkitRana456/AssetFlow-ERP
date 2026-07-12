import { Router } from 'express';
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../controllers/categoryController';
import { authenticate, authorize, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateCategory } from '../validators/orgValidator';
import { UserRole } from '../models/User';

const router = Router();

// Protect all routes: Admin only
router.use(authenticate, checkActive, authorize(UserRole.ADMIN));

router.get('/', getCategories);
router.post('/', validateCategory, validateRequest, createCategory);
router.get('/:id', getCategoryById);
router.patch('/:id', validateCategory, validateRequest, updateCategory);
router.delete('/:id', deleteCategory);

export default router;
