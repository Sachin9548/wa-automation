// src/controllers/merchant.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma'; 
import { syncAllShopifyCustomers } from '../services/shopify/customer.service';

export const getMe = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true,
        brandName: true,
        email: true,
        phone: true,
        storeUrl: true,
        plan: true,
        status: true,
        whatsappConnected: true,
        subscriptionExpiry: true,
        createdAt: true,
      }
    });
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
    res.status(200).json({ merchant });
  } catch (error) {
    console.error('Get Merchant Profile Error:', error);
    res.status(500).json({ message: 'Server error while fetching profile' });
  }
};

export const updateOnboardingData = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { storeUrl } = req.body;
    const merchantId = req.user.merchantId;

    if (!storeUrl) {
      return res.status(400).json({ message: 'Store URL is required.' });
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        storeUrl: storeUrl,
      }
    });

    res.status(200).json({ message: 'Onboarding data saved successfully!' });
  } catch (error) {
    console.error('Onboarding Update Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const triggerCustomerSync = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    
    // Background me sync chalu kar do
    // Note: Bada data hai toh res.json pehle bhej sakte hain par abhi simple rakhte hain
    const count = await syncAllShopifyCustomers(merchantId);
    
    res.status(200).json({ message: "Sync Completed", total: count });
  } catch (error) {
    res.status(500).json({ message: "Sync failed" });
  }
};

export const getMerchantStats = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;

    const stats = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        totalSent: true,
        totalRead: true,
        totalClicked: true,
        totalConverted: true,
        recoveredRevenue: true,
        subscriptionExpiry: true,
        brandName: true,
        status: true,
        plan: true
      }
    });

    if (!stats) return res.status(404).json({ message: "Merchant not found" });

    const openRate = stats.totalSent > 0
      ? ((stats.totalRead / stats.totalSent) * 100).toFixed(1)
      : "0.0";

    const clickRate = stats.totalSent > 0
      ? ((stats.totalClicked / stats.totalSent) * 100).toFixed(1)
      : "0.0";

    res.status(200).json({ ...stats, openRate, clickRate });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};