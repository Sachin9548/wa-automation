// src/workers/message.worker.ts
import { Worker } from 'bullmq';
import prisma from '../lib/prisma';
import { sendMetaTemplateMessage } from '../services/whatsapp.service';
import { checkMerchantEligibility } from '../services/automation.service';

export const initMessageWorker = () => {
  const worker = new Worker('message-sending', async (job) => {

    // ── 1. ABANDONED CART ──────────────────────────────────────────────────
    if (job.name === 'send-automated-msg') {
      const { cartId, merchantId, phone, templateName, variables } = job.data;
      console.log(`🤖 Job: ${job.id} | Cart: ${cartId} | Phone: ${phone}`);

      if (!phone || phone === 'NO_PHONE') {
        console.log(`❌ Skipped: No phone for Cart ${cartId}`);
        return;
      }

      const cart = await prisma.abandonedCart.findUnique({ where: { id: cartId } });
      if (!cart || cart.status === 'RECOVERED' || cart.status !== 'PENDING') {
        console.log(`ℹ️ Cart ${cartId} already processed or not found. Skipping.`);
        return;
      }

      const eligibility = await checkMerchantEligibility(merchantId);
      if (!eligibility.eligible) {
        console.log(`❌ Blocked: ${eligibility.reason}`);
        return;
      }

      const { merchant } = eligibility as any;
      const success = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        phone,
        templateName || 'hello_world',
        variables || []
      );

      if (success) {
        await prisma.$transaction([
          prisma.merchant.update({
            where: { id: merchantId },
            data: { totalSent: { increment: 1 } }
          }),
          prisma.abandonedCart.update({
            where: { id: cartId },
            data: { status: 'SENT' }
          }),
          prisma.message.create({
            data: {
              merchantId,
              customerPhone: phone,
              content: `Template: ${templateName}`,
              direction: 'OUTGOING',
              status: 'SENT'
            }
          })
        ]);
        console.log(`✅ Abandoned cart message sent for Cart ${cartId} → ${phone}`);
      } else {
        throw new Error(`Meta send failed for cart ${cartId}. Will retry.`);
      }
    }

    // ── 2. BULK CAMPAIGN ───────────────────────────────────────────────────
    if (job.name === 'send-campaign-msg') {
      const { campaignId, merchantId, phone, templateName, variables } = job.data;
      console.log(`📢 Campaign Job: ${job.id} | Phone: ${phone}`);

      if (!phone || phone === 'NO_PHONE') return;

      const eligibility = await checkMerchantEligibility(merchantId);
      if (!eligibility.eligible) {
        console.log(`❌ Blocked: ${eligibility.reason}`);
        return;
      }

      const { merchant } = eligibility as any;
      const success = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        phone,
        templateName || 'hello_world',
        variables || []
      );

      if (success) {
        await prisma.$transaction([
          prisma.merchant.update({
            where: { id: merchantId },
            data: { totalSent: { increment: 1 } }
          }),
          prisma.campaign.update({
            where: { id: campaignId },
            data: { sentCount: { increment: 1 } }
          }),
          prisma.message.create({
            data: {
              merchantId,
              customerPhone: phone,
              content: `Template: ${templateName}`,
              direction: 'OUTGOING',
              status: 'SENT'
            }
          })
        ]);
        console.log(`✅ Campaign message sent to ${phone}`);

        // Mark campaign COMPLETED when all sent
        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
        if (campaign && campaign.sentCount + 1 >= campaign.totalRecipients) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
          });
          console.log(`🏁 Campaign ${campaignId} COMPLETED`);
        }
      } else {
        throw new Error(`Meta send failed for campaign ${campaignId}. Will retry.`);
      }
    }

  }, {
    connection: { url: process.env.REDIS_URL, maxRetriesPerRequest: null },
    concurrency: 1,          // ek waqt mein sirf 1 job — no message gets skipped
    limiter: {
      max: 1,                 // max 1 job
      duration: 15000,        // per 15 seconds — Meta rate limit safe
    }
  });

  worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job?.id} failed (will retry): ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job?.id} completed`);
  });

  console.log('👷 Message Worker Started (Meta Cloud API) — Rate limit: 1 msg/15s');
};
