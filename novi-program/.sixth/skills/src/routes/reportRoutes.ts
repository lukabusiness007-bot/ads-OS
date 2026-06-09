import { Router } from 'express';
import {
  getRevenueReport,
  getAppointmentsSummary,
  getServicesSummary,
  getDashboardStats,
} from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All report routes require authentication
router.use(authMiddleware);

router.get('/revenue', getRevenueReport);
router.get('/appointments-summary', getAppointmentsSummary);
router.get('/services-summary', getServicesSummary);
router.get('/dashboard-stats', getDashboardStats);

export default router;
