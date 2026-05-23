// src/webhooks/shopify.webhook.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { messageQueue } from '../lib/queue';
import { verifyShopifyWebhook } from '../lib/shopify.security';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export const handleAbandonedCartWebhook = async (req: any, res: Response): Promise<any> => {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const merchantId = req.params.merchantId;
  const shopifyData = req.body; // 👈 DEFINED NOW

  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    
    // Security Check
    if (!merchant || !merchant.shopifySecret) return res.status(401).send("Unauthorized");

    // 🛡️ Verification (Using req.rawBody)
    const isValid = verifyShopifyWebhook(req.rawBody, hmac, merchant.shopifySecret);
    if (!isValid) return res.status(401).send("Signature Mismatch");

    // 1. Duplicate Prevention (Checkout ID unique hona chahiye)
    const exists = await prisma.abandonedCart.findUnique({
      where: { shopifyCartId: shopifyData.id.toString() }
    });
    if (exists) return res.status(200).send("Already Processed");

    // 2. Fetch Active Flows
    const activeFlows = await prisma.automationFlow.findMany({
      where: {
        merchantId: merchantId,
        isActive: true,
        type: { startsWith: 'ABANDONED_CART' }
      }
    });

    if (activeFlows.length === 0) return res.status(200).send("No Active Flows");

    // 3. Save to Database
    const newCart = await prisma.abandonedCart.create({
      data: {
        merchantId,
        shopifyCartId: shopifyData.id.toString(),
        customerPhone: shopifyData.phone || shopifyData.customer?.phone || "NO_PHONE",
        customerName: shopifyData.customer?.first_name || "Customer",
        cartUrl: shopifyData.abandoned_checkout_url || "",
        totalPrice: parseFloat(shopifyData.total_price || "0"),
      }
    });

    // 4. Queue with Delay
    for (const flow of activeFlows) {
      const trackingUrl = `${BACKEND_URL}/api/tracking/go?m_id=${merchantId}&type=ABANDONED_CART&url=${encodeURIComponent(newCart.cartUrl)}`;
      const customizedMessage = flow.template
        .replace('{{name}}', newCart.customerName)
        .replace('{{link}}', trackingUrl);

      await messageQueue.add('send-automated-msg', {
        cartId: newCart.id,
        merchantId: merchantId,
        phone: newCart.customerPhone,
        message: customizedMessage
      }, {
        delay: flow.delayMinutes * 60 * 1000 
      });
    }

    res.status(200).send("Webhook Processed");
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Internal Error");
  }
};

export const handleOrderCreatedWebhook = async (req: any, res: Response): Promise<any> => {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const orderData = req.body;
  const merchantId = req.params.merchantId;

  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || !merchant.shopifySecret) return res.status(401).send("Unauthorized");

    // 🛡️ SECURITY FIX: Order webhook ko bhi verify karna zaruri hai
    const isValid = verifyShopifyWebhook(req.rawBody, hmac, merchant.shopifySecret);
    if (!isValid) return res.status(401).send("Forbidden");

    const customerPhone = orderData.phone || orderData.customer?.phone || orderData.customer?.default_address?.phone;
    if (!customerPhone) return res.status(200).send("No phone, skipping");

    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const recentMessage = await prisma.message.findFirst({
      where: {
        merchantId,
        customerPhone,
        direction: "OUTGOING",
        timestamp: { gte: fortyEightHoursAgo }
      }
    });

    if (recentMessage) {
      const orderAmount = parseFloat(orderData.total_price);
      await prisma.merchant.update({
        where: { id: merchantId },
        data: {
          totalConverted: { increment: 1 },
          recoveredRevenue: { increment: orderAmount }
        }
      });
      console.log(`💰 REVENUE MATCHED: ₹${orderAmount}`);
    }

    res.status(200).send("Webhook Processed");
  } catch (error) {
    res.status(500).send("Error");
  }
};