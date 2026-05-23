import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Route: GET /api/tracking/go?m_id=xxx&url=xxx&type=xxx
router.get('/go', async (req: any, res: any) => {
  const { m_id, url, type } = req.query;

  if (!m_id || !url) {
    return res.redirect('/'); // Agar data missing ho toh home page pe bhej do
  }

  try {
    // 1. Log Click Detail (For deep analytics)
    await prisma.click.create({
      data: {
        merchantId: m_id as string,
        type: (type as string) || 'GENERAL',
        linkUrl: url as string
      }
    });

    // 2. Increment Counter (For Dashboard Quick Stats)
    await prisma.merchant.update({
      where: { id: m_id as string },
      data: { totalClicked: { increment: 1 } }
    });

    // 3. 🚀 Redirect to Shopify Cart
    res.redirect(url as string);
  } catch (error) {
    console.error("Click Tracking Error:", error);
    res.redirect(url as string); // Error aaye toh bhi user ka nuksan na ho, redirect kar do
  }
});

export default router;