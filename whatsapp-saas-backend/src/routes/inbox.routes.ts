// src/routes/inbox.routes.ts
// Customer Inbox — 2-way chat for admin
// All routes protected by adminProtect middleware

import { Router, Request, Response } from 'express';
import { adminProtect } from '../middleware/admin.middleware';
import prisma from '../lib/prisma';
import { sendMetaTextMessage, sendMetaTemplateMessage } from '../services/whatsapp.service';

const router = Router();
router.use(adminProtect);

// ── STOP keywords — auto opt-out ─────────────────────────────────────────────
const STOP_KEYWORDS = ['stop', 'unsubscribe', 'no', 'quit', 'cancel', 'optout', 'opt out', 'opt-out'];

const isStopKeyword = (text: string): boolean => {
  const clean = text.trim().toLowerCase();
  return STOP_KEYWORDS.includes(clean);
};

// ── 1. Conversation list — unique contacts with last message ─────────────────
// GET /api/inbox/conversations/:merchantId
router.get('/conversations/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const page       = parseInt(req.query.page as string) || 1;
    const limit      = parseInt(req.query.limit as string) || 30;
    const search     = (req.query.search as string || '').trim();
    const skip       = (page - 1) * limit;

    // Get distinct phones that have messages for this merchant
    const phoneFilter: any = { merchantId };
    if (search) {
      phoneFilter.OR = [
        { customerPhone: { contains: search } },
      ];
    }

    // Distinct phones + last message + unread count
    const distinctPhones = await prisma.message.findMany({
      where: phoneFilter,
      select: { customerPhone: true },
      distinct: ['customerPhone'],
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });

    // For each phone build conversation summary
    const conversations = await Promise.all(
      distinctPhones.map(async ({ customerPhone }) => {
        const [lastMsg, unreadCount, customer] = await Promise.all([
          // Last message in conversation
          prisma.message.findFirst({
            where: { merchantId, customerPhone },
            orderBy: { timestamp: 'desc' },
            select: { content: true, direction: true, timestamp: true, status: true },
          }),
          // Count unread incoming messages
          prisma.message.count({
            where: { merchantId, customerPhone, direction: 'INCOMING', status: { not: 'READ' } },
          }),
          // Customer info if exists
          prisma.customer.findFirst({
            where: { merchantId, phone: customerPhone },
            select: { name: true, email: true, tags: true },
          }),
        ]);

        // 24hr rule: last INCOMING message time
        const lastIncoming = await prisma.message.findFirst({
          where: { merchantId, customerPhone, direction: 'INCOMING' },
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        });

        const lastIncomingAt   = lastIncoming?.timestamp ?? null;
        const msElapsed        = lastIncomingAt ? Date.now() - new Date(lastIncomingAt).getTime() : Infinity;
        const canSendFreeText  = msElapsed < 24 * 60 * 60 * 1000; // within 24 hours
        const windowExpiresAt  = lastIncomingAt
          ? new Date(new Date(lastIncomingAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
          : null;

        return {
          customerPhone,
          customerName:   customer?.name   ?? null,
          customerEmail:  customer?.email  ?? null,
          isOptedOut:     customer?.tags?.includes('wa_invalid') ?? false,
          lastMessage:    lastMsg?.content ?? '',
          lastDirection:  lastMsg?.direction ?? 'OUTGOING',
          lastTimestamp:  lastMsg?.timestamp ?? null,
          unreadCount,
          canSendFreeText,
          windowExpiresAt,
        };
      })
    );

    // Sort by last message timestamp desc
    conversations.sort((a, b) =>
      new Date(b.lastTimestamp ?? 0).getTime() - new Date(a.lastTimestamp ?? 0).getTime()
    );

    const totalPhones = await prisma.message.findMany({
      where: { merchantId },
      select: { customerPhone: true },
      distinct: ['customerPhone'],
    });

    res.json({ conversations, total: totalPhones.length, page, limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── 2. Messages for a specific contact ───────────────────────────────────────
// GET /api/inbox/messages/:merchantId/:customerPhone
router.get('/messages/:merchantId/:customerPhone', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId    = req.params.merchantId    as string;
    const customerPhone = req.params.customerPhone as string;
    const page  = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { merchantId, customerPhone },
        orderBy: { timestamp: 'asc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { merchantId, customerPhone } }),
    ]);

    // 24hr window info
    const lastIncoming = await prisma.message.findFirst({
      where: { merchantId, customerPhone, direction: 'INCOMING' },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    const lastIncomingAt  = lastIncoming?.timestamp ?? null;
    const msElapsed       = lastIncomingAt ? Date.now() - new Date(lastIncomingAt).getTime() : Infinity;
    const canSendFreeText = msElapsed < 24 * 60 * 60 * 1000;
    const windowExpiresAt = lastIncomingAt
      ? new Date(new Date(lastIncomingAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Customer info
    const customer = await prisma.customer.findFirst({
      where: { merchantId, phone: customerPhone },
      select: { name: true, email: true, tags: true, hasAbandonedCart: true, hasPlacedOrder: true },
    });

    res.json({
      messages,
      total,
      page,
      pages: Math.ceil(total / limit),
      window: { canSendFreeText, windowExpiresAt, lastIncomingAt },
      customer,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── 3. Send reply (free-text within 24hr or template) ────────────────────────
// POST /api/inbox/send/:merchantId
router.post('/send/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId  = req.params.merchantId as string;
    const { customerPhone, message, templateName, templateLang, variables } = req.body;

    if (!customerPhone) return res.status(400).json({ message: 'customerPhone required' });
    if (!message && !templateName) return res.status(400).json({ message: 'message or templateName required' });

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.metaPhoneNumberId || !merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Meta credentials not configured' });
    }

    // ── Check if sending free-text is allowed (24hr rule) ────────────────
    if (message && !templateName) {
      const lastIncoming = await prisma.message.findFirst({
        where: { merchantId, customerPhone, direction: 'INCOMING' },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      if (!lastIncoming) {
        return res.status(400).json({
          message: '24hr window not open — customer has not messaged first. Use a template instead.',
          code: 'NO_24HR_WINDOW',
        });
      }

      const msElapsed = Date.now() - new Date(lastIncoming.timestamp).getTime();
      if (msElapsed >= 24 * 60 * 60 * 1000) {
        return res.status(400).json({
          message: '24hr window expired — use a template message instead.',
          code: 'WINDOW_EXPIRED',
          expiredAt: new Date(new Date(lastIncoming.timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    let success = false;
    let savedMessage: any = null;

    if (templateName) {
      // ── Send template ───────────────────────────────────────────────────
      const result = await sendMetaTemplateMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        customerPhone,
        templateName,
        variables || [],
        templateLang || 'en_US'
      );
      success = result.success;

      if (success) {
        // ── Fetch actual template body from Meta to save readable content ─
        let templateBody = `[Template: ${templateName}]`;
        try {
          const axiosLib = await import('axios');
          const tmplResp = await axiosLib.default.get(
            `https://graph.facebook.com/v23.0/${merchant.metaWabaId}/message_templates?name=${templateName}&fields=name,components`,
            { headers: { Authorization: `Bearer ${merchant.metaAccessToken}` }, timeout: 4000 }
          );
          const tmplData = tmplResp.data?.data?.[0];
          if (tmplData) {
            const bodyComp = tmplData.components?.find((c: any) => c.type === 'BODY');
            if (bodyComp?.text) {
              // Replace {{1}}, {{2}} with actual variable values
              let body = bodyComp.text;
              (variables || []).forEach((v: string, i: number) => {
                body = body.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), v);
              });
              templateBody = body;
            }
          }
        } catch { /* fallback to template name */ }

        savedMessage = await prisma.message.create({
          data: {
            merchantId,
            customerPhone,
            content: templateBody,
            direction: 'OUTGOING',
            status: 'SENT',
            templateName,
          }
        });
        await prisma.merchant.update({
          where: { id: merchantId },
          data: { totalSent: { increment: 1 } },
        });
      } else {
        return res.status(500).json({ message: `Meta error: ${result.errorMessage}`, code: result.errorCode });
      }

    } else {
      // ── Send free-text ──────────────────────────────────────────────────
      success = await sendMetaTextMessage(
        merchant.metaPhoneNumberId,
        merchant.metaAccessToken,
        customerPhone,
        message
      );

      if (success) {
        savedMessage = await prisma.message.create({
          data: {
            merchantId,
            customerPhone,
            content: message,
            direction: 'OUTGOING',
            status: 'SENT',
          }
        });
        await prisma.merchant.update({
          where: { id: merchantId },
          data: { totalSent: { increment: 1 } },
        });
      } else {
        return res.status(500).json({ message: 'Failed to send message — check Meta credentials' });
      }
    }

    res.json({ success: true, message: savedMessage });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── 4. Mark conversation as read ─────────────────────────────────────────────
// POST /api/inbox/mark-read/:merchantId
router.post('/mark-read/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const { customerPhone } = req.body;
    await prisma.message.updateMany({
      where: {
        merchantId,
        customerPhone,
        direction: 'INCOMING',
        status: { not: 'READ' },
      },
      data: { status: 'READ' },
    });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── 5. Opt-out a customer manually ───────────────────────────────────────────
// POST /api/inbox/opt-out/:merchantId
router.post('/opt-out/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const { customerPhone } = req.body;
    await prisma.customer.updateMany({
      where: { merchantId, phone: customerPhone },
      data: { tags: 'wa_invalid|manual_optout' },
    });
    res.json({ success: true, message: `${customerPhone} opted out` });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── 6. Media proxy — fetch media from Meta and stream to client ──────────────
// GET /api/inbox/media/:messageId
// Why proxy? Meta media URLs are temporary (expire after ~5 min)
// We fetch the URL on-demand each time, then stream bytes to browser
router.get('/media/:messageId', async (req: Request, res: Response): Promise<any> => {
  try {
    const messageId = req.params.messageId as string;

    // Find message with mediaId
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id:            true,
        mediaId:       true,
        mediaType:     true,
        mediaMimeType: true,
        mediaFilename: true,
        merchantId:    true,
      }
    });

    if (!message) return res.status(404).json({ message: 'Message not found' });
    if (!message.mediaId) return res.status(400).json({ message: 'No media attached to this message' });

    // Get merchant access token
    const merchant = await prisma.merchant.findUnique({
      where: { id: message.merchantId },
      select: { metaAccessToken: true }
    });
    if (!merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Meta access token not configured' });
    }

    const axios = await import('axios');
    const headers = { Authorization: `Bearer ${merchant.metaAccessToken}` };

    // Step 1: Get temporary media URL from Meta Graph API
    const urlResp = await axios.default.get(
      `https://graph.facebook.com/v23.0/${message.mediaId}`,
      { headers }
    );
    const mediaUrl: string = urlResp.data?.url;
    if (!mediaUrl) return res.status(500).json({ message: 'Could not get media URL from Meta' });

    // Step 2: Download media bytes from the temporary URL
    const mediaResp = await axios.default.get(mediaUrl, {
      headers,
      responseType: 'stream',
      timeout: 15000,
    });

    // Set appropriate response headers
    const mimeType = message.mediaMimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 min browser cache

    if (message.mediaType === 'document' && message.mediaFilename) {
      res.setHeader('Content-Disposition', `inline; filename="${message.mediaFilename}"`);
    }

    // Stream bytes directly to client
    mediaResp.data.pipe(res);

  } catch (e: any) {
    console.error('Media proxy error:', e.response?.data || e.message);
    res.status(500).json({ message: e.response?.data?.error?.message || e.message });
  }
});

export { isStopKeyword };
export default router;
