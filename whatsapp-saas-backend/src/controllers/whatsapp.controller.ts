import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { startWhatsAppSession, qrCodes, sessions, startingSessions } from '../services/whatsapp.service';
import prisma from '../lib/prisma'; // FIXED: Using singleton

export const getWhatsAppStatus = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

    if (merchant?.whatsappConnected) {
      return res.status(200).json({ status: 'CONNECTED' });
    }

    // 🌟 FIX: QR Code check sabse upar! Agar QR ready hai toh turant bhej do
    if (qrCodes.has(merchantId)) {
      return res.status(200).json({ 
        status: 'QR_READY', 
        qrCodeUrl: qrCodes.get(merchantId) 
      });
    }

    if (startingSessions.has(merchantId)) {
      return res.status(200).json({ status: 'STARTING' }); 
    }

    if (!sessions.has(merchantId)) {
      startWhatsAppSession(merchantId); // Background mein start hone do
      return res.status(200).json({ status: 'STARTING' });
    }

    return res.status(200).json({ status: 'WAITING' });

  } catch (error) {
    console.error('QR Status Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};