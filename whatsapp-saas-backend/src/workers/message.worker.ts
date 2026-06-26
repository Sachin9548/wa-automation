// src/workers/message.worker.ts
import { Worker } from 'bullmq';
import redis from '../lib/redis';
import prisma from '../lib/prisma';
import { sendMessage } from '../services/whatsapp.service';
import { checkMerchantEligibility } from '../services/automation.service';

export const initMessageWorker = () => {
  const worker = new Worker('message-sending', async (job) => {

    // ==========================================
    // 1. ABANDONED CART LOGIC
    // ==========================================
    if (job.name === 'send-automated-msg') {
      const { cartId, merchantId, phone, message } = job.data;
      console.log(`🤖 Processing Job: ${job.id} for Cart: ${cartId}`);

      if (!phone || phone === "NO_PHONE") {
        console.log(`❌ Skipped: No phone number provided for Cart ${cartId}`);
        return;
      }

      try {
        const cart = await prisma.abandonedCart.findUnique({ where: { id: cartId } });
        if (!cart) return;

        if (cart.status === 'RECOVERED') {
          console.log(`🚫 Skipping Job: Customer already purchased for Cart ${cartId}`);
          return;
        }

        if (cart.status !== 'PENDING') {
          return;
        }
        // Eligibility Check (Subscription + Balance)
        const eligibility = await checkMerchantEligibility(merchantId);
        if (!eligibility.eligible) {
          console.log(`❌ Message blocked for ${merchantId}. Reason: ${eligibility.reason}`);
          return;
        }
        // Production mein 'http://localhost:5000' ki jagah aapka live domain aayega
        const trackingUrl = `http://localhost:5000/api/tracking/go?m_id=${merchantId}&type=ABANDONED_CART&url=${encodeURIComponent(cart.cartUrl)}`;

        // 2. Custom Message mein Asli Link ki jagah Tracking Link dalein
        // Hum flow template use kar rahe the, toh agar message me link hai usko replace karo
        const finalMessage = message.replace(cart.cartUrl, trackingUrl);

        // Send Message via Baileys
        const success = await sendMessage(merchantId, phone, finalMessage);

        if (success) {
          // Safe Database Transaction (Money + Analytics + Logs)
          await prisma.$transaction([
            prisma.merchant.update({
              where: { id: merchantId },
              data: {
                walletBalance: { decrement: 0.80 },
                totalSent: { increment: 1 }
              }
            }),
            prisma.abandonedCart.update({
              where: { id: cartId },
              data: { status: 'SENT' }
            }),
            prisma.message.create({
              data: {
                merchantId,
                customerPhone: phone,
                content: message,
                direction: "OUTGOING",
                status: "SENT"
              }
            })
          ]);
          console.log(`✅ Message Sent & Money Deducted for Cart ${cartId}`);
        }

        // Rate Limiting (15 Seconds Gap to protect WhatsApp ban)
        await new Promise(resolve => setTimeout(resolve, 15000));

      } catch (error) {
        console.error(`💥 Worker Error for Job ${job.id}:`, error);
      }
    }

    // ==========================================
    // 2. BULK CAMPAIGN LOGIC
    // ==========================================
    if (job.name === 'send-campaign-msg') {
      const { campaignId, merchantId, phone, message } = job.data;
      console.log(`📢 Processing Campaign Job: ${job.id} to: ${phone}`);

      if (!phone || phone === "NO_PHONE") return;

      try { // 🚨 NAYA: Try-Catch block added for safety
        // Eligibility Check
        const eligibility = await checkMerchantEligibility(merchantId);
        if (!eligibility.eligible) {
          console.log(`❌ Message blocked for ${merchantId}. Reason: ${eligibility.reason}`);
          return;
        }

        // Send Message via Baileys
        const success = await sendMessage(merchantId, phone, message);

        if (success) {
          // Paisa Kato aur Analytics Update Karo
          await prisma.$transaction([
            prisma.merchant.update({
              where: { id: merchantId },
              data: {
                walletBalance: { decrement: 0.80 },
                totalSent: { increment: 1 }
              }
            }),
            prisma.campaign.update({
              where: { id: campaignId },
              data: { sentCount: { increment: 1 } }
            }),
            prisma.message.create({
              data: {
                merchantId,
                customerPhone: phone,
                content: message,
                direction: "OUTGOING",
                status: "SENT"
              }
            })
          ]);
          console.log(`✅ Campaign Message Sent to ${phone}`);
        }

        // The Life-Saver Delay (15 seconds)
        await new Promise(resolve => setTimeout(resolve, 15000));

      } catch (error) {
        console.error(`💥 Campaign Worker Error for Job ${job.id}:`, error);
      }
    }

  }, {
    connection: {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null
    },
    concurrency: 1
  });

  worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job?.id} has failed with error: ${err.message}`);
  });

  console.log('👷 Message Worker Started!');
};