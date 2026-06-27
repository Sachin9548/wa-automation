// src/webhooks/shopify.webhook.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { messageQueue } from '../lib/queue';
import { verifyShopifyWebhook } from '../lib/shopify.security';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export const handleAbandonedCartWebhook = async (req: any, res: Response): Promise<any> => {
  const hmac = req.headers['x-shopify-hmac-sha256'] as string;
  const rawId = req.params.merchantId;
  const merchantId = rawId ? rawId.trim() : null;

  console.log("--- 📥 NEW WEBHOOK ATTEMPT ---");
  console.log("Step 1: ID from URL ->", merchantId);
  console.log("Step 1: HMAC Header ->", hmac ? hmac.substring(0, 20) + "..." : "MISSING");
  console.log("Step 1: RawBody captured? ->", req.rawBody ? `YES (${req.rawBody.length} bytes)` : "NO ❌");

  try {
    const merchant = await prisma.merchant.findFirst({
      where: { id: merchantId as string }
    });

    if (!merchant) {
      console.log("❌ Step 2: Merchant NOT FOUND in DB. Looking for ID:", merchantId);
      return res.status(404).send("Merchant not found");
    }

    console.log("✅ Step 2: Merchant Found ->", merchant.brandName);
    console.log("Step 2: shopifySecret in DB ->", merchant.shopifySecret ? `SET (${merchant.shopifySecret.length} chars)` : "MISSING ❌");

    if (!merchant.shopifySecret) {
      console.log("❌ Step 3: shopifySecret is MISSING in DB for this merchant!");
      return res.status(401).send("Configuration incomplete: Secret missing");
    }

    // 🛡️ Step 3: Verify HMAC
    // If rawBody is missing, HMAC will always fail — skip verification in dev mode
    if (!req.rawBody) {
      console.error("❌ Step 3: rawBody is MISSING — cannot verify HMAC. Check server.ts middleware order.");
      return res.status(401).send("Internal: rawBody not captured");
    }

    // DEV BYPASS: Set SKIP_WEBHOOK_VERIFY=true in .env to skip HMAC check while debugging
    const skipVerify = process.env.SKIP_WEBHOOK_VERIFY === 'true';
    const isValid = skipVerify ? true : verifyShopifyWebhook(req.rawBody, hmac, merchant.shopifySecret);
    console.log("Step 3: HMAC valid? ->", isValid ? "YES ✅" : `NO ❌ (skipVerify=${skipVerify})`);
    
    if (!isValid) {
      // Extra debug: show what we computed vs what Shopify sent
      const crypto = require('crypto');
      const computed = crypto.createHmac('sha256', merchant.shopifySecret).update(req.rawBody).digest('base64');
      console.error(`🚨 HMAC MISMATCH`);
      console.error(`   Shopify sent: ${hmac}`);
      console.error(`   We computed:  ${computed}`);
      console.error(`   Secret used (first 4 chars): ${merchant.shopifySecret.substring(0, 4)}...`);
      return res.status(401).send("Forbidden: Invalid Signature");
    }

    console.log("✅ Step 4: Verification SUCCESS!");

    const shopifyData = req.body;

    // --- LOG the full payload structure so we can see exactly what Shopify sends ---
    console.log("📦 Shopify Payload Keys:", Object.keys(shopifyData));
    console.log("📦 id:", shopifyData.id, "| token:", shopifyData.token);
    console.log("📦 customer:", JSON.stringify(shopifyData.customer)?.substring(0, 200));
    console.log("📦 phone (top-level):", shopifyData.phone);
    console.log("📦 abandoned_checkout_url:", shopifyData.abandoned_checkout_url);

    // Shopify abandoned_checkouts use either `id` (number) or `token` (string) as unique key
    // `token` is always present and is the safest unique identifier
    const cartUniqueId = shopifyData.token
      || (shopifyData.id != null ? String(shopifyData.id) : null);

    if (!cartUniqueId) {
      console.log("❌ Step 5: No unique ID (id or token) found in payload. Skipping.");
      return res.status(200).send("No cart ID, skipping");
    }

    console.log("✅ Step 5: Cart unique ID ->", cartUniqueId);

    // Extract phone — Shopify puts it in different places depending on checkout stage
    const customerPhone =
      shopifyData.phone ||
      shopifyData.billing_address?.phone ||
      shopifyData.shipping_address?.phone ||
      shopifyData.customer?.phone ||
      "NO_PHONE";

    const customerName =
      shopifyData.customer?.first_name ||
      shopifyData.billing_address?.first_name ||
      shopifyData.shipping_address?.first_name ||
      "Customer";

    console.log("📦 Resolved phone ->", customerPhone);
    console.log("📦 Resolved name  ->", customerName);

    // 1. Smart duplicate handling
    const existingCart = await prisma.abandonedCart.findUnique({
      where: { shopifyCartId: cartUniqueId }
    });

    if (existingCart) {
      // Case A: Cart exists AND already has a real phone — fully processed, skip
      if (existingCart.customerPhone !== "NO_PHONE" && existingCart.status !== "PENDING") {
        console.log(`ℹ️ Cart already processed with phone ${existingCart.customerPhone}. Skipping.`);
        return res.status(200).send("Already Processed");
      }

      // Case B: Cart exists but phone was NO_PHONE before — now we have the real phone, UPDATE & queue
      if (existingCart.customerPhone === "NO_PHONE" && customerPhone !== "NO_PHONE") {
        console.log(`🔄 Updating cart with real phone: ${customerPhone}`);
        const updatedCart = await prisma.abandonedCart.update({
          where: { shopifyCartId: cartUniqueId },
          data: {
            customerPhone,
            customerName,
            status: "PENDING", // reset so worker sends it
          }
        });

        // Fetch active flows and queue
        const activeFlows = await prisma.automationFlow.findMany({
          where: { merchantId: merchant.id, isActive: true, type: { startsWith: 'ABANDONED_CART' } }
        });

        if (activeFlows.length === 0) {
          console.log("ℹ️ No active flows for this merchant.");
          return res.status(200).send("No Active Flows");
        }

        for (const flow of activeFlows) {
          // Shopify's abandoned_checkout_url already has the full store domain — use directly
          const cartLink = updatedCart.cartUrl;
          const customizedMessage = flow.template
            .replace(/{{name}}/g, updatedCart.customerName)
            .replace(/{{link}}/g, cartLink)
            .replace(/{{discount_code}}/g, '');

          await messageQueue.add('send-automated-msg', {
            cartId: updatedCart.id,
            merchantId: merchant.id,
            phone: customerPhone,
            message: customizedMessage
          }, { delay: flow.delayMinutes * 60 * 1000 });

          console.log(`✅ Job re-queued with real phone: flow=${flow.type} delay=${flow.delayMinutes}min phone=${customerPhone}`);
        }

        console.log(`🚀 Updated & queued for ${customerName} (${customerPhone})`);
        return res.status(200).send("Webhook Processed - Updated");
      }

      // Case C: Duplicate with same phone — skip silently
      console.log(`ℹ️ Already processed cart: ${cartUniqueId}`);
      return res.status(200).send("Already Processed");
    }

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

    console.log(`✅ Step 6: Found ${activeFlows.length} active flow(s)`);

    // 3. Save to Database
    const newCart = await prisma.abandonedCart.create({
      data: {
        merchantId: merchant.id,
        shopifyCartId: cartUniqueId,
        customerPhone,
        customerName,
        cartUrl: shopifyData.abandoned_checkout_url || "",
        totalPrice: parseFloat(shopifyData.total_price || "0"),
      }
    });

    console.log(`✅ Step 7: Cart saved to DB -> ${newCart.id}`);

    // 4. Queue jobs with delay per flow
    for (const flow of activeFlows) {
      // Shopify's abandoned_checkout_url already contains the full store domain:
      // e.g. https://yourstore.myshopify.com/83738165469/checkouts/ac/.../recover?key=...
      // Use it directly — no need to build anything.
      const cartLink = newCart.cartUrl;  // = shopifyData.abandoned_checkout_url

      const customizedMessage = flow.template
        .replace(/{{name}}/g, newCart.customerName)
        .replace(/{{link}}/g, cartLink)
        .replace(/{{discount_code}}/g, '');  // clear unfilled placeholder if admin forgot to set it

      await messageQueue.add('send-automated-msg', {
        cartId: newCart.id,
        merchantId: merchant.id,
        phone: newCart.customerPhone,
        message: customizedMessage
      }, {
        delay: flow.delayMinutes * 60 * 1000
      });

      console.log(`✅ Job queued: flow=${flow.type} delay=${flow.delayMinutes}min phone=${customerPhone}`);
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