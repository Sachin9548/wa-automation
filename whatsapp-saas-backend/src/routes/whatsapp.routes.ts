// src/routes/whatsapp.routes.ts
import { Router } from 'express';
import { getWhatsAppStatus } from '../controllers/whatsapp.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.get('/status', protect, getWhatsAppStatus);

export default router;