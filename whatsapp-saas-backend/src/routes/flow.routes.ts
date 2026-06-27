// src/routes/flow.routes.ts
import { Router } from 'express';
import { getFlows, saveFlow, toggleFlow } from '../controllers/flow.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.use(protect);

router.get('/', getFlows);
router.post('/', saveFlow);       // Frontend POST /api/flows
router.post('/save', saveFlow);   // Legacy alias POST /api/flows/save
router.put('/:flowId/toggle', toggleFlow);

export default router;