import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { messageQueue } from '../lib/queue';

export const startCampaign = async (req: Request, res: Response): Promise<any> => {
  try {
    // Admin request body me ye details bhejega
    const { merchantId, campaignName, messageTemplate, customerIds } = req.body;

    if (!merchantId || !campaignName || !messageTemplate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Fetch Merchant (Store URL chahiye tracking link ke liye)
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId }
    });

    if (!merchant || merchant.status !== 'ACTIVE') {
      return res.status(400).json({ message: "Merchant not found or not ACTIVE" });
    }

    // 2. Fetch Customers (SUPER OPTIMIZED: Loop ke bahar 1 hi baar me sab utha lo)
    let customers = [];
    
    // Agar admin ne specific customers select kiye hain (Retargeting)
    if (customerIds && Array.isArray(customerIds) && customerIds.length > 0) {
      customers = await prisma.customer.findMany({
        where: { 
          id: { in: customerIds }, 
          merchantId 
        }
      });
    } else {
      // Agar kuch select nahi kiya, toh SABKO bhej do (Broadcast)
      customers = await prisma.customer.findMany({
        where: { merchantId }
      });
    }

    if (customers.length === 0) {
      return res.status(400).json({ message: "No customers found for this campaign." });
    }

    // 3. Create Campaign Record in Database
    const campaign = await prisma.campaign.create({
      data: {
        merchantId,
        name: campaignName,
        template: messageTemplate,
        totalRecipients: customers.length,
        status: 'SENDING'
      }
    });

    // Clean store URL for the tracking link
    const cleanStoreUrl = merchant.storeUrl ? merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';

    // 4. 🚀 Loop and Push to BullMQ (Memory me chalega, super fast!)
    for (const customer of customers) {
      
      // 'g' (global) flag use kiya hai taaki agar {{name}} do baar ho toh dono change ho jayein
      let finalMessage = messageTemplate.replace(/{{name}}/g, customer.name || "Customer");

      // Agar message me {{link}} likha hai, toh hi Tracking URL lagao
      if (messageTemplate.includes('{{link}}')) {
        // Asli URL ki jagah humara trackable URL jayega (Production me localhost ko live domain se replace karna)
        const trackingUrl = `http://localhost:5000/api/tracking/go?m_id=${merchantId}&type=CAMPAIGN_${campaign.id}&url=${encodeURIComponent('https://' + cleanStoreUrl)}`;
        finalMessage = finalMessage.replace(/{{link}}/g, trackingUrl);
      }

      // Queue me add kar do (Worker aaram se 15-15 sec gap me bhejta rahega)
      await messageQueue.add('send-campaign-msg', {
        merchantId,
        phone: customer.phone,
        message: finalMessage,
        campaignId: campaign.id
      });
    }

    res.status(200).json({ 
      message: `🚀 Campaign '${campaignName}' started successfully!`, 
      campaignId: campaign.id,
      totalQueued: customers.length
    });

  } catch (error) {
    console.error("Campaign Start Error:", error);
    res.status(500).json({ message: "Error starting campaign" });
  }
};