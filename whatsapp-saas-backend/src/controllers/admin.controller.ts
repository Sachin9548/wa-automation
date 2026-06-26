// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyShopifyToken } from '../services/shopify.service';
import { messageQueue } from '../lib/queue';

// 1. Merchant ko Activate karna (Token verify + 30 Days Expiry set karna)
export const activateMerchant = async (req: Request, res: Response): Promise<any> => {
  try {
    // 🚨 FIX: shopifySecret ko bhi body se nikaalein
    const { merchantId, category, shopifyToken, storeUrl, shopifySecret } = req.body;

    // 1. Shopify Verification
    const isValid = await verifyShopifyToken(storeUrl, shopifyToken);
    if (!isValid) {
      return res.status(400).json({ message: "❌ Invalid Shopify Token or Store URL." });
    }

    // 2. Expiry Calculation
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    // 3. Database Update
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        status: 'ACTIVE',
        category: category || 'ECOMMERCE',
        shopifyToken: shopifyToken,
        shopifySecret: shopifySecret, 
        storeUrl: storeUrl,
        subscriptionExpiry: expiryDate,
      }
    });

    res.status(200).json({ message: "✅ Activated!", brand: updatedMerchant.brandName });
  } catch (error) {
    console.error('Activation Error:', error);
    res.status(500).json({ message: 'Error activating merchant' });
  }
};

// 2. Extend Subscription (Manually days badhana)
export const extendSubscription = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, days } = req.body;

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });

    // Agar pehle se active hai toh aage badhao, nahi toh aaj se start karo
    const currentExpiry = merchant.subscriptionExpiry && merchant.subscriptionExpiry > new Date()
      ? merchant.subscriptionExpiry
      : new Date();

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));

    const updated = await prisma.merchant.update({
      where: { id: merchantId },
      data: { subscriptionExpiry: newExpiry, status: 'ACTIVE' }
    });

    res.status(200).json({ message: `✅ Subscription extended until ${newExpiry.toDateString()}`, expiry: newExpiry });
  } catch (error) {
    console.error('Extend Sub Error:', error);
    res.status(500).json({ message: "Error extending subscription" });
  }
};

// 3. Wallet Update (Credits Add karna)
export const addCredits = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, amount } = req.body;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        walletBalance: { increment: parseFloat(amount) },
        totalPaidAmount: { increment: parseFloat(amount) }
      }
    });

    res.status(200).json({
      message: `💰 Added ₹${amount} to ${updatedMerchant.brandName}'s wallet.`,
      currentBalance: updatedMerchant.walletBalance
    });
  } catch (error) {
    console.error('Add Credits Error:', error);
    res.status(500).json({ message: 'Error adding credits' });
  }
};

// 4. Admin Dashboard Stats (Overall Earnings & Counts)
export const getAdminStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchants = await prisma.merchant.findMany();

    const totalRevenue = merchants.reduce((acc, m) => acc + (m.totalPaidAmount || 0), 0);
    const activeMerchants = merchants.filter(m => m.status === 'ACTIVE').length;

    res.status(200).json({
      totalEarnings: totalRevenue,
      totalActiveClients: activeMerchants,
      totalRegistered: merchants.length
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

// 5. Get All Merchants List (For Admin Panel Table)
export const getAllMerchants = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true,
        brandName: true,
        email: true,
        phone: true,
        status: true,
        plan: true,
        walletBalance: true,
        whatsappConnected: true,
        storeUrl: true,
        subscriptionExpiry: true, // 👈 Added this to see in Admin table
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.status(200).json({ merchants });
  } catch (error) {
    console.error('Fetch All Merchants Error:', error);
    res.status(500).json({ message: 'Server error while fetching merchants' });
  }
};

export const launchCampaign = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, campaignName, template } = req.body;

    if (!merchantId || !campaignName || !template) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // 1. Merchant aur uske saare customers ko nikaalo
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || merchant.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Merchant is not active' });
    }

    const customers = await prisma.customer.findMany({
      where: { merchantId }
    });

    if (customers.length === 0) {
      return res.status(400).json({ message: 'No customers found. Sync them first!' });
    }

    // 2. Database mein Campaign record banayein
    const campaign = await prisma.campaign.create({
      data: {
        merchantId,
        name: campaignName,
        template,
        status: 'SENDING',
        totalRecipients: customers.length
      }
    });

    // 3. Queue mein saare messages daal dein (BullMQ 15-15 sec ke gap me khud bhejega)
    for (const customer of customers) {
      // Template mein naam replace karo
      const realStoreUrl = `https://${merchant.storeUrl}`;
      const trackingUrl = `http://localhost:5000/api/tracking/go?m_id=${merchant.id}&type=CAMPAIGN&url=${encodeURIComponent(realStoreUrl)}`;
      const customizedMessage = template
        .replace('{{name}}', customer.name || 'there')
        .replace('{{link}}', trackingUrl); // 👈 Link variable replace ho gaya!

      await messageQueue.add('send-campaign-msg', {
        campaignId: campaign.id,
        merchantId: merchantId,
        phone: customer.phone,
        message: customizedMessage
      });
    }

    res.status(200).json({
      message: `🚀 Campaign '${campaignName}' launched!`,
      totalQueued: customers.length
    });

  } catch (error) {
    console.error('Campaign Launch Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};