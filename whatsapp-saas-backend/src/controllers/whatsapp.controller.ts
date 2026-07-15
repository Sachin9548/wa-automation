// src/controllers/whatsapp.controller.ts
// Simplified — no QR codes, no sessions.
// WhatsApp is now connected via Meta Cloud API credentials entered by admin.

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';

// Returns whether the merchant's Meta credentials are configured
export const getWhatsAppStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { status: true, metaPhoneNumberId: true }
    });

    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });

    const configured = !!(merchant.metaPhoneNumberId);
    return res.status(200).json({
      status: configured ? 'CONNECTED' : 'NOT_CONFIGURED',
      connected: configured
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
