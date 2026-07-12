import { Router } from 'express';
import { 
  getBookings, 
  getBookingCalendar, 
  getResourceAvailability, 
  getBookingHistory, 
  getBookingById, 
  createBooking, 
  updateBooking, 
  rescheduleBooking, 
  deleteBooking 
} from '../controllers/bookingController';
import { authenticate, checkActive } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validationMiddleware';
import { validateBooking, validateReschedule } from '../validators/bookingValidator';

const router = Router();

// Secure all booking paths with standard auth check
router.use(authenticate, checkActive);

router.get('/', getBookings);
router.get('/calendar', getBookingCalendar);
router.get('/availability', getResourceAvailability);
router.get('/history', getBookingHistory);

router.post('/', validateBooking, validateRequest, createBooking);
router.post('/reschedule', validateReschedule, validateRequest, rescheduleBooking);

router.get('/:id', getBookingById);
router.patch('/:id', validateBooking, validateRequest, updateBooking);
router.delete('/:id', deleteBooking);

export default router;
