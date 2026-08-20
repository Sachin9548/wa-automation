// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyShopifyToken } from '../services/shopify.service';
import { messageQueue } from '../lib/queue';

// 1. Merchant ko Activate karna
export const activateMerchant = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, category, shopifyToken, storeUrl, shopifySecret,
            metaPhoneNumberId, metaAccessToken, metaWabaId } = req.body;

    // Verify Shopify token
    const isValid = await verifyShopifyToken(storeUrl, shopifyToken);
    if (!isValid) {
      return res.status(400).json({ message: "❌ Invalid Shopify Token or Store URL." });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        status: 'ACTIVE',
        category: category || 'ECOMMERCE',
        shopifyToken,
        shopifySecret,
        storeUrl,
        subscriptionExpiry: expiryDate,
        // Meta Cloud API credentials
        ...(metaPhoneNumberId && { metaPhoneNumberId }),
        ...(metaAccessToken && { metaAccessToken }),
        ...(metaWabaId && { metaWabaId }),
        // Mark WhatsApp as connected if Meta credentials provided
        whatsappConnected: !!(metaPhoneNumberId && metaAccessToken),
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

// 3. Record Payment (subscription amount note karna — sirf record ke liye)
export const recordPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, amount } = req.body;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        totalPaidAmount: { increment: parseFloat(amount) }
      }
    });

    res.status(200).json({
      message: `✅ Payment of ₹${amount} recorded for ${updatedMerchant.brandName}.`,
      totalPaid: updatedMerchant.totalPaidAmount
    });
  } catch (error) {
    console.error('Record Payment Error:', error);
    res.status(500).json({ message: 'Error recording payment' });
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
        totalPaidAmount: true,
        isFree: true,
        serviceActive: true,
        whatsappConnected: true,
        storeUrl: true,
        subscriptionExpiry: true,
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
    const rawStoreUrl = merchant.storeUrl || '';
    const realStoreUrl = rawStoreUrl.startsWith('http')
      ? rawStoreUrl
      : rawStoreUrl ? `https://${rawStoreUrl}` : 'https://your-store.myshopify.com';

    for (const customer of customers) {
      await messageQueue.add('send-campaign-msg', {
        campaignId: campaign.id,
        merchantId: merchantId,
        phone: customer.phone,
        templateName: 'bulk_campaign',
        variables: [customer.name || 'there', realStoreUrl]
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

// 6. Get single merchant detail (for merchant hub page)
export const getMerchantDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true, brandName: true, email: true, phone: true,
        status: true, plan: true,
        whatsappConnected: true, storeUrl: true,
        subscriptionExpiry: true, category: true,
        totalSent: true, totalRead: true, totalClicked: true,
        totalConverted: true, recoveredRevenue: true, totalPaidAmount: true, createdAt: true,
        metaPhoneNumberId: true, metaWabaId: true,
        metaAccessToken: true,
        shopifyToken: true,
        shopifySecret: true,
        shopifyClientId: true,
        shopifyClientSecret: true,
        serviceActive: true,
        isFree: true,
        _count: { select: { customers: true, campaigns: true, abandonedCarts: true } }
      }
    });
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
    res.status(200).json({ merchant });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching merchant detail' });
  }
};

// 7. Get campaigns for a merchant
export const getMerchantCampaigns = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const campaigns = await prisma.campaign.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.status(200).json({ campaigns });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching campaigns' });
  }
};

// 8. Sync Shopify customers (admin triggered)
export const syncMerchantCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId } = req.body;
    const { syncAllShopifyCustomers } = await import('../services/shopify/customer.service');
    const count = await syncAllShopifyCustomers(merchantId);
    res.status(200).json({ message: `✅ Synced ${count} customers!`, total: count });
  } catch (error: any) {
    console.error('Sync Error:', error);
    res.status(500).json({ message: error.message || 'Sync failed' });
  }
};

// 9. Admin: Get flows for a specific merchant
export const getMerchantFlows = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const flows = await prisma.automationFlow.findMany({
      where: { merchantId },
      orderBy: { delayMinutes: 'asc' }
    });
    res.status(200).json({ flows });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching flows' });
  }
};

// 10. Admin: Save/update a flow for a merchant
export const saveMerchantFlow = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, type, delayMinutes, template, isActive, metaTemplateName, metaTemplateLang } = req.body;
    if (!merchantId || !type || delayMinutes === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const flow = await prisma.automationFlow.upsert({
      where: { merchantId_type: { merchantId, type } },
      update: {
        delayMinutes: parseInt(delayMinutes),
        template: template || '',
        metaTemplateName: metaTemplateName || null,
        metaTemplateLang: metaTemplateLang || 'en_US',
        isActive
      },
      create: {
        merchantId,
        type,
        delayMinutes: parseInt(delayMinutes),
        template: template || '',
        metaTemplateName: metaTemplateName || null,
        metaTemplateLang: metaTemplateLang || 'en_US',
        isActive
      }
    });
    res.status(200).json({ message: 'Flow saved!', flow });
  } catch (error) {
    console.error('Save Flow Error:', error);
    res.status(500).json({ message: 'Error saving flow' });
  }
};

// 11. Admin: Toggle a flow on/off for a merchant
export const toggleMerchantFlow = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, type, isActive } = req.body;
    const result = await prisma.automationFlow.updateMany({
      where: { merchantId, type },
      data: { isActive }
    });
    if (result.count === 0) return res.status(404).json({ message: 'Flow not found' });
    res.status(200).json({ message: `Flow ${isActive ? 'enabled' : 'disabled'}!` });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling flow' });
  }
};

// 12. Admin: Get customers list for a merchant (with pagination)
export const getMerchantCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const where: any = { merchantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { lastOrderDate: 'desc' } }),
      prisma.customer.count({ where })
    ]);

    res.status(200).json({ customers, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers' });
  }
};

// 13. Toggle service ON/OFF for a merchant (manual admin control)
export const toggleMerchantService = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, serviceActive } = req.body;
    if (!merchantId || serviceActive === undefined) {
      return res.status(400).json({ message: 'merchantId and serviceActive required' });
    }
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { serviceActive } as any
    });
    res.status(200).json({
      message: `✅ Service ${serviceActive ? 'enabled' : 'paused'} for ${merchant.brandName}`,
      serviceActive
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling service' });
  }
};

// 14. Set merchant as free
export const setMerchantFree = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, isFree } = req.body;
    if (!merchantId || isFree === undefined) {
      return res.status(400).json({ message: 'merchantId and isFree required' });
    }
    const merchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { isFree } as any
    });
    res.status(200).json({
      message: `✅ Merchant ${merchant.brandName} marked as ${isFree ? 'FREE' : 'PAID'}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating merchant type' });
  }
};

// 15. Add payment record for a merchant
export const addPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, amount, planDays, note } = req.body;
    if (!merchantId || amount === undefined || !planDays) {
      return res.status(400).json({ message: 'merchantId, amount, planDays required' });
    }

    // Save payment record
    const payment = await (prisma as any).payment.create({
      data: {
        merchantId,
        amount: parseFloat(amount),
        planDays: parseInt(planDays),
        note: note || null,
      }
    });

    // Update totalPaidAmount + extend subscription
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    const currentExpiry = merchant?.subscriptionExpiry && merchant.subscriptionExpiry > new Date()
      ? merchant.subscriptionExpiry
      : new Date();

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(planDays));

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        totalPaidAmount: { increment: parseFloat(amount) },
        subscriptionExpiry: newExpiry,
        serviceActive: true as any, // auto-enable service on payment
      } as any
    });

    res.status(200).json({
      message: `✅ Payment of ₹${amount} recorded. Service active until ${newExpiry.toDateString()}.`,
      payment,
      newExpiry
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ message: 'Error recording payment' });
  }
};

// 16. Get payment history for a merchant
export const getPaymentHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const payments = await (prisma as any).payment.findMany({
      where: { merchantId },
      orderBy: { paidAt: 'desc' }
    });
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payments' });
  }
};
