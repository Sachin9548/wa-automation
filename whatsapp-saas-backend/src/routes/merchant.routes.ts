// src/routes/merchant.routes.ts
import { Router } from 'express';
import { updateOnboardingData, getMe, getMerchantStats, triggerCustomerSync, getMerchantAnalytics, getMerchantConversations, getMerchantMessages, sendMerchantReply } from '../controllers/merchant.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect middleware lagaya hai, bina token ke ye route nahi chalega
router.put('/onboarding', protect, updateOnboardingData);
router.get('/me', protect, getMe);
router.get('/stats', protect, getMerchantStats);
router.post('/sync-customers', protect, triggerCustomerSync);
router.get('/analytics', protect, getMerchantAnalytics);

router.get('/inbox/conversations', protect, getMerchantConversations);
router.get('/inbox/messages/:customerPhone', protect, getMerchantMessages);
router.post('/inbox/send', protect, sendMerchantReply);



export default router;