// src/webhooks/shopify.webhook.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { messageQueue } from '../lib/queue';
import { verifyShopifyWebhook } from '../lib/shopify.security';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export const handleAbandonedCartWebhook = async (req: any, res: Response): Promise<any> => {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const rawId = req.params.merchantId;
  const merchantId = rawId ? rawId.trim() : null; // Clean the ID

  console.log("--- 📥 NEW WEBHOOK ATTEMPT ---");
  console.log("Step 1: ID from URL ->", merchantId);

  try {
    // 🔍 FIX: findFirst use karein safety ke liye
    const merchant = await prisma.merchant.findFirst({
      where: { id: merchantId as string }
    });

    if (!merchant) {
      console.log("❌ Step 2: Merchant NOT FOUND in DB. Looking for ID:", merchantId);
      return res.status(404).send("Merchant not found");
    }

    console.log("✅ Step 2: Merchant Found ->", merchant.brandName);

    if (!merchant.shopifySecret) {
      console.log("❌ Step 3: shopifySecret is MISSING in DB for this merchant!");
      return res.status(401).send("Configuration incomplete: Secret missing");
    }

    // 🛡️ Step 3: Verify HMAC
    const isValid = verifyShopifyWebhook(req.rawBody, hmac, merchant.shopifySecret);
    
    if (!isValid) {
      console.error(`🚨 Step 4: SECURITY ALERT - HMAC MISMATCH for ${merchant.brandName}`);
      return res.status(401).send("Forbidden: Invalid Signature");
    }

    console.log("✅ Step 4: Verification SUCCESS!");

    const shopifyData = req.body;

    // 1. Duplicate Prevention
    const exists = await prisma.abandonedCart.findUnique({
      where: { shopifyCartId: shopifyData.id.toString() }
    });
    if (exists) return res.status(200).send("Already Processed");

    // 2. Fetch Active Flows
    const activeFlows = await prisma.automationFlow.findMany({
      where: {
        merchantId: merchant.id,
        isActive: true,
        type: { startsWith: 'ABANDONED_CART' }
      }
    });

    if (activeFlows.length === 0) {
      console.log("ℹ️ No active flows for this merchant.");
      return res.status(200).send("No Active Flows");
    }

    // 3. Save to Database
    const newCart = await prisma.abandonedCart.create({
      data: {
        merchantId: merchant.id,
        shopifyCartId: shopifyData.id.toString(),
        customerPhone: shopifyData.phone || shopifyData.customer?.phone || "NO_PHONE",
        customerName: shopifyData.customer?.first_name || "Customer",
        cartUrl: shopifyData.abandoned_checkout_url || "",
        totalPrice: parseFloat(shopifyData.total_price || "0"),
      }
    });

    // 4. Queue with Delay
    for (const flow of activeFlows) {
      const trackingUrl = `${BACKEND_URL}/api/tracking/go?m_id=${merchant.id}&type=ABANDONED_CART&url=${encodeURIComponent(newCart.cartUrl)}`;
      const customizedMessage = flow.template
        .replace('{{name}}', newCart.customerName)
        .replace('{{link}}', trackingUrl);

      await messageQueue.add('send-automated-msg', {
        cartId: newCart.id,
        merchantId: merchant.id,
        phone: newCart.customerPhone,
        message: customizedMessage
      }, {
        delay: flow.delayMinutes * 60 * 1000 
      });
    }

    console.log(`🚀 Success: Job queued for ${newCart.customerName}`);
    res.status(200).send("Webhook Processed");

  } catch (error) {
    console.error("💥 Webhook Internal Error:", error);
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