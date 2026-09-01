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

    // ── 4. Parse line items from payload ───────────────────────────────────
    const lineItemsJson = shopifyData.line_items && shopifyData.line_items.length > 0
      ? JSON.stringify(shopifyData.line_items.map((li: any) => ({
          name: li.title || li.name || li.product_title || 'Product',
          quantity: li.quantity || 1,
          price: li.price || '0',
          image: li.featured_image?.url || li.image_url || null,
          variantTitle: li.variant_title || null,
        })))
      : null;

    // ── 5. Duplicate check ──────────────────────────────────────────────────
    const existingCart = await prisma.abandonedCart.findUnique({
      where: { shopifyCartId: cartUniqueId }
    });

    if (existingCart) {
      if (existingCart.customerPhone === 'NO_PHONE' && customerPhone !== 'NO_PHONE') {
        console.log(`🔄 Updating cart ${cartUniqueId} with phone: ${customerPhone}`);
        const updatedCart = await prisma.abandonedCart.update({
          where: { shopifyCartId: cartUniqueId },
          data: {
            customerPhone,
            customerName,
            status: 'PENDING',
            // Also update lineItems if we now have them
            ...(lineItemsJson && { lineItems: lineItemsJson }),
          }
        });
        await queueAbandonedCartJobs(merchant, updatedCart, customerPhone);
        return res.status(200).send('Updated & queued');
      }

      // If lineItems were missing before, update them now
      if (!existingCart.lineItems && lineItemsJson) {
        await prisma.abandonedCart.update({
          where: { shopifyCartId: cartUniqueId },
          data: { lineItems: lineItemsJson }
        });
        console.log(`ℹ️ Updated lineItems for existing cart: ${cartUniqueId}`);
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

    // ── 7. Save cart ────────────────────────────────────────────────────────
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
          lineItems: lineItemsJson,   // ← save product details
        }
      });
      console.log(`✅ Cart saved: ${newCart.id} | Products: ${lineItemsJson ? JSON.parse(lineItemsJson).map((li: any) => li.name).join(', ') : 'none'}`);
    } catch (e: any) {
      if (e.code === 'P2002') {
        // Race condition — another request already saved this cart
        console.log(`ℹ️ Cart race condition — already saved by parallel request: ${cartUniqueId}`);
        return res.status(200).send('Already processed');
      }
      throw e;
    }

    // ── 8. Queue messages ───────────────────────────────────────────────────
    if (customerPhone !== 'NO_PHONE') {
      // Mark customer as hasAbandonedCart
      await prisma.customer.updateMany({
        where: { merchantId: merchant.id, phone: customerPhone },
        data: { hasAbandonedCart: true }
      });

      // newCart already has lineItems saved in DB — pass directly
      await queueAbandonedCartJobs(merchant, newCart, customerPhone);
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

  // ── Build products string from lineItems ─────────────────────────────────
  let productsList = 'your items';  // fallback
  let firstProductName = 'your item';
  let totalItems = 0;

  if (cart.lineItems) {
    try {
      const items: Array<{ name: string; quantity?: number; price?: string; variantTitle?: string }> = JSON.parse(cart.lineItems);
      if (Array.isArray(items) && items.length > 0) {
        totalItems = items.reduce((sum, li) => sum + (li.quantity || 1), 0);
        firstProductName = items[0].name || 'your item';

        // Rich format: "Nike Air Max (x2), Adidas Socks (x1)"
        productsList = items
          .filter(li => li.name)
          .map(li => {
            const qty = li.quantity && li.quantity > 1 ? ` (x${li.quantity})` : '';
            const variant = li.variantTitle ? ` - ${li.variantTitle}` : '';
            return `${li.name}${variant}${qty}`;
          })
          .join(', ');

        if (!productsList) productsList = 'your items';

        console.log(`🛍️ Products in cart: ${productsList}`);
      }
    } catch (e) {
      console.warn('⚠️ Could not parse lineItems JSON:', e);
    }
  }

  for (const flow of activeFlows) {
    const templateName = (flow as any).metaTemplateName || 'hello_world';
    const templateLang = (flow as any).metaTemplateLang || 'en_US';
    const discountCode = (flow as any).discountCode || null;

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
      : (cart.cartUrl || '');

    // ── Build template variables ─────────────────────────────────────────
    // Standard mapping (matches most approved templates):
    // {{1}} = customer name
    // {{2}} = product name / products list
    // {{3}} = tracking URL (for button or inline)
    // {{4}} = discount code (optional)
    const variables = templateName === 'hello_world'
      ? []
      : [
          cart.customerName || 'there',          // {{1}} name
          productsList,                           // {{2}} products
          trackingUrl,                            // {{3}} link
          ...(discountCode ? [discountCode] : []) // {{4}} discount (only if set)
        ];

    console.log(`📤 Template variables: [${variables.join(' | ')}]`);

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

    console.log(`✅ Queued: flow=${flow.type} delay=${flow.delayMinutes}min phone=${phone} template=${templateName} products="${productsList}" discount=${discountCode || 'none'}`);
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
    const phone      = orderData.phone
      || orderData.customer?.phone
      || orderData.customer?.default_address?.phone
      || orderData.billing_address?.phone
      || orderData.shipping_address?.phone;
    const orderTotal = parseFloat(orderData.total_price || '0');
    const orderNumber = orderData.name || orderData.order_number || String(orderData.id);

    // ── Extract purchased product names from line_items ───────────────────
    let purchasedProductName = 'your recent purchase';
    let purchasedProductsList = 'your recent items';
    if (orderData.line_items && orderData.line_items.length > 0) {
      const items = orderData.line_items.map((li: any) =>
        li.title || li.name || li.product_title || 'Product'
      );
      purchasedProductName  = items[0];
      purchasedProductsList = items.join(', ');
    }

    console.log(`🛒 Order created | merchant: ${merchant.brandName} | order: ${orderNumber} | phone: ${phone} | amount: ₹${orderTotal} | products: ${purchasedProductsList}`);

    if (!phone) return res.status(200).send('No phone, skipping');

    // ── Mark customer as hasPlacedOrder ───────────────────────────────────
    await prisma.customer.updateMany({
      where: { merchantId, phone: { contains: phone.slice(-10) } },
      data: { hasPlacedOrder: true }
    });

    // ── Recovery tracking: did our message lead to this order? ────────────
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
      await (prisma as any).trackingLink.updateMany({
        where: { merchantId, customerPhone: phone, converted: false },
        data: { converted: true, convertedAt: new Date(), convertedRevenue: orderTotal }
      });
      console.log(`💰 Revenue recovered: ₹${orderTotal} for ${merchant.brandName}`);
    }

    // ── POST_PURCHASE_UPSELL flow ─────────────────────────────────────────
    // Check if merchant has an active upsell flow configured
    const upsellFlow = await prisma.automationFlow.findFirst({
      where: { merchantId, type: 'POST_PURCHASE_UPSELL', isActive: true }
    });

    if (upsellFlow && upsellFlow.metaTemplateName) {
      // Skip if this customer got an upsell message in the last 7 days (avoid spam)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentUpsell = await prisma.message.findFirst({
        where: {
          merchantId,
          customerPhone: phone,
          direction:     'OUTGOING',
          templateName:  upsellFlow.metaTemplateName,
          timestamp:     { gte: sevenDaysAgo },
        }
      });

      if (recentUpsell) {
        console.log(`ℹ️ Upsell skipped — already sent to ${phone} within 7 days`);
      } else {
        // Build tracking link for store URL
        const backendUrl  = process.env.BACKEND_URL || 'https://api.wautomation.shop';
        const storeUrl    = merchant.storeUrl || '';
        const discountCode = upsellFlow.discountCode || null;

        let trackingLink: any = null;
        if (storeUrl) {
          trackingLink = await (prisma as any).trackingLink.create({
            data: {
              merchantId,
              customerPhone: phone,
              originalUrl:   storeUrl,
              discountCode,
            }
          });
        }

        const trackingUrl = trackingLink
          ? `${backendUrl}/api/tracking/click/${trackingLink.id}`
          : storeUrl;

        // Template variables:
        // {{1}} = customer first name
        // {{2}} = purchased product name (what they just bought)
        // {{3}} = store/collection URL
        // {{4}} = discount code (if set)
        const customerName = orderData.customer?.first_name
          || orderData.billing_address?.first_name
          || 'there';

        const variables = [
          customerName,             // {{1}} name
          purchasedProductName,     // {{2}} product they bought
          trackingUrl,              // {{3}} store link
          ...(discountCode ? [discountCode] : []),  // {{4}} discount
        ];

        await messageQueue.add('send-automated-msg', {
          // Use cartId as null — this is not a cart, it's a post-purchase upsell
          cartId:         null,
          merchantId,
          phone,
          templateName:   upsellFlow.metaTemplateName,
          templateLang:   upsellFlow.metaTemplateLang || 'en_US',
          discountCode,
          trackingLinkId: trackingLink?.id,
          variables,
          // Tag for activity tracking
          jobType:        'POST_PURCHASE_UPSELL',
        }, {
          delay:    upsellFlow.delayMinutes * 60 * 1000,
          attempts: 2,
          backoff:  { type: 'exponential', delay: 60000 },
        });

        console.log(`🎁 Upsell queued: ${phone} | template: ${upsellFlow.metaTemplateName} | delay: ${upsellFlow.delayMinutes}min | product: ${purchasedProductName} | discount: ${discountCode || 'none'}`);
      }
    }

    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Order webhook error:', error);
    res.status(500).send('Error');
  }
};
