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
      // Shopify signs webhooks using the App's Client Secret (shpss_...)
      // NOT the webhook signing secret shown in Settings → Notifications
      const signingSecret = (merchant as any).shopifyClientSecret || merchant.shopifySecret;

      if (!signingSecret) {
        console.error(`❌ No signing secret for merchant: ${merchant.brandName}. Set shopifyClientSecret in credentials.`);
        return res.status(401).send('Signing secret not configured');
      }
      if (!req.rawBody) {
        console.error('❌ rawBody missing');
        return res.status(401).send('rawBody not captured');
      }

      const crypto = require('crypto');
      const rawBodyStr = req.rawBody.toString('utf8');
      const computed = crypto
        .createHmac('sha256', signingSecret)
        .update(req.rawBody)
        .digest('base64');

      console.log(`🔐 Verifying HMAC for ${merchant.brandName}...`);

      const isValid = verifyShopifyWebhook(req.rawBody, hmac, signingSecret);
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
        // Pass line items from current payload
        const cartWithItems = {
          ...updatedCart,
          lineItems: shopifyData.line_items
            ? JSON.stringify(shopifyData.line_items.map((li: any) => ({ name: li.title || li.name })))
            : null
        };
        await queueAbandonedCartJobs(merchant, cartWithItems, customerPhone);
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
    let newCart;
    try {
      newCart = await prisma.abandonedCart.create({
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
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Race condition — another request already saved this cart
        console.log(`ℹ️ Cart race condition — already saved by parallel request: ${cartUniqueId}`);
        return res.status(200).send('Already processed');
      }
      throw e;
    }

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
    const templateLang = (flow as any).metaTemplateLang || 'en_US';
    const discountCode = (flow as any).discountCode || null;

    // Extract product names from line items
    let productsList = 'items in your cart';
    if (cart.lineItems) {
      try {
        const items = JSON.parse(cart.lineItems);
        if (Array.isArray(items) && items.length > 0) {
          productsList = items.map((li: any) => li.name).filter(Boolean).join(', ');
        }
      } catch { /* keep default */ }
    }

    // Create tracking link — customer clicks this, we record it, then redirect
    const backendUrl = process.env.BACKEND_URL || 'https://api.wautomation.shop';
    let trackingLink: any = null;

    if (cart.cartUrl) {
      trackingLink = await (prisma as any).trackingLink.create({
        data: {
          merchantId: merchant.id,
          customerPhone: phone,
          originalUrl: cart.cartUrl,
          discountCode: discountCode,
        }
      });
    }

    const trackingUrl = trackingLink
      ? `${backendUrl}/api/tracking/click/${trackingLink.id}`
      : cart.cartUrl;

    // Template variables: {{1}}=name, {{2}}=products, {{3}}=tracking_url
    const variables = templateName === 'hello_world'
      ? []
      : [cart.customerName || 'there', productsList, trackingUrl];

    await messageQueue.add('send-automated-msg', {
      cartId: cart.id,
      merchantId: merchant.id,
      phone,
      templateName,
      templateLang,
      discountCode,
      trackingLinkId: trackingLink?.id,
      variables,
    }, {
      delay: flow.delayMinutes * 60 * 1000,
      attempts: 3,
      backoff: { type: 'exponential', delay: 60000 }
    });
    console.log(`✅ Queued: flow=${flow.type} delay=${flow.delayMinutes}min phone=${phone} template=${templateName} discount=${discountCode || 'none'}`);
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
      const signingSecret = (merchant as any).shopifyClientSecret || merchant.shopifySecret;
      if (!signingSecret) return res.status(401).send('Signing secret not configured');
      if (!req.rawBody) return res.status(401).send('rawBody missing');
      const isValid = verifyShopifyWebhook(req.rawBody, hmac, signingSecret);
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

      // Mark abandoned cart as recovered
      await prisma.abandonedCart.updateMany({
        where: { merchantId, customerPhone: phone, status: 'SENT' },
        data: { status: 'RECOVERED' }
      });

      // Mark tracking link as converted with revenue
      await (prisma as any).trackingLink.updateMany({
        where: { merchantId, customerPhone: phone, converted: false },
        data: { converted: true, convertedAt: new Date(), convertedRevenue: orderTotal }
      });

      console.log(`💰 Revenue recovered: ₹${orderTotal} for ${merchant.brandName}`);
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Order webhook error:', error);
    res.status(500).send('Error');
  }
};
