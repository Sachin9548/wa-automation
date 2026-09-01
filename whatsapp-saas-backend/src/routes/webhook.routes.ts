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
            const from          = message.from; // customer phone
            const phoneNumberId = value.metadata?.phone_number_id;
            const msgType       = message.type || 'text';

            // Extract content based on message type
            let content = '';
            let mediaData: {
              mediaId?: string;
              mediaType?: string;
              mediaMimeType?: string;
              mediaCaption?: string;
              mediaFilename?: string;
              mediaLat?: number;
              mediaLng?: number;
              mediaAddress?: string;
            } = {};

            if (msgType === 'text') {
              content = message.text?.body || '';
            } else if (msgType === 'image') {
              const img = message.image || {};
              content = img.caption ? `📷 ${img.caption}` : '📷 Image';
              mediaData = {
                mediaId:       img.id,
                mediaType:     'image',
                mediaMimeType: img.mime_type,
                mediaCaption:  img.caption || null,
              };
            } else if (msgType === 'video') {
              const vid = message.video || {};
              content = vid.caption ? `🎥 ${vid.caption}` : '🎥 Video';
              mediaData = {
                mediaId:       vid.id,
                mediaType:     'video',
                mediaMimeType: vid.mime_type,
                mediaCaption:  vid.caption || null,
              };
            } else if (msgType === 'audio') {
              const aud = message.audio || {};
              content = '🎤 Voice Message';
              mediaData = {
                mediaId:       aud.id,
                mediaType:     'audio',
                mediaMimeType: aud.mime_type,
              };
            } else if (msgType === 'document') {
              const doc = message.document || {};
              content = `📄 ${doc.filename || 'Document'}`;
              mediaData = {
                mediaId:       doc.id,
                mediaType:     'document',
                mediaMimeType: doc.mime_type,
                mediaFilename: doc.filename || null,
                mediaCaption:  doc.caption || null,
              };
            } else if (msgType === 'sticker') {
              const stk = message.sticker || {};
              content = '🎭 Sticker';
              mediaData = {
                mediaId:       stk.id,
                mediaType:     'sticker',
                mediaMimeType: stk.mime_type,
              };
            } else if (msgType === 'location') {
              const loc = message.location || {};
              const name = loc.name || loc.address || `${loc.latitude},${loc.longitude}`;
              content = `📍 ${name}`;
              mediaData = {
                mediaType:   'location',
                mediaLat:    loc.latitude,
                mediaLng:    loc.longitude,
                mediaAddress: loc.name || loc.address || null,
              };
            } else if (msgType === 'reaction') {
              content = `${message.reaction?.emoji || '👍'} Reaction`;
            } else {
              content = `[${msgType}]`;
            }

            console.log(`📨 Incoming WA from ${from} [${msgType}]: ${content}`);

            // Find merchant by phoneNumberId
            const merchant = await prisma.merchant.findFirst({
              where: { metaPhoneNumberId: phoneNumberId }
            });

            if (!merchant) {
              console.warn(`⚠️ No merchant found for phoneNumberId: ${phoneNumberId}`);
              continue;
            }

            // ── STOP keyword — auto opt-out ─────────────────────────────
            const STOP_KEYWORDS = ['stop', 'unsubscribe', 'no', 'quit', 'cancel', 'optout', 'opt out', 'opt-out'];
            if (msgType === 'text' && STOP_KEYWORDS.includes(content.trim().toLowerCase())) {
              console.log(`🚫 STOP keyword from ${from} — opting out`);
              await prisma.customer.updateMany({
                where: { merchantId: merchant.id, phone: from },
                data: { tags: 'wa_invalid|auto_optout' }
              });
              // Save the incoming stop message
              await prisma.message.create({
                data: {
                  merchantId: merchant.id,
                  customerPhone: from,
                  content,
                  direction: 'INCOMING',
                  status: 'READ',
                  ...mediaData,
                }
              });
              // Mark as read on Meta side
              if (merchant.metaAccessToken) {
                await markMessageRead(phoneNumberId!, merchant.metaAccessToken, message.id);
              }
              continue; // Skip normal save — already saved above
            }

            // ── Save incoming message ───────────────────────────────────
            await prisma.message.create({
              data: {
                merchantId: merchant.id,
                customerPhone: from,
                content,
                direction: 'INCOMING',
                status: 'DELIVERED',
                ...mediaData,
              }
            });

            // Mark as read on Meta side
            if (merchant.metaAccessToken) {
              await markMessageRead(phoneNumberId!, merchant.metaAccessToken, message.id);
            }
          }
        }

        // ── Message status updates ────────────────────────────────────────
        if (value.statuses) {
          for (const status of value.statuses) {
            const statusMap: Record<string, string> = {
              sent:      'SENT',
              delivered: 'DELIVERED',
              read:      'READ',
              failed:    'FAILED',
            };

            const dbStatus = statusMap[status.status];
            if (!dbStatus) continue;

            const phoneNumberId = value.metadata?.phone_number_id;
            const merchant = await prisma.merchant.findFirst({
              where: { metaPhoneNumberId: phoneNumberId }
            });
            if (!merchant) continue;

            const recipientPhone = status.recipient_id;

            // Update latest outgoing message for this recipient
            const latestMsg = await prisma.message.findFirst({
              where: {
                merchantId: merchant.id,
                customerPhone: { contains: recipientPhone.slice(-10) },
                direction: 'OUTGOING',
                status: { not: 'FAILED' },
              },
              orderBy: { timestamp: 'desc' },
            });

            if (latestMsg) {
              const updateData: any = { status: dbStatus };
              if (dbStatus === 'FAILED') {
                updateData.failReason = status.errors?.[0]?.title || `Meta error ${status.errors?.[0]?.code}`;
              }
              await prisma.message.update({
                where: { id: latestMsg.id },
                data: updateData,
              });
            }

            // Increment merchant read count
            if (dbStatus === 'READ') {
              await prisma.merchant.update({
                where: { id: merchant.id },
                data: { totalRead: { increment: 1 } },
              });
            }

            console.log(`📊 Status [${dbStatus}] for ${recipientPhone}`);
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