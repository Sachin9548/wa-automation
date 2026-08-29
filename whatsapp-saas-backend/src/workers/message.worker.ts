// src/workers/message.worker.ts
import { Worker } from 'bullmq';
import prisma from '../lib/prisma';
import { sendMetaTemplateMessage } from '../services/whatsapp.service';
import { checkMerchantEligibility } from '../services/automation.service';

// ── In-memory merchant cache — avoids repeated DB reads per job batch ─────────
// Cache is valid for 5 minutes per merchant, clears automatically
const merchantCache = new Map<string, { data: any; expiresAt: number }>();

const getCachedMerchant = async (merchantId: string) => {
  const now = Date.now();
  const cached = merchantCache.get(merchantId);
  if (cached && cached.expiresAt > now) return cached.data;

  const result = await checkMerchantEligibility(merchantId);
  if (result.eligible) {
    merchantCache.set(merchantId, { data: result, expiresAt: now + 5 * 60 * 1000 }); // 5 min TTL
  }
  return result;
};

// ── Format phone for WhatsApp API ─────────────────────────────────────────────
// WhatsApp needs: "918805155743" (no +, with country code)
const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[\s\-()]/g, '');
  if (clean.startsWith('+')) return clean.slice(1);   // +918805... → 918805...
  if (clean.length === 10)   return `91${clean}`;     // 8805...    → 918805...
  return clean;
};

// ── Check if this customer's phone is already marked invalid ──────────────────
const isPhoneInvalid = async (merchantId: string, phone: string): Promise<boolean> => {
  const customer = await prisma.customer.findFirst({
    where: {
      merchantId,
      OR: [
        { phone },
        { phone: phone.slice(-10) },
        { phone: `+${phone}` },
      ]
    },
    select: { id: true, tags: true }
  });
  // We store invalid flag in tags field as "wa_invalid"
  return customer?.tags?.includes('wa_invalid') ?? false;
};

// ── Mark customer phone as invalid on WhatsApp ────────────────────────────────
const markPhoneAsInvalid = async (merchantId: string, phone: string, reason: string) => {
  try {
    await prisma.customer.updateMany({
      where: {
        merchantId,
        OR: [
          { phone },
          { phone: phone.slice(-10) },
          { phone: `+${phone}` },
        ]
      },
      data: {
        // Append wa_invalid tag — won't overwrite existing tags
        tags: `wa_invalid|${reason}|${new Date().toISOString().split('T')[0]}`
      }
    });
    console.log(`📵 Marked phone ${phone} as WA invalid: ${reason}`);
  } catch (e) {
    console.error('Failed to mark phone as invalid:', e);
  }
};

export const initMessageWorker = () => {
  const worker = new Worker('message-sending', async (job) => {

    // ── 1. ABANDONED CART ──────────────────────────────────────────────────
    if (job.name === 'send-automated-msg') {
      const { cartId, merchantId, phone, templateName, templateLang, discountCode, trackingLinkId, variables } = job.data;
      console.log(`🤖 Job: ${job.id} | Cart: ${cartId} | Phone: ${phone} | Template: ${templateName}`);

      if (!phone || phone === 'NO_PHONE') {
        console.log(`❌ Skipped: No phone for Cart ${cartId}`);
        return;
      }

      // ── Guard: skip if phone already known invalid ────────────────────
      const toPhone = formatPhone(phone);
      const alreadyInvalid = await isPhoneInvalid(merchantId, toPhone);
      if (alreadyInvalid) {
        console.log(`📵 Skipped: Phone ${toPhone} already marked as WA invalid — no retry`);
        await prisma.abandonedCart.update({
          where: { id: cartId },
          data: { status: 'FAILED' }
        });
        return;
      }

      const cart = await prisma.abandonedCart.findUnique({ where: { id: cartId } });
      if (!cart || cart.status !== 'PENDING') {
        console.log(`ℹ️ Cart ${cartId} already processed (status: ${cart?.status}). Skipping.`);
        return;
      }

      // ── Use cached merchant eligibility (reduces DB reads) ────────────
      const eligibility = await getCachedMerchant(merchantId);
      if (!eligibility.eligible) {
        console.log(`❌ Blocked: ${eligibility.reason}`);
        return;
      }

      const { merchant } = eligibility as any;
      console.log(`📱 Sending to: ${toPhone} via template: ${templateName} lang: ${templateLang || 'en_US'}`);

      const result = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        toPhone,
        templateName || 'hello_world',
        variables || [],
        templateLang || 'en_US'
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
        // ── Non-retryable: save failure + maybe mark phone invalid ────────
        const failReason = result.invalidNumber
          ? `NOT_ON_WHATSAPP (${result.errorCode})`
          : `${result.errorMessage || 'Meta error'} (${result.errorCode})`;

        console.error(`🚫 Non-retryable error for cart ${cartId} → ${toPhone}: ${failReason}`);

        await prisma.message.create({
          data: {
            merchantId,
            customerPhone: toPhone,
            content: `Template: ${templateName}`,
            direction: 'OUTGOING',
            status: 'FAILED',
            templateName,
            failReason,
            cartId: cartId || null,
          }
        });

        // Mark cart as FAILED so no future jobs re-queue this
        await prisma.abandonedCart.update({
          where: { id: cartId },
          data: { status: 'FAILED' }
        });

        // If number is not on WhatsApp — mark customer so we never try again
        if (result.invalidNumber) {
          await markPhoneAsInvalid(merchantId, toPhone, `Meta ${result.errorCode}`);
        }

        return; // Do NOT throw — prevents BullMQ from retrying

      } else {
        // Retryable error — throw so BullMQ retries with backoff
        throw new Error(`Meta send failed (${result.errorCode}): ${result.errorMessage}`);
      }
    }

    // ── 2. BULK CAMPAIGN ───────────────────────────────────────────────────
    if (job.name === 'send-campaign-msg') {
      const { campaignId, merchantId, phone, templateName, templateLang, variables, discountCode } = job.data;
      console.log(`📢 Campaign Job: ${job.id} | Phone: ${phone} | Template: ${templateName}`);

      if (!phone || phone === 'NO_PHONE') return;

      const toPhone = formatPhone(phone);

      // ── Guard: skip if phone already known invalid ────────────────────
      const alreadyInvalid = await isPhoneInvalid(merchantId, toPhone);
      if (alreadyInvalid) {
        console.log(`📵 Campaign skip: Phone ${toPhone} already marked WA invalid`);
        await prisma.$transaction([
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
              status: 'FAILED',
              templateName,
              failReason: 'NOT_ON_WHATSAPP (cached)',
            }
          })
        ]);
        return;
      }

      // ── Guard: check if campaign was cancelled ────────────────────────
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true }
      });
      if (!campaign || campaign.status === 'CANCELLED') {
        console.log(`⛔ Campaign ${campaignId} is CANCELLED — skipping job for ${toPhone}`);
        return;
      }

      // ── Use cached merchant eligibility ──────────────────────────────
      const eligibility = await getCachedMerchant(merchantId);
      if (!eligibility.eligible) {
        console.log(`❌ Blocked: ${eligibility.reason}`);
        return;
      }

      const { merchant } = eligibility as any;

      // Mark campaign as SENDING if it was SCHEDULED (first job firing)
      if (campaign.status === 'SCHEDULED') {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: { status: 'SENDING' }
        });
      }

      const result = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        toPhone,
        templateName || 'hello_world',
        variables || [],
        templateLang || 'en_US'
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
              status: 'SENT',
              templateName,
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
        console.error(`🚫 Non-retryable campaign error → ${toPhone}: ${result.errorCode}`);

        await prisma.$transaction([
          prisma.campaign.update({
            where: { id: campaignId },
            data: { sentCount: { increment: 1 } }  // count so campaign completes
          }),
          prisma.message.create({
            data: {
              merchantId,
              customerPhone: toPhone,
              content: `Template: ${templateName}`,
              direction: 'OUTGOING',
              status: 'FAILED',
              templateName,
              failReason: result.invalidNumber
                ? `NOT_ON_WHATSAPP (${result.errorCode})`
                : `${result.errorMessage} (${result.errorCode})`,
            }
          })
        ]);

        if (result.invalidNumber) {
          await markPhoneAsInvalid(merchantId, toPhone, `Meta ${result.errorCode}`);
        }

        return; // No throw = no BullMQ retry

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
    console.error(`🚨 Job ${job?.id} failed after retries: ${err.message}`);
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job?.id} completed`);
  });

  console.log('👷 Message Worker Started (Meta Cloud API) — Rate limit: 1 msg/15s');
};
