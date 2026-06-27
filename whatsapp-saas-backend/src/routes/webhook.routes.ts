import { Router } from 'express';
import { handleAbandonedCartWebhook, handleOrderCreatedWebhook } from '../webhooks/shopify.webhook';

const router = Router();

router.post('/shopify/cart-abandoned/:merchantId', handleAbandonedCartWebhook);   // legacy
router.post('/shopify/abandoned-cart/:merchantId', handleAbandonedCartWebhook);  // Shopify's actual URL

router.post('/shopify/order-created/:merchantId', handleOrderCreatedWebhook);

export default router;