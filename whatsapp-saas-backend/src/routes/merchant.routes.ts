// src/routes/merchant.routes.ts
import { Router } from 'express';
import { updateOnboardingData , getMe, getMerchantStats} from '../controllers/merchant.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect middleware lagaya hai, bina token ke ye route nahi chalega
router.put('/onboarding', protect, updateOnboardingData);
router.get('/me', protect, getMe);
router.get('/stats', protect, getMerchantStats);

export default router;