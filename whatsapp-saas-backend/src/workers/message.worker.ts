// src/workers/message.worker.ts
import { Worker } from 'bullmq';
import prisma from '../lib/prisma';
import { sendMetaTemplateMessage } from '../services/whatsapp.service';
import { checkMerchantEligibility } from '../services/automation.service';

// ── Format phone for WhatsApp API ─────────────────────────────────────────────
// WhatsApp needs: "918805155743" (no +, with country code)
const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+')) return clean.slice(1);   // +918805... → 918805...
  if (clean.length === 10)   return `91${clean}`;     // 8805...    → 918805...
  return clean;
};

export const initMessageWorker = () => {
  const worker = new Worker('message-sending', async (job) => {

    // ── 1. ABANDONED CART ──────────────────────────────────────────────────
    if (job.name === 'send-automated-msg') {
      const { cartId, merchantId, phone, templateName, templateLang, discountCode, trackingLinkId, variables } = job.data;
      console.log(`🤖 Job: ${job.id} | Cart: ${cartId} | Phone: ${phone} | Template: ${templateName} (${templateLang || 'en_US'})`);

      if (!phone || phone === 'NO_PHONE') {
        console.log(`❌ Skipped: No phone for Cart ${cartId}`);
        return;
      }

      const cart = await prisma.abandonedCart.findUnique({ where: { id: cartId } });
      if (!cart || cart.status !== 'PENDING') {
        console.log(`ℹ️ Cart ${cartId} already processed. Skipping.`);
        return;
      }

      const eligibility = await checkMerchantEligibility(merchantId);
      if (!eligibility.eligible) {
        console.log(`❌ Blocked: ${eligibility.reason}`);
        return;
      }

      const { merchant } = eligibility as any;
      const toPhone = formatPhone(phone);
      console.log(`📱 Sending to: ${toPhone} via template: ${templateName} lang: ${templateLang || 'en_US'}`);

      const result = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        toPhone,
        templateName || 'hello_world',
        variables || [],
        templateLang || 'en_US'   // dynamic language from flow config
      );

      if (result.success) {
        // Save message with tracking link reference
        const message = await prisma.message.create({
          data: {
            merchantId,
            customerPhone: toPhone,
            content: `Template: ${templateName}`,
            direction: 'OUTGOING',
            status: 'SENT',
            templateName,
            cartId: cartId || null,
          }
        });

        // Link tracking URL to this message
        if (trackingLinkId) {
          await (prisma as any).trackingLink.update({
            where: { id: trackingLinkId },
            data: { messageId: message.id }
          });
        }

        await prisma.$transaction([
          prisma.merchant.update({
            where: { id: merchantId },
            data: { totalSent: { increment: 1 } }
          }),
          prisma.abandonedCart.update({
            where: { id: cartId },
            data: { status: 'SENT' }
          }),
        ]);
        console.log(`✅ Abandoned cart message sent → ${toPhone}`);

      } else if (!result.retryable) {
        console.error(`🚫 Non-retryable error (${result.errorCode}) for cart ${cartId}. No retry.`);
        // Save failed message with reason
        await prisma.message.create({
          data: {
            merchantId,
            customerPhone: toPhone,
            content: `Template: ${templateName}`,
            direction: 'OUTGOING',
            status: 'FAILED',
            templateName,
            failReason: result.errorMessage || `Error ${result.errorCode}`,
            cartId: cartId || null,
          }
        });
        return;

      } else {
        throw new Error(`Meta send failed (${result.errorCode}): ${result.errorMessage}`);
      }
    }

    // ── 2. BULK CAMPAIGN ───────────────────────────────────────────────────
    if (job.name === 'send-campaign-msg') {
      const { campaignId, merchantId, phone, templateName, templateLang, variables } = job.data;
      console.log(`📢 Campaign Job: ${job.id} | Phone: ${phone} | Template: ${templateName} (${templateLang || 'en_US'})`);

      if (!phone || phone === 'NO_PHONE') return;

      const eligibility = await checkMerchantEligibility(merchantId);
      if (!eligibility.eligible) {
        console.log(`❌ Blocked: ${eligibility.reason}`);
        return;
      }

      const { merchant } = eligibility as any;
      const toPhone = formatPhone(phone);

      const result = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        toPhone,
        templateName || 'hello_world',
        variables || [],
        templateLang || 'en_US'   // dynamic language
      );

      if (result.success) {
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
              customerPhone: toPhone,
              content: `Template: ${templateName}`,
              direction: 'OUTGOING',
              status: 'SENT'
            }
          })
        ]);
        console.log(`✅ Campaign message sent to ${toPhone}`);

        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
        if (campaign && campaign.sentCount + 1 >= campaign.totalRecipients) {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
          });
          console.log(`🏁 Campaign ${campaignId} COMPLETED`);
        }

      } else if (!result.retryable) {
        console.error(`🚫 Non-retryable error (${result.errorCode}) for campaign ${campaignId} → ${toPhone}. Skipping.`);
        return;

      } else {
        throw new Error(`Meta send failed (${result.errorCode}): ${result.errorMessage}`);
      }
    }

  }, {
    connection: { url: process.env.REDIS_URL, maxRetriesPerRequest: null },
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 15000,      // 1 msg per 15s — Meta rate limit safe
    },
    stalledInterval: 60000,
    drainDelay: 30,
  });

  worker.on('failed', (job, err) => {
    console.error(`🚨 Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job?.id} completed`);
  });

  console.log('👷 Message Worker Started (Meta Cloud API) — Rate limit: 1 msg/15s');
};
