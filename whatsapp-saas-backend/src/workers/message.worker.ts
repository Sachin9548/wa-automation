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
      if (!cart || cart.status === 'RECOVERED' || cart.status !== 'PENDING') return;

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
        templateName || 'abandoned_cart_reminder',
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
        console.log(`✅ Abandoned cart message sent for Cart ${cartId}`);
      } else {
        throw new Error(`Meta send failed for cart ${cartId}. Will retry.`);
      }

      // 15s delay between messages
      await new Promise(r => setTimeout(r, 15000));
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
        templateName || 'bulk_campaign',
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
        if (campaign && campaign.sentCount >= campaign.totalRecipients) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
          });
          console.log(`🏁 Campaign ${campaignId} COMPLETED`);
        }
      } else {
        throw new Error(`Meta send failed for campaign ${campaignId}. Will retry.`);
      }

      // 15s delay between messages
      await new Promise(r => setTimeout(r, 15000));
    }

  }, {
    connection: { url: process.env.REDIS_URL, maxRetriesPerRequest: null },
    concurrency: 1
  });

  worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job?.id} failed: ${err.message}`);
  });

  console.log('👷 Message Worker Started (Meta Cloud API)');
};
