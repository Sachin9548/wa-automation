// src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyShopifyToken } from '../services/shopify.service';
import { messageQueue } from '../lib/queue';

// ── Activity Log helper ────────────────────────────────────────────────────────
// Fire-and-forget — never blocks the main response
export const logActivity = async (
  merchantId: string,
  action: string,
  description: string,
  metadata?: Record<string, any>
) => {
  try {
    await prisma.activityLog.create({
      data: {
        merchantId,
        action,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        actor: 'Admin',
      }
    });
  } catch (e) {
    // Non-critical — log to console but never throw
    console.error('ActivityLog write failed:', e);
  }
};

// 1. Merchant ko Activate karna
export const activateMerchant = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, category, shopifyToken, storeUrl, shopifySecret,
            metaPhoneNumberId, metaAccessToken, metaWabaId } = req.body;

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
        ...(metaPhoneNumberId && { metaPhoneNumberId }),
        ...(metaAccessToken && { metaAccessToken }),
        ...(metaWabaId && { metaWabaId }),
        whatsappConnected: !!(metaPhoneNumberId && metaAccessToken),
      }
    });

    logActivity(merchantId, 'MERCHANT_ACTIVATED',
      `Merchant '${updatedMerchant.brandName}' activated. Store: ${storeUrl}. WhatsApp: ${!!(metaPhoneNumberId && metaAccessToken) ? 'Connected' : 'Not configured'}`,
      { storeUrl, category, waConnected: !!(metaPhoneNumberId && metaAccessToken) }
    );

    res.status(200).json({ message: "✅ Activated!", brand: updatedMerchant.brandName });
  } catch (error) {
    console.error('Activation Error:', error);
    res.status(500).json({ message: 'Error activating merchant' });
  }
};

// 2. Extend Subscription
export const extendSubscription = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, days } = req.body;

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return res.status(404).json({ message: "Merchant not found" });

    const currentExpiry = merchant.subscriptionExpiry && merchant.subscriptionExpiry > new Date()
      ? merchant.subscriptionExpiry : new Date();

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(days));

    await prisma.merchant.update({
      where: { id: merchantId },
      data: { subscriptionExpiry: newExpiry, status: 'ACTIVE' }
    });

    logActivity(merchantId, 'SUBSCRIPTION_EXTENDED',
      `Subscription extended by ${days} days. New expiry: ${newExpiry.toDateString()}`,
      { days: parseInt(days), newExpiry }
    );

    res.status(200).json({ message: `✅ Subscription extended until ${newExpiry.toDateString()}`, expiry: newExpiry });
  } catch (error) {
    console.error('Extend Sub Error:', error);
    res.status(500).json({ message: "Error extending subscription" });
  }
};

// 3. Record Payment (legacy — sirf totalPaidAmount increment)
export const recordPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, amount } = req.body;

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchantId },
      data: { totalPaidAmount: { increment: parseFloat(amount) } }
    });

    logActivity(merchantId, 'PAYMENT_RECORDED',
      `Payment of ₹${amount} recorded. Total paid: ₹${updatedMerchant.totalPaidAmount}`,
      { amount: parseFloat(amount) }
    );

    res.status(200).json({
      message: `✅ Payment of ₹${amount} recorded for ${updatedMerchant.brandName}.`,
      totalPaid: updatedMerchant.totalPaidAmount
    });
  } catch (error) {
    console.error('Record Payment Error:', error);
    res.status(500).json({ message: 'Error recording payment' });
  }
};

// 4. Admin Dashboard Stats
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

// 5. Get All Merchants List
export const getAllMerchants = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchants = await prisma.merchant.findMany({
      select: {
        id: true, brandName: true, email: true, phone: true,
        status: true, plan: true, totalPaidAmount: true,
        isFree: true, serviceActive: true, whatsappConnected: true,
        storeUrl: true, subscriptionExpiry: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ merchants });
  } catch (error) {
    console.error('Fetch All Merchants Error:', error);
    res.status(500).json({ message: 'Server error while fetching merchants' });
  }
};

// 6. Launch Campaign
export const launchCampaign = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      merchantId, campaignName, template,
      metaTemplateName, metaTemplateLang,
      discountCode, scheduledAt, customerFilter,
    } = req.body;

    if (!merchantId || !campaignName || !metaTemplateName) {
      return res.status(400).json({ message: 'merchantId, campaignName, metaTemplateName are required' });
    }

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant || merchant.status !== 'ACTIVE') {
      return res.status(400).json({ message: 'Merchant is not active' });
    }
    if (!merchant.metaPhoneNumberId || !merchant.metaAccessToken) {
      return res.status(400).json({ message: 'Meta credentials not configured' });
    }

    const whereClause: any = {
      merchantId,
      NOT: [
        { phone: 'NO_PHONE' }, { phone: '' },
        { phone: { startsWith: 'email:' } },
        { tags: { contains: 'wa_invalid' } },
      ]
    };
    if (customerFilter === 'abandoned') whereClause.hasAbandonedCart = true;
    if (customerFilter === 'ordered')   whereClause.hasPlacedOrder   = true;

    const customers = await prisma.customer.findMany({
      where: whereClause,
      select: { id: true, phone: true, name: true }
    });

    if (customers.length === 0) {
      return res.status(400).json({ message: 'No eligible customers (all may have no phone or opted out).' });
    }

    const isScheduled   = !!scheduledAt;
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    const now           = Date.now();
    const scheduleDelay = scheduledDate ? Math.max(0, scheduledDate.getTime() - now) : 0;

    if (scheduledDate && scheduledDate.getTime() <= now) {
      return res.status(400).json({ message: 'Scheduled time must be in the future' });
    }

    const campaign = await prisma.campaign.create({
      data: {
        merchantId,
        name:             campaignName,
        template:         template || `[Template: ${metaTemplateName}]`,
        metaTemplateName,
        metaTemplateLang: metaTemplateLang || 'en_US',
        discountCode:     discountCode || null,
        scheduledAt:      scheduledDate,
        status:           isScheduled ? 'SCHEDULED' : 'SENDING',
        totalRecipients:  customers.length,
      }
    });

    for (let i = 0; i < customers.length; i++) {
      await messageQueue.add('send-campaign-msg', {
        campaignId:   campaign.id,
        merchantId,
        phone:        customers[i].phone,
        templateName: metaTemplateName,
        templateLang: metaTemplateLang || 'en_US',
        variables:    [customers[i].name || 'there'],
        discountCode: discountCode || null,
      }, {
        delay:    scheduleDelay + (i * 15000),
        attempts: 2,
        backoff:  { type: 'exponential', delay: 30000 },
      });
    }

    const etaMinutes = Math.ceil((customers.length * 15) / 60);

    logActivity(merchantId,
      isScheduled ? 'CAMPAIGN_SCHEDULED' : 'CAMPAIGN_LAUNCHED',
      isScheduled
        ? `Campaign '${campaignName}' scheduled for ${scheduledDate!.toLocaleString('en-IN')} — ${customers.length} recipients, template: ${metaTemplateName}`
        : `Campaign '${campaignName}' launched — ${customers.length} recipients, template: ${metaTemplateName}${discountCode ? `, discount: ${discountCode}` : ''}`,
      { campaignId: campaign.id, recipients: customers.length, metaTemplateName, discountCode, scheduledAt }
    );

    res.status(200).json({
      message: isScheduled
        ? `📅 Campaign '${campaignName}' scheduled for ${scheduledDate!.toLocaleString('en-IN')}!`
        : `🚀 Campaign '${campaignName}' launched!`,
      totalQueued: customers.length,
      campaignId:  campaign.id,
      scheduledAt: scheduledDate,
      etaMinutes,
    });

  } catch (error: any) {
    console.error('Campaign Launch Error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

// 7. Get single merchant detail
export const getMerchantDetail = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        id: true, brandName: true, email: true, phone: true,
        status: true, plan: true, whatsappConnected: true, storeUrl: true,
        subscriptionExpiry: true, category: true,
        totalSent: true, totalRead: true, totalClicked: true,
        totalConverted: true, recoveredRevenue: true, totalPaidAmount: true, createdAt: true,
        metaPhoneNumberId: true, metaWabaId: true, metaAccessToken: true,
        shopifyToken: true, shopifySecret: true, shopifyClientId: true, shopifyClientSecret: true,
        serviceActive: true, isFree: true,
        _count: { select: { customers: true, campaigns: true, abandonedCarts: true } }
      }
    });
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });
    res.status(200).json({ merchant });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching merchant detail' });
  }
};

// 8. Get campaigns for a merchant
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

// 9. Sync Shopify customers (quick sync)
export const syncMerchantCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId } = req.body;
    const { syncAllShopifyCustomers } = await import('../services/shopify/customer.service');
    const count = await syncAllShopifyCustomers(merchantId);

    logActivity(merchantId, 'CUSTOMER_SYNCED',
      `Quick sync completed — ${count} customers synced from Shopify`,
      { count }
    );

    res.status(200).json({ message: `✅ Synced ${count} customers!`, total: count });
  } catch (error: any) {
    console.error('Sync Error:', error);
    res.status(500).json({ message: error.message || 'Sync failed' });
  }
};

// 10. Get flows for a merchant
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

// 11. Save/update a flow
export const saveMerchantFlow = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, type, delayMinutes, template, isActive, metaTemplateName, metaTemplateLang, discountCode } = req.body;
    if (!merchantId || !type || delayMinutes === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const flow = await prisma.automationFlow.upsert({
      where: { merchantId_type: { merchantId, type } },
      update: {
        delayMinutes: parseInt(delayMinutes), template: template || '',
        metaTemplateName: metaTemplateName || null, metaTemplateLang: metaTemplateLang || 'en_US',
        discountCode: discountCode || null, isActive
      },
      create: {
        merchantId, type, delayMinutes: parseInt(delayMinutes), template: template || '',
        metaTemplateName: metaTemplateName || null, metaTemplateLang: metaTemplateLang || 'en_US',
        discountCode: discountCode || null, isActive
      }
    });

    logActivity(merchantId, 'FLOW_SAVED',
      `Flow '${type}' saved — template: ${metaTemplateName || 'none'}, delay: ${delayMinutes} min, status: ${isActive ? 'ACTIVE' : 'INACTIVE'}${discountCode ? `, discount: ${discountCode}` : ''}`,
      { type, delayMinutes: parseInt(delayMinutes), metaTemplateName, isActive, discountCode }
    );

    res.status(200).json({ message: 'Flow saved!', flow });
  } catch (error) {
    console.error('Save Flow Error:', error);
    res.status(500).json({ message: 'Error saving flow' });
  }
};

// 12. Toggle flow on/off
export const toggleMerchantFlow = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, type, isActive } = req.body;
    const result = await prisma.automationFlow.updateMany({
      where: { merchantId, type },
      data: { isActive }
    });
    if (result.count === 0) return res.status(404).json({ message: 'Flow not found' });

    logActivity(merchantId, 'FLOW_TOGGLED',
      `Flow '${type}' ${isActive ? 'ENABLED ✅' : 'DISABLED ⏸️'}`,
      { type, isActive }
    );

    res.status(200).json({ message: `Flow ${isActive ? 'enabled' : 'disabled'}!` });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling flow' });
  }
};

// 13. Get customers list
export const getMerchantCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const page   = parseInt(req.query.page   as string) || 1;
    const limit  = parseInt(req.query.limit  as string) || 50;
    const search = (req.query.search as string) || '';
    const skip   = (page - 1) * limit;

    const where: any = { merchantId };
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
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

// 14. Toggle service ON/OFF
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

    logActivity(merchantId, 'SERVICE_TOGGLED',
      `Service ${serviceActive ? 'RESUMED ▶️' : 'PAUSED ⏸️'} for '${merchant.brandName}'`,
      { serviceActive }
    );

    res.status(200).json({
      message: `✅ Service ${serviceActive ? 'enabled' : 'paused'} for ${merchant.brandName}`,
      serviceActive
    });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling service' });
  }
};

// 15. Set merchant as free/paid
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

    logActivity(merchantId, 'MERCHANT_FREE_SET',
      `Merchant '${merchant.brandName}' marked as ${isFree ? 'FREE 🎁' : 'PAID 💳'}`,
      { isFree }
    );

    res.status(200).json({
      message: `✅ Merchant ${merchant.brandName} marked as ${isFree ? 'FREE' : 'PAID'}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating merchant type' });
  }
};

// 16. Add payment record
export const addPayment = async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, amount, planDays, note } = req.body;
    if (!merchantId || amount === undefined || !planDays) {
      return res.status(400).json({ message: 'merchantId, amount, planDays required' });
    }

    const payment = await (prisma as any).payment.create({
      data: {
        merchantId,
        amount:   parseFloat(amount),
        planDays: parseInt(planDays),
        note:     note || null,
      }
    });

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    const currentExpiry = merchant?.subscriptionExpiry && merchant.subscriptionExpiry > new Date()
      ? merchant.subscriptionExpiry : new Date();

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + parseInt(planDays));

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        totalPaidAmount: { increment: parseFloat(amount) },
        subscriptionExpiry: newExpiry,
        serviceActive: true as any,
      } as any
    });

    logActivity(merchantId, 'PAYMENT_ADDED',
      `Payment of ₹${amount} received — ${planDays} days plan. Service active until ${newExpiry.toDateString()}${note ? `. Note: ${note}` : ''}`,
      { amount: parseFloat(amount), planDays: parseInt(planDays), newExpiry, note }
    );

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

// 17. Get payment history
export const getPaymentHistory = async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const payments = await (prisma as any).payment.findMany({
      where: { merchantId },
      orderBy: { paidAt: 'desc' },
      take: 20,
    });
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment history' });
  }
};
