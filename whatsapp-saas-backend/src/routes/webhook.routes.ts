import { Router, Request, Response } from 'express';
import { handleAbandonedCartWebhook, handleOrderCreatedWebhook } from '../webhooks/shopify.webhook';
import { markMessageRead } from '../services/whatsapp.service';
import prisma from '../lib/prisma';

const router = Router();

// ── Shopify Webhooks ──────────────────────────────────────────────────────────
router.post('/shopify/cart-abandoned/:merchantId', handleAbandonedCartWebhook);
router.post('/shopify/abandoned-cart/:merchantId', handleAbandonedCartWebhook);
router.post('/shopify/order-created/:merchantId', handleOrderCreatedWebhook);

// ── Meta Webhook — Verification (GET) ────────────────────────────────────────
// Meta calls this once when you register the webhook to verify the URL
router.get('/meta', (req: Request, res: Response) => {
  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN || 'wa_auto_verify_2026';
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`📡 Meta webhook verification: mode=${mode} token=${token}`);

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Meta webhook verified!');
    return res.status(200).send(challenge);
  }
  console.log('❌ Meta webhook verification failed');
  return res.status(403).send('Forbidden');
});

// ── Meta Webhook — Events (POST) ─────────────────────────────────────────────
// Meta sends message status updates & incoming messages here
router.post('/meta', async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      return res.status(404).send('Not Found');
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // ── Incoming message from customer ──────────────────────────────
        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from; // customer phone
            const phoneNumberId = value.metadata?.phone_number_id;

            console.log(`📨 Incoming WhatsApp from ${from}: ${message.text?.body || '[non-text]'}`);

            // Find merchant by phoneNumberId
            const merchant = await prisma.merchant.findFirst({
              where: { metaPhoneNumberId: phoneNumberId }
            });

            if (merchant) {
              // Save incoming message
              await prisma.message.create({
                data: {
                  merchantId: merchant.id,
                  customerPhone: from,
                  content: message.text?.body || `[${message.type}]`,
                  direction: 'INCOMING',
                  status: 'DELIVERED'
                }
              });

              // Mark as read
              await markMessageRead(phoneNumberId!, merchant.metaAccessToken!, message.id);
            }
          }
        }

        // ── Message status updates ────────────────────────────────────────
        if (value.statuses) {
          for (const status of value.statuses) {
            console.log(`📊 Status update: ${status.status} for ${status.recipient_id}`);

            const statusMap: Record<string, string> = {
              sent: 'SENT',
              delivered: 'DELIVERED',
              read: 'READ',
              failed: 'FAILED'
            };

            const dbStatus = statusMap[status.status];
            if (!dbStatus) continue;

            const phoneNumberId = value.metadata?.phone_number_id;
            const merchant = await prisma.merchant.findFirst({
              where: { metaPhoneNumberId: phoneNumberId }
            });

            if (!merchant) continue;

            // Update latest outgoing message status for this recipient
            const recipientPhone = status.recipient_id;
            const latestMsg = await prisma.message.findFirst({
              where: {
                merchantId: merchant.id,
                customerPhone: { contains: recipientPhone.slice(-10) },
                direction: 'OUTGOING',
                status: { not: 'FAILED' }
              },
              orderBy: { timestamp: 'desc' }
            });

            if (latestMsg) {
              await prisma.message.update({
                where: { id: latestMsg.id },
                data: { status: dbStatus }
              });
            }

            // Update merchant read count
            if (dbStatus === 'READ') {
              await prisma.merchant.update({
                where: { id: merchant.id },
                data: { totalRead: { increment: 1 } }
              });
            }

            // Save failed reason
            if (dbStatus === 'FAILED' && latestMsg) {
              const errorMsg = status.errors?.[0]?.title || `Meta error ${status.errors?.[0]?.code}`;
              await prisma.message.update({
                where: { id: latestMsg.id },
                data: { status: 'FAILED', failReason: errorMsg }
              });
            }
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Meta webhook error:', error);
    res.status(200).send('EVENT_RECEIVED'); // Always 200 to Meta
  }
});

export default router;