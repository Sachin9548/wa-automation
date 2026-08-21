// src/routes/tracking.routes.ts
// Click tracking — short URL redirect + analytics
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ── Click redirect ────────────────────────────────────────────────────────────
// Customer clicks this URL in WhatsApp message
// We record the click, then redirect to actual cart URL
router.get('/click/:trackingId', async (req: Request, res: Response): Promise<any> => {
  const { trackingId } = req.params;

  try {
    const link = await (prisma as any).trackingLink.findUnique({
      where: { id: trackingId }
    });

    if (!link) {
      return res.status(404).send('Link not found');
    }

    // Record click
    if (!link.clicked) {
      await (prisma as any).trackingLink.update({
        where: { id: trackingId },
        data: { clicked: true, clickedAt: new Date() }
      });

      // Update merchant click count
      await prisma.merchant.update({
        where: { id: link.merchantId },
        data: { totalClicked: { increment: 1 } }
      });

      console.log(`🖱️ Click tracked: ${trackingId} | merchant: ${link.merchantId} | phone: ${link.customerPhone}`);
    }

    // Redirect to original URL (with discount code if present)
    let redirectUrl = link.originalUrl;
    if (link.discountCode && !redirectUrl.includes('discount=')) {
      const sep = redirectUrl.includes('?') ? '&' : '?';
      redirectUrl = `${redirectUrl}${sep}discount=${link.discountCode}`;
    }

    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Tracking click error:', error);
    return res.redirect(302, 'https://wautomation.shop');
  }
});

export default router;
