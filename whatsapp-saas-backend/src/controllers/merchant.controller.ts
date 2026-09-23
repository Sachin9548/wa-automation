// src/controllers/merchant.controller.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import prisma from "../lib/prisma";
import { syncAllShopifyCustomers } from "../services/shopify/customer.service";

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
        inboxEnabled: true,

      },
    });
    if (!merchant)
      return res.status(404).json({ message: "Merchant not found" });
    res.status(200).json({ merchant });
  } catch (error) {
    console.error("Get Merchant Profile Error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

export const updateOnboardingData = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const { storeUrl } = req.body;
    const merchantId = req.user.merchantId;

    if (!storeUrl) {
      return res.status(400).json({ message: "Store URL is required." });
    }

    await prisma.merchant.update({
      where: { id: merchantId },
      data: {
        storeUrl: storeUrl,
      },
    });

    res.status(200).json({ message: "Onboarding data saved successfully!" });
  } catch (error) {
    console.error("Onboarding Update Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const triggerCustomerSync = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
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

export const getMerchantStats = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
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
        plan: true,
        inboxEnabled: true,

      },
    });

    if (!stats) return res.status(404).json({ message: "Merchant not found" });

    const openRate =
      stats.totalSent > 0
        ? ((stats.totalRead / stats.totalSent) * 100).toFixed(1)
        : "0.0";

    const clickRate =
      stats.totalSent > 0
        ? ((stats.totalClicked / stats.totalSent) * 100).toFixed(1)
        : "0.0";

    res.status(200).json({ ...stats, openRate, clickRate });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};

export const getMerchantAnalytics = async (
  req: AuthRequest,
  res: Response,
): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const days = parseInt(req.query.days as string) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [
      totalSent,
      totalDelivered,
      totalRead,
      totalFailed,
      failedMessages,
      trackingLinks,
      discountConversions,
      merchant,
    ] = await Promise.all([
      // Total sent
      prisma.message.count({
        where: {
          merchantId,
          direction: "OUTGOING",
          timestamp: { gte: since },
        },
      }),
      // Delivered
      // Delivered
      prisma.message.count({
        where: {
          merchantId,
          direction: "OUTGOING",
          status: "DELIVERED",
          timestamp: { gte: since },
        },
      }),

      // Read (opened)
      prisma.message.count({
        where: {
          merchantId,
          direction: "OUTGOING",
          status: "READ",
          timestamp: { gte: since },
        },
      }),

      // Failed
      prisma.message.count({
        where: {
          merchantId,
          direction: "OUTGOING",
          status: "FAILED",
          timestamp: { gte: since },
        },
      }),

      // Failed messages with reasons
      prisma.message.findMany({
        where: {
          merchantId,
          direction: "OUTGOING",
          status: "FAILED",
          timestamp: { gte: since },
        },
        select: {
          id: true,
          customerPhone: true,
          failReason: true,
          timestamp: true,
          templateName: true,
        },
        orderBy: { timestamp: "desc" },
        take: 50,
      }),

      // Tracking links analytics
      (prisma as any).trackingLink.findMany({
        where: { merchantId, createdAt: { gte: since } },
        orderBy: { createdAt: "desc" },
      }),

      // Discount code conversions
      (prisma as any).trackingLink.groupBy({
        by: ["discountCode"],
        where: {
          merchantId,
          converted: true,
          discountCode: { not: null },
          createdAt: { gte: since },
        },
        _count: { id: true },
        _sum: { convertedRevenue: true },
      }),

      // Merchant overall stats
      prisma.merchant.findUnique({
        where: { id: merchantId },
        select: {
          totalSent: true,
          totalRead: true,
          totalClicked: true,
          totalConverted: true,
          recoveredRevenue: true,
        },
      }),
    ]);

    // Calculate click + conversion metrics from tracking links
    const clicked = trackingLinks.filter((l: any) => l.clicked).length;
    const converted = trackingLinks.filter((l: any) => l.converted).length;
    const clickRevenue = trackingLinks
      .filter((l: any) => l.clicked && l.convertedRevenue)
      .reduce((s: number, l: any) => s + (l.convertedRevenue || 0), 0);
    const totalRevenue = trackingLinks
      .filter((l: any) => l.converted)
      .reduce((s: number, l: any) => s + (l.convertedRevenue || 0), 0);

    // Fail reason summary
    const failReasons: Record<string, number> = {};
    failedMessages.forEach((m: any) => {
      const reason = m.failReason || "Unknown";
      failReasons[reason] = (failReasons[reason] || 0) + 1;
    });

    res.status(200).json({
      period: `Last ${days} days`,
      messages: {
        sent: totalSent,
        delivered: totalDelivered,
        read: totalRead,
        failed: totalFailed,
        deliveryRate:
          totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : "0",
        openRate:
          totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : "0",
      },
      clicks: {
        total: clicked,
        converted,
        clickRate:
          totalSent > 0 ? ((clicked / totalSent) * 100).toFixed(1) : "0",
        conversionRate:
          clicked > 0 ? ((converted / clicked) * 100).toFixed(1) : "0",
        revenueFromClicks: clickRevenue,
      },
      revenue: {
        total: totalRevenue,
        byDiscountCode: discountConversions,
      },
      failedMessages: {
        total: totalFailed,
        reasons: failReasons,
        recent: failedMessages,
      },
      allTime: merchant,
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};


export const getMerchantConversations = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { inboxEnabled: true } });
    if (!merchant?.inboxEnabled) return res.status(403).json({ message: 'Inbox access not enabled. Contact your account manager.' });

    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const phoneFilter: any = { merchantId };
    if (search) phoneFilter.customerPhone = { contains: search };

    const distinctPhones = await prisma.message.findMany({
      where: phoneFilter,
      select: { customerPhone: true },
      distinct: ['customerPhone'],
      orderBy: { timestamp: 'desc' },
      skip, take: limit,
    });

    const totalPhones = await prisma.message.findMany({
      where: phoneFilter, select: { customerPhone: true }, distinct: ['customerPhone'],
    });

    const conversations = await Promise.all(
      distinctPhones.map(async ({ customerPhone }) => {
        const [lastMsg, unreadCount, customer] = await Promise.all([
          prisma.message.findFirst({ where: { merchantId, customerPhone }, orderBy: { timestamp: 'desc' }, select: { content: true, direction: true, timestamp: true, status: true } }),
          prisma.message.count({ where: { merchantId, customerPhone, direction: 'INCOMING', status: { not: 'READ' } } }),
          prisma.customer.findFirst({ where: { merchantId, phone: customerPhone }, select: { name: true } }),
        ]);
        const lastIncoming = await prisma.message.findFirst({ where: { merchantId, customerPhone, direction: 'INCOMING' }, orderBy: { timestamp: 'desc' }, select: { timestamp: true } });
        const msElapsed = lastIncoming ? Date.now() - new Date(lastIncoming.timestamp).getTime() : Infinity;
        const canSendFreeText = msElapsed < 24 * 60 * 60 * 1000;
        const isOptedOut = customer ? await prisma.customer.findFirst({ where: { merchantId, phone: customerPhone, tags: { contains: 'wa_invalid' } } }) !== null : false;
        return {
          customerPhone, customerName: customer?.name || null,
          lastMessage: lastMsg?.content || '', lastDirection: lastMsg?.direction || 'OUTGOING',
          lastTimestamp: lastMsg?.timestamp || null, unreadCount, canSendFreeText, isOptedOut,
          windowExpiresAt: lastIncoming ? new Date(new Date(lastIncoming.timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
        };
      })
    );

    conversations.sort((a, b) => new Date(b.lastTimestamp ?? 0).getTime() - new Date(a.lastTimestamp ?? 0).getTime());
    res.json({ conversations, total: totalPhones.length, page, limit });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const getMerchantMessages = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId }, select: { inboxEnabled: true } });
    if (!merchant?.inboxEnabled) return res.status(403).json({ message: 'Inbox access not enabled.' });

    const customerPhone = typeof req.params.customerPhone === 'string' ? decodeURIComponent(req.params.customerPhone) : '';
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { merchantId, customerPhone },
        orderBy: { timestamp: 'asc' },
        skip, take: limit,
      }),
      prisma.message.count({ where: { merchantId, customerPhone } }),
    ]);

    const customer = await prisma.customer.findFirst({ where: { merchantId, phone: customerPhone }, select: { name: true, tags: true } });
    const lastIncoming = await prisma.message.findFirst({ where: { merchantId, customerPhone, direction: 'INCOMING' }, orderBy: { timestamp: 'desc' }, select: { timestamp: true } });
    const msElapsed = lastIncoming ? Date.now() - new Date(lastIncoming.timestamp).getTime() : Infinity;
    const canSendFreeText = msElapsed < 24 * 60 * 60 * 1000;

    res.json({ messages, total, page, pages: Math.ceil(total / limit), window: { canSendFreeText }, customer });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};

export const sendMerchantReply = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const merchantId = req.user.merchantId;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!(merchant as any)?.inboxEnabled) return res.status(403).json({ message: 'Inbox access not enabled.' });
    if (!merchant?.metaPhoneNumberId || !merchant?.metaAccessToken) return res.status(400).json({ message: 'Meta credentials not configured' });

    const { customerPhone, message } = req.body;
    if (!customerPhone || !message) return res.status(400).json({ message: 'customerPhone and message required' });

    // Check 24hr window
    const lastIncoming = await prisma.message.findFirst({ where: { merchantId, customerPhone, direction: 'INCOMING' }, orderBy: { timestamp: 'desc' } });
    if (!lastIncoming || Date.now() - new Date(lastIncoming.timestamp).getTime() > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: '24hr window closed — can only send templates after window expires' });
    }

    const { sendMetaTextMessage } = await import('../services/whatsapp.service');
    const success = await sendMetaTextMessage(merchant.metaPhoneNumberId, merchant.metaAccessToken, customerPhone, message);
    if (!success) return res.status(500).json({ message: 'Failed to send message' });

    await prisma.message.create({
      data: { merchantId, customerPhone, content: message, direction: 'OUTGOING', status: 'SENT' }
    });
    await prisma.merchant.update({ where: { id: merchantId }, data: { totalSent: { increment: 1 } } });

    res.json({ success: true, message: '✅ Message sent' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
};
