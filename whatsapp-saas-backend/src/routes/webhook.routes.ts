import { Router } from 'express';
import { handleAbandonedCartWebhook, handleOrderCreatedWebhook } from '../webhooks/shopify.webhook';

const router = Router();

router.post('/shopify/cart-abandoned/:merchantId', handleAbandonedCartWebhook);

router.post('/shopify/order-created/:merchantId', handleOrderCreatedWebhook);

export default router;