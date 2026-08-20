// src/webhooks/shopify.webhook.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { messageQueue } from '../lib/queue';
import { verifyShopifyWebhook } from '../lib/shopify.security';

const SKIP_VERIFY = process.env.SKIP_WEBHOOK_VERIFY === 'true';

export const handleAbandonedCartWebhook = async (req: any, res: Response): Promise<any> => {
  const hmac    = req.headers['x-shopify-hmac-sha256'] as string;
  const merchantId = (req.params.merchantId || '').trim();

  console.log(`📥 Shopify webhook | merchant: ${merchantId} | topic: checkouts`);

  try {
    // ── 1. Find merchant ────────────────────────────────────────────────────
    const merchant = await prisma.merchant.findFirst({ where: { id: merchantId } });
    if (!merchant) {
      console.log(`❌ Merchant not found: ${merchantId}`);
      return res.status(404).send('Merchant not found');
    }

    // ── 2. HMAC Verification ────────────────────────────────────────────────
    if (SKIP_VERIFY) {
      console.log(`⚠️ HMAC verification SKIPPED (SKIP_WEBHOOK_VERIFY=true)`);
    } else {
      if (!merchant.shopifySecret) {
        console.error(`❌ shopifySecret missing for merchant: ${merchant.brandName}`);
        return res.status(401).send('Webhook secret not configured');
      }
      if (!req.rawBody) {
        console.error('❌ rawBody missing — middleware issue');
        return res.status(401).send('rawBody not captured');
      }
      const isValid = verifyShopifyWebhook(req.rawBody, hmac, merchant.shopifySecret);
      if (!isValid) {
        console.error(`🚨 HMAC verification failed for merchant: ${merchant.brandName}`);
        return res.status(401).send('Forbidden: Invalid Signature');
      }
      console.log(`✅ HMAC verified for ${merchant.brandName}`);
    }

    // ── 3. Extract data ─────────────────────────────────────────────────────
    const shopifyData = req.body;

    const cartUniqueId = shopifyData.token || (shopifyData.id != null ? String(shopifyData.id) : null);
    if (!cartUniqueId) {
      return res.status(200).send('No cart ID, skipping');
    }

    const customerPhone =
      shopifyData.phone ||
      shopifyData.billing_address?.phone ||
      shopifyData.shipping_address?.phone ||
      shopifyData.customer?.phone ||
      'NO_PHONE';

    const customerName =
      shopifyData.customer?.first_name ||
      shopifyData.billing_address?.first_name ||
      shopifyData.shipping_address?.first_name ||
      'Customer';

    const cartUrl = shopifyData.abandoned_checkout_url || '';

    console.log(`📦 Cart: ${cartUniqueId} | Customer: ${customerName} | Phone: ${customerPhone}`);

    // ── 4. Duplicate check ──────────────────────────────────────────────────
    const existingCart = await prisma.abandonedCart.findUnique({
      where: { shopifyCartId: cartUniqueId }
    });

    if (existingCart) {
      if (existingCart.customerPhone === 'NO_PHONE' && customerPhone !== 'NO_PHONE') {
        console.log(`🔄 Updating cart ${cartUniqueId} with phone: ${customerPhone}`);
        const updatedCart = await prisma.abandonedCart.update({
          where: { shopifyCartId: cartUniqueId },
          data: { customerPhone, customerName, status: 'PENDING' }
        });
        await queueAbandonedCartJobs(merchant, updatedCart, customerPhone);
        return res.status(200).send('Updated & queued');
      }
      console.log(`ℹ️ Cart already exists: ${cartUniqueId}`);
      return res.status(200).send('Already processed');
    }

    // ── 5. Get active flows ─────────────────────────────────────────────────
    const activeFlows = await prisma.automationFlow.findMany({
      where: { merchantId: merchant.id, isActive: true, type: { startsWith: 'ABANDONED_CART' } }
    });

    if (activeFlows.length === 0) {
      console.log(`ℹ️ No active flows for ${merchant.brandName}`);
      return res.status(200).send('No active flows');
    }

    // ── 6. Save cart ────────────────────────────────────────────────────────
    const newCart = await prisma.abandonedCart.create({
      data: {
        merchantId: merchant.id,
        shopifyCartId: cartUniqueId,
        customerPhone,
        customerName,
        cartUrl,
        totalPrice: parseFloat(shopifyData.total_price || '0'),
      }
    });
    console.log(`✅ Cart saved: ${newCart.id}`);

    // ── 7. Queue messages ───────────────────────────────────────────────────
    if (customerPhone !== 'NO_PHONE') {
      const cartWithItems = {
        ...newCart,
        lineItems: shopifyData.line_items
          ? JSON.stringify(shopifyData.line_items.map((li: any) => ({ name: li.title || li.name })))
          : null
      };
      await queueAbandonedCartJobs(merchant, cartWithItems, customerPhone);
    } else {
      console.log(`ℹ️ No phone yet — cart saved, will process on next webhook update`);
    }

    res.status(200).send('Webhook processed');

  } catch (error) {
    console.error('💥 Webhook error:', error);
    res.status(500).send('Internal error');
  }
};

// ── Helper: queue abandoned cart jobs ────────────────────────────────────────
async function queueAbandonedCartJobs(merchant: any, cart: any, phone: string) {
  const activeFlows = await prisma.automationFlow.findMany({
    where: { merchantId: merchant.id, isActive: true, type: { startsWith: 'ABANDONED_CART' } }
  });

  for (const flow of activeFlows) {
    const templateName = (flow as any).metaTemplateName || 'hello_world';
    const productsList = cart.lineItems
      ? JSON.parse(cart.lineItems).map((li: any) => li.name).join(', ')
      : 'your items';

    const variables = templateName === 'hello_world'
      ? []
      : [cart.customerName || 'there', productsList, cart.cartUrl];

    await messageQueue.add('send-automated-msg', {
      cartId: cart.id,
      merchantId: merchant.id,
      phone,
      templateName,
      variables,
    }, {
      delay: flow.delayMinutes * 60 * 1000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 }
    });
    console.log(`✅ Queued: flow=${flow.type} delay=${flow.delayMinutes}min phone=${phone} template=${templateName}`);
  }
}

// ── Order Created Webhook ─────────────────────────────────────────────────────
export const handleOrderCreatedWebhook = async (req: any, res: Response): Promise<any> => {
  const hmac       = req.headers['x-shopify-hmac-sha256'] as string;
  const merchantId = (req.params.merchantId || '').trim();

  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return res.status(404).send('Merchant not found');

    if (!SKIP_VERIFY) {
      if (!merchant.shopifySecret) return res.status(401).send('Unauthorized');
      if (!req.rawBody) return res.status(401).send('rawBody missing');
      const isValid = verifyShopifyWebhook(req.rawBody, hmac, merchant.shopifySecret);
      if (!isValid) return res.status(401).send('Forbidden');
    }

    const orderData  = req.body;
    const phone      = orderData.phone || orderData.customer?.phone || orderData.customer?.default_address?.phone;
    const orderTotal = parseFloat(orderData.total_price || '0');

    console.log(`🛒 Order created | merchant: ${merchant.brandName} | phone: ${phone} | amount: ₹${orderTotal}`);

    if (!phone) return res.status(200).send('No phone, skipping');

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const recentMessage = await prisma.message.findFirst({
      where: { merchantId, customerPhone: phone, direction: 'OUTGOING', timestamp: { gte: fortyEightHoursAgo } }
    });

    if (recentMessage) {
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { totalConverted: { increment: 1 }, recoveredRevenue: { increment: orderTotal } }
      });
      await prisma.abandonedCart.updateMany({
        where: { merchantId, customerPhone: phone, status: 'SENT' },
        data: { status: 'RECOVERED' }
      });
      console.log(`💰 Revenue recovered: ₹${orderTotal} for ${merchant.brandName}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Order webhook error:', error);
    res.status(500).send('Error');
  }
};
