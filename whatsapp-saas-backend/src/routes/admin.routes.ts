// src/routes/admin.routes.ts
import { Router } from "express";
import {
  activateMerchant, recordPayment, extendSubscription,
  getAdminStats, getAllMerchants, launchCampaign,
  getMerchantDetail, getMerchantCampaigns, syncMerchantCustomers,
  getMerchantFlows, saveMerchantFlow, toggleMerchantFlow, getMerchantCustomers,
  toggleMerchantService, setMerchantFree, addPayment, getPaymentHistory,
  logActivity,
} from "../controllers/admin.controller";
import { adminProtect } from "../middleware/admin.middleware";
import { sendMetaTextMessage, sendMetaTemplateMessage } from "../services/whatsapp.service";
import prisma from "../lib/prisma";
import { Request, Response } from "express";

const router = Router();
router.use(adminProtect);

router.get("/merchants", getAllMerchants);
router.get("/merchants/:merchantId", getMerchantDetail);
router.post("/activate", activateMerchant);
router.post("/record-payment", recordPayment);
router.get("/stats", getAdminStats);
router.post('/extend-subscription', extendSubscription);
router.post('/launch-campaign', launchCampaign);
router.get('/campaigns/:merchantId', getMerchantCampaigns);

// ── Cancel a scheduled campaign ───────────────────────────────────────────────
router.post('/campaigns/cancel', async (req: Request, res: Response): Promise<any> => {
  try {
    const { campaignId } = req.body;
    if (!campaignId) return res.status(400).json({ message: 'campaignId required' });

    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (campaign.status !== 'SCHEDULED') {
      return res.status(400).json({ message: `Cannot cancel — campaign is ${campaign.status}` });
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED' }
    });

    logActivity(campaign.merchantId, 'CAMPAIGN_CANCELLED',
      `Scheduled campaign '${campaign.name}' cancelled`,
      { campaignId }
    );

    res.json({ success: true, message: 'Campaign cancelled. Queued jobs will be skipped.' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});
router.post('/sync-customers', syncMerchantCustomers);
router.get('/flows/:merchantId', getMerchantFlows);
router.post('/flows/save', saveMerchantFlow);
router.post('/flows/toggle', toggleMerchantFlow);
router.get('/customers/:merchantId', getMerchantCustomers);
router.post('/toggle-service', toggleMerchantService);
router.post('/set-free', setMerchantFree);
router.post('/add-payment', addPayment);
router.get('/payments/:merchantId', getPaymentHistory);

// ── Full Shopify Sync (background, rate-limit safe) ───────────────────────────
router.post('/full-sync', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId } = req.body;
    if (!merchantId) return res.status(400).json({ message: 'merchantId required' });

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.shopifyToken) return res.status(400).json({ message: 'Shopify token not set' });

    res.status(200).json({ message: '🔄 Full sync started in background. Check sync status for progress.' });

    logActivity(merchantId, 'FULL_SYNC',
      `Full Shopify sync triggered for '${merchant.brandName}'`
    );

    const { runFullShopifySync } = await import('../services/shopify/full-sync.service');
    runFullShopifySync(merchantId).catch((err: any) => {
      console.error(`❌ Full sync failed for ${merchantId}:`, err.message);
    });

  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Get sync status ───────────────────────────────────────────────────────────
router.get('/sync-status/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const syncLog = await (prisma as any).syncLog.findUnique({
      where: { merchantId: req.params.merchantId as string }
    });
    const customerCount = await prisma.customer.count({ where: { merchantId: req.params.merchantId as string } });
    const orderCount = await (prisma as any).order.count({ where: { merchantId: req.params.merchantId as string } });
    res.status(200).json({ syncLog, customerCount, orderCount });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Get orders for a merchant ─────────────────────────────────────────────────
router.get('/orders/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      (prisma as any).order.findMany({
        where: { merchantId: req.params.merchantId as string },
        skip, take: limit,
        orderBy: { shopifyCreatedAt: 'desc' }
      }),
      (prisma as any).order.count({ where: { merchantId: req.params.merchantId as string } })
    ]);
    res.status(200).json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Meta: Delete a template ───────────────────────────────────────────────────
router.delete('/meta-templates/:merchantId/:templateName', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId   = req.params.merchantId   as string;
    const templateName = req.params.templateName as string;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.metaWabaId || !merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Meta credentials not set' });
    }
    const axios = await import('axios');
    await axios.default.delete(
      `https://graph.facebook.com/v23.0/${merchant.metaWabaId}/message_templates?name=${templateName}`,
      { headers: { Authorization: `Bearer ${merchant.metaAccessToken}` } }
    );

    logActivity(merchantId, 'TEMPLATE_DELETED',
      `Template '${templateName}' deleted from Meta`,
      { templateName }
    );

    res.status(200).json({ message: `✅ Template "${templateName}" deleted!` });
  } catch (e: any) {
    console.error('❌ Template delete error:', JSON.stringify(e.response?.data || e.message));
    res.status(500).json({ message: e.response?.data?.error?.message || e.message });
  }
});

// ── Test: send a template message ────────────────────────────────────────────
router.post('/test-template', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, toPhone, templateName, variables } = req.body;
    if (!merchantId || !toPhone || !templateName) {
      return res.status(400).json({ message: 'merchantId, toPhone, templateName required' });
    }
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.metaPhoneNumberId || !merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Merchant Meta credentials not set' });
    }
    console.log(`📱 Sending template "${templateName}" to ${toPhone} via Phone ID: ${merchant.metaPhoneNumberId}`);
    const ok = await sendMetaTemplateMessage(
      merchant.metaPhoneNumberId,
      merchant.metaAccessToken,
      toPhone,
      templateName,
      variables || []
    );
    if (ok) return res.status(200).json({ message: `✅ Template "${templateName}" sent!` });
    return res.status(500).json({ message: '❌ Meta API error — check server logs' });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
});

// ── Test: send a free-form message to any number ─────────────────────────────
router.post('/test-message', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, toPhone, message } = req.body;
    if (!merchantId || !toPhone || !message) {
      return res.status(400).json({ message: 'merchantId, toPhone, message required' });
    }
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.metaPhoneNumberId || !merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Merchant Meta credentials not set' });
    }
    const ok = await sendMetaTextMessage(
      merchant.metaPhoneNumberId,
      merchant.metaAccessToken,
      toPhone,
      message
    );
    if (ok) return res.status(200).json({ message: '✅ Message sent!' });
    return res.status(500).json({ message: '❌ Meta API returned error — check server logs' });
  } catch (e: any) {
    return res.status(500).json({ message: e.message });
  }
});

// ── Update merchant credentials (token refresh / credential update) ──────────
router.post('/update-credentials', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, shopifyToken, shopifySecret, storeUrl,
            metaPhoneNumberId, metaAccessToken, metaWabaId,
            shopifyClientId, shopifyClientSecret } = req.body;
    if (!merchantId) return res.status(400).json({ message: 'merchantId required' });

    const data: any = {};
    if (shopifyToken !== undefined)       data.shopifyToken       = shopifyToken;
    if (shopifySecret !== undefined)      data.shopifySecret      = shopifySecret;
    if (storeUrl !== undefined)           data.storeUrl           = storeUrl;
    if (metaPhoneNumberId !== undefined)  data.metaPhoneNumberId  = metaPhoneNumberId;
    if (metaAccessToken !== undefined)    data.metaAccessToken    = metaAccessToken;
    if (metaWabaId !== undefined)         data.metaWabaId         = metaWabaId;
    if (shopifyClientId !== undefined)    data.shopifyClientId    = shopifyClientId;
    if (shopifyClientSecret !== undefined) data.shopifyClientSecret = shopifyClientSecret;

    await prisma.merchant.update({ where: { id: merchantId }, data });

    const updatedFields = Object.keys(data).join(', ');
    logActivity(merchantId, 'CREDENTIALS_UPDATED',
      `Credentials updated — fields changed: ${updatedFields}`,
      { updatedFields }
    );

    res.status(200).json({ message: '✅ Credentials updated!' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Refresh Shopify token via OAuth (client_credentials) ─────────────────────
router.post('/refresh-shopify-token', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, clientId: bodyClientId, clientSecret: bodyClientSecret } = req.body;
    if (!merchantId) return res.status(400).json({ message: 'merchantId required' });

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.storeUrl) return res.status(400).json({ message: 'Store URL not set' });

    // Use provided credentials OR fall back to saved ones
    const clientId = bodyClientId || merchant.shopifyClientId;
    const clientSecret = bodyClientSecret || merchant.shopifyClientSecret;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ message: 'Client ID and Secret required — not saved in DB yet' });
    }

    const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const axios = await import('axios');
    const resp = await axios.default.post(
      `https://${cleanUrl}/admin/oauth/access_token`,
      new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const newToken = resp.data.access_token;
    await prisma.merchant.update({ where: { id: merchantId }, data: { shopifyToken: newToken } });

    logActivity(merchantId, 'CREDENTIALS_UPDATED',
      `Shopify access token refreshed via OAuth`,
      { storeUrl: merchant.storeUrl }
    );

    res.status(200).json({ message: '✅ Shopify token refreshed!', token: newToken.slice(0, 10) + '...' });
  } catch (e: any) {
    res.status(500).json({ message: e.response?.data?.error_description || e.message });
  }
});

// ── Meta: List approved templates ────────────────────────────────────────────
router.get('/meta-templates/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.metaWabaId || !merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Meta credentials not set' });
    }
    const axios = await import('axios');
    const resp = await axios.default.get(
      `https://graph.facebook.com/v23.0/${merchant.metaWabaId}/message_templates?fields=name,status,language,category,components,rejected_reason&limit=50`,
      { headers: { Authorization: `Bearer ${merchant.metaAccessToken}` } }
    );
    res.status(200).json({ templates: resp.data.data || [] });
  } catch (e: any) {
    res.status(500).json({ message: e.response?.data?.error?.message || e.message });
  }
});

// ── Meta: Create new template ─────────────────────────────────────────────────
router.post('/meta-templates', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, name, language, category, bodyText, headerText, footerText, buttons } = req.body;
    // buttons = [{ type: 'URL', text: 'Shop Now', url: 'https://...' }
    //           |{ type: 'PHONE_NUMBER', text: 'Call Us', phone_number: '+91...' }
    //           |{ type: 'QUICK_REPLY', text: 'STOP' }]

    if (!merchantId || !name || !bodyText) {
      return res.status(400).json({ message: 'merchantId, name, bodyText required' });
    }
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.metaWabaId || !merchant?.metaAccessToken) {
      return res.status(400).json({ message: 'Meta credentials not set' });
    }

    const components: any[] = [];
    if (headerText) components.push({ type: 'HEADER', format: 'TEXT', text: headerText });
    components.push({ type: 'BODY', text: bodyText });
    if (footerText) components.push({ type: 'FOOTER', text: footerText });

    // ── Buttons component ──────────────────────────────────────────────────
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      const metaButtons = buttons.map((btn: any) => {
        if (btn.type === 'URL') {
          return { type: 'URL', text: btn.text, url: btn.url };
        }
        if (btn.type === 'PHONE_NUMBER') {
          return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phone_number };
        }
        if (btn.type === 'QUICK_REPLY') {
          return { type: 'QUICK_REPLY', text: btn.text };
        }
        return null;
      }).filter(Boolean);

      if (metaButtons.length > 0) {
        components.push({ type: 'BUTTONS', buttons: metaButtons });
      }
    }

    const axios = await import('axios');
    const resp = await axios.default.post(
      `https://graph.facebook.com/v23.0/${merchant.metaWabaId}/message_templates`,
      { name, language: language || 'en_US', category: category || 'MARKETING', components },
      { headers: { Authorization: `Bearer ${merchant.metaAccessToken}`, 'Content-Type': 'application/json' } }
    );

    logActivity(merchantId, 'TEMPLATE_CREATED',
      `Template '${name}' submitted for Meta review (${language || 'en_US'}, ${category || 'MARKETING'})${buttons?.length ? ` with ${buttons.length} button(s)` : ''}`,
      { name, language, category, buttonCount: buttons?.length || 0 }
    );

    res.status(200).json({ message: '✅ Template submitted for review!', data: resp.data });
  } catch (e: any) {
    res.status(500).json({ message: e.response?.data?.error?.message || e.message });
  }
});

// ── Delete all Shopify webhooks for a merchant ───────────────────────────────
router.post('/delete-webhooks', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId } = req.body;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.shopifyToken || !merchant?.storeUrl) {
      return res.status(400).json({ message: 'Shopify credentials not set' });
    }
    const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const axios = await import('axios');
    const headers = { 'X-Shopify-Access-Token': merchant.shopifyToken };

    // Get all webhooks
    const listResp = await axios.default.get(
      `https://${cleanUrl}/admin/api/2024-01/webhooks.json`,
      { headers }
    );
    const webhooks = listResp.data.webhooks || [];

    // Delete each one
    for (const wh of webhooks) {
      await axios.default.delete(
        `https://${cleanUrl}/admin/api/2024-01/webhooks/${wh.id}.json`,
        { headers }
      );
    }

    res.status(200).json({ message: `✅ Deleted ${webhooks.length} webhooks` });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Register Shopify webhooks for a merchant ─────────────────────────────────
router.post('/register-webhooks', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId } = req.body;
    if (!merchantId) return res.status(400).json({ message: 'merchantId required' });

    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant?.shopifyToken || !merchant?.storeUrl) {
      return res.status(400).json({ message: 'Shopify token and store URL required' });
    }

    const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const axios = await import('axios');
    const headers = {
      'X-Shopify-Access-Token': merchant.shopifyToken,
      'Content-Type': 'application/json'
    };

    const webhooks = [
      {
        topic: 'checkouts/create',
        address: `${backendUrl}/api/webhooks/shopify/abandoned-cart/${merchantId}`
      },
      {
        topic: 'checkouts/update',
        address: `${backendUrl}/api/webhooks/shopify/abandoned-cart/${merchantId}`
      },
      {
        topic: 'orders/create',
        address: `${backendUrl}/api/webhooks/shopify/order-created/${merchantId}`
      }
    ];

    const results: any[] = [];

    for (const wh of webhooks) {
      try {
        const resp = await axios.default.post(
          `https://${cleanUrl}/admin/api/2024-01/webhooks.json`,
          { webhook: { topic: wh.topic, address: wh.address, format: 'json' } },
          { headers }
        );
        results.push({ topic: wh.topic, status: 'registered', id: resp.data.webhook?.id });
        console.log(`✅ Webhook registered: ${wh.topic} → ${wh.address}`);
      } catch (e: any) {
        const msg = e.response?.data?.errors || e.message;
        // "Address for this topic already taken" = already registered, that's fine
        const alreadyExists = JSON.stringify(msg).includes('already');
        results.push({ topic: wh.topic, status: alreadyExists ? 'already_registered' : 'failed', error: alreadyExists ? null : msg });
        console.log(`${alreadyExists ? 'ℹ️' : '❌'} ${wh.topic}: ${alreadyExists ? 'already registered' : msg}`);
      }
    }

    res.status(200).json({ message: '✅ Webhook registration complete!', results });

    logActivity(merchantId, 'WEBHOOKS_REGISTERED',
      `Shopify webhooks registered — ${results.filter((r:any) => r.status === 'registered').length} new, ${results.filter((r:any) => r.status === 'already_registered').length} already existed`,
      { results }
    );

  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── List registered Shopify webhooks ─────────────────────────────────────────
router.get('/list-webhooks/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchant = await prisma.merchant.findUnique({ where: { id: req.params.merchantId as string } });
    if (!merchant?.shopifyToken || !merchant?.storeUrl) {
      return res.status(400).json({ message: 'Shopify credentials not set' });
    }
    const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const axios = await import('axios');
    const resp = await axios.default.get(
      `https://${cleanUrl}/admin/api/2024-01/webhooks.json`,
      { headers: { 'X-Shopify-Access-Token': merchant.shopifyToken } }
    );
    res.status(200).json({ webhooks: resp.data.webhooks || [] });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Add single customer manually ─────────────────────────────────────────────
router.post('/customers/add', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, name, phone, email } = req.body;
    if (!merchantId || !phone) return res.status(400).json({ message: 'merchantId and phone required' });

    const cleanPhone = String(phone).replace(/[\s\-()]/g, '');
    const customer = await prisma.customer.upsert({
      where: { merchantId_phone: { merchantId, phone: cleanPhone } },
      update: { name: name || undefined, email: email || undefined },
      create: { merchantId, phone: cleanPhone, name: name || 'Customer', email: email || null }
    });
    res.status(200).json({ message: '✅ Customer added!', customer });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Export customers as CSV ───────────────────────────────────────────────────
router.get('/customers/export/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const customers = await prisma.customer.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' }
    });

    const header = 'name,phone,email,totalOrders,totalSpent,hasAbandonedCart,hasPlacedOrder';
    const rows = customers.map((c: any) =>
      [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        c.totalOrders || 0,
        c.totalSpent || 0,
        c.hasAbandonedCart ? 'yes' : 'no',
        c.hasPlacedOrder ? 'yes' : 'no',
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="customers-${merchantId}.csv"`);
    res.status(200).send(csv);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Import customers from CSV (bulk) ─────────────────────────────────────────
router.post('/customers/import', async (req: Request, res: Response): Promise<any> => {
  try {
    const { merchantId, customers } = req.body;
    // customers = [{ name, phone, email }]
    if (!merchantId || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ message: 'merchantId and customers array required' });
    }

    let added = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const c of customers) {
      if (!c.phone) { skipped++; continue; }
      const cleanPhone = String(c.phone).replace(/[\s\-()]/g, '');
      if (!cleanPhone) { skipped++; continue; }

      try {
        await prisma.customer.upsert({
          where: { merchantId_phone: { merchantId, phone: cleanPhone } },
          update: {
            name: c.name || undefined,
            email: c.email || undefined,
          },
          create: {
            merchantId,
            phone: cleanPhone,
            name: c.name || 'Customer',
            email: c.email || null,
          }
        });
        added++;
      } catch (err: any) {
        errors.push(`${cleanPhone}: ${err.message}`);
        skipped++;
      }
    }

    res.status(200).json({
      message: `✅ Imported ${added} customers, skipped ${skipped}`,
      added, skipped,
      errors: errors.slice(0, 10) // first 10 errors only
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Reusable: "no_phone" condition — covers all cases we store ────────────────
// A customer has NO usable WhatsApp number if:
//   1. phone starts with "email:" (email-only, synced from Shopify)
//   2. phone === 'NO_PHONE' (legacy cart placeholder)
//   3. phone is null or empty string
const NO_PHONE_CONDITION = (merchantId: string) => ({
  merchantId,
  OR: [
    { phone: { startsWith: 'email:' } },   // email-only customers
    { phone: 'NO_PHONE' },                  // old abandoned cart placeholder
    { phone: '' },                          // blank
    { phone: null },                        // truly null
  ]
});

// ── Get customers with filter ─────────────────────────────────────────────────
router.get('/customers-filtered/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const filter = req.query.filter as string || 'all';
    // Filters: all | abandoned | ordered | no_phone | email_only | wa_invalid
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    // ── Build base where clause ───────────────────────────────────────────
    let where: any = { merchantId };

    if (filter === 'abandoned') {
      // Count from real AbandonedCart table — not the flag which may be stale
      // Get distinct phones that have an abandoned cart
      const cartPhones = await prisma.abandonedCart.findMany({
        where: { merchantId, customerPhone: { not: 'NO_PHONE' } },
        select: { customerPhone: true },
        distinct: ['customerPhone'],
      });
      const phones = cartPhones.map((c: any) => c.customerPhone);
      where = { merchantId, phone: { in: phones } };
    }
    else if (filter === 'ordered') {
      where.hasPlacedOrder = true;
    }
    else if (filter === 'no_phone') {
      where = NO_PHONE_CONDITION(merchantId);
    }
    else if (filter === 'email_only') {
      // Has real email AND no phone
      where = {
        merchantId,
        email: { not: null },
        OR: [
          { phone: { startsWith: 'email:' } },
          { phone: 'NO_PHONE' },
          { phone: '' },
          { phone: null },
        ]
      };
    }
    else if (filter === 'wa_invalid') {
      where.tags = { contains: 'wa_invalid' };
    }

    // ── Search — safely merge with existing where ─────────────────────────
    if (search) {
      const searchOr = [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
      if (where.OR) {
        // Already has OR — wrap both in AND
        where = { AND: [{ ...where }, { OR: searchOr }] };
      } else {
        where.OR = searchOr;
      }
    }

    // ── Counts for stats cards ────────────────────────────────────────────
    // Abandoned: count distinct phones in AbandonedCart (real source of truth)
    const abandonedPhones = await prisma.abandonedCart.findMany({
      where: { merchantId, customerPhone: { not: 'NO_PHONE' } },
      select: { customerPhone: true },
      distinct: ['customerPhone'],
    });

    const [customers, total, noPhoneCount, waInvalidCount, orderedCount] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { updatedAt: 'desc' } }),
      prisma.customer.count({ where }),
      prisma.customer.count({ where: NO_PHONE_CONDITION(merchantId) }),
      prisma.customer.count({ where: { merchantId, tags: { contains: 'wa_invalid' } } }),
      prisma.customer.count({ where: { merchantId, hasPlacedOrder: true } }),
    ]);

    res.status(200).json({
      customers, total, page, pages: Math.ceil(total / limit),
      stats: {
        noPhoneCount,
        waInvalidCount,
        abandonedCount: abandonedPhones.length,  // real count from AbandonedCart table
        orderedCount,
      }
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Analytics: Full message tracking for a merchant ──────────────────────────
router.get('/analytics/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
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
      merchant
    ] = await Promise.all([
      // Total sent
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', timestamp: { gte: since } } }),

      // Delivered
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', status: 'DELIVERED', timestamp: { gte: since } } }),

      // Read (opened)
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', status: 'READ', timestamp: { gte: since } } }),

      // Failed
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', status: 'FAILED', timestamp: { gte: since } } }),

      // Failed messages with reasons
      prisma.message.findMany({
        where: { merchantId, direction: 'OUTGOING', status: 'FAILED', timestamp: { gte: since } },
        select: { id: true, customerPhone: true, failReason: true, timestamp: true, templateName: true },
        orderBy: { timestamp: 'desc' },
        take: 50
      }),

      // Tracking links analytics
      (prisma as any).trackingLink.findMany({
        where: { merchantId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' }
      }),

      // Discount code conversions
      (prisma as any).trackingLink.groupBy({
        by: ['discountCode'],
        where: { merchantId, converted: true, discountCode: { not: null }, createdAt: { gte: since } },
        _count: { id: true },
        _sum: { convertedRevenue: true }
      }),

      // Merchant overall stats
      prisma.merchant.findUnique({
        where: { id: merchantId },
        select: { totalSent: true, totalRead: true, totalClicked: true, totalConverted: true, recoveredRevenue: true }
      })
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
      const reason = m.failReason || 'Unknown';
      failReasons[reason] = (failReasons[reason] || 0) + 1;
    });

    res.status(200).json({
      period: `Last ${days} days`,
      messages: {
        sent: totalSent,
        delivered: totalDelivered,
        read: totalRead,
        failed: totalFailed,
        deliveryRate: totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0',
        openRate: totalSent > 0 ? ((totalRead / totalSent) * 100).toFixed(1) : '0',
      },
      clicks: {
        total: clicked,
        converted,
        clickRate: totalSent > 0 ? ((clicked / totalSent) * 100).toFixed(1) : '0',
        conversionRate: clicked > 0 ? ((converted / clicked) * 100).toFixed(1) : '0',
        revenueFromClicks: clickRevenue,
      },
      revenue: {
        total: totalRevenue,
        byDiscountCode: discountConversions,
      },
      failedMessages: {
        total: totalFailed,
        reasons: failReasons,
        recent: failedMessages
      },
      allTime: merchant
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── ROI Report — full period summary for merchant renewal conversation ────────
// GET /api/admin/roi-report/:merchantId?days=30&fee=5000
router.get('/roi-report/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId  = req.params.merchantId as string;
    const days        = parseInt(req.query.days as string) || 30;
    const monthlyFee  = parseFloat(req.query.fee as string) || 5000;
    const since       = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: {
        brandName: true, storeUrl: true,
        totalSent: true, totalRead: true, recoveredRevenue: true,
        subscriptionExpiry: true, totalPaidAmount: true,
      }
    });
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });

    // ── All queries in parallel ───────────────────────────────────────────
    const [
      msgSent, msgDelivered, msgRead, msgFailed,
      trackingLinks,
      campaigns,
      cartsSent, cartsRecovered,
      customerCount,
      payments,
    ] = await Promise.all([
      // Messages in period
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', timestamp: { gte: since } } }),
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', status: 'DELIVERED', timestamp: { gte: since } } }),
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', status: 'READ', timestamp: { gte: since } } }),
      prisma.message.count({ where: { merchantId, direction: 'OUTGOING', status: 'FAILED', timestamp: { gte: since } } }),

      // Tracking links — clicks + conversions + revenue
      (prisma as any).trackingLink.findMany({
        where: { merchantId, createdAt: { gte: since } },
        select: { clicked: true, converted: true, convertedRevenue: true, discountCode: true }
      }),

      // Campaigns launched in period
      prisma.campaign.findMany({
        where: { merchantId, createdAt: { gte: since }, status: { in: ['COMPLETED', 'SENDING'] } },
        select: { name: true, sentCount: true, totalRecipients: true, createdAt: true }
      }),

      // Abandoned carts sent
      prisma.abandonedCart.count({ where: { merchantId, status: 'SENT',      createdAt: { gte: since } } }),
      prisma.abandonedCart.count({ where: { merchantId, status: 'RECOVERED', createdAt: { gte: since } } }),

      // Total customers
      prisma.customer.count({ where: { merchantId } }),

      // Payments in period
      (prisma as any).payment.findMany({
        where: { merchantId, paidAt: { gte: since } },
        select: { amount: true, paidAt: true, note: true }
      }),
    ]);

    // ── Compute metrics ───────────────────────────────────────────────────
    const clicks              = trackingLinks.filter((l: any) => l.clicked).length;
    const conversions         = trackingLinks.filter((l: any) => l.converted).length;
    const revenueRecovered    = trackingLinks
      .filter((l: any) => l.converted)
      .reduce((s: number, l: any) => s + (l.convertedRevenue || 0), 0);

    const deliveryRate        = msgSent > 0 ? ((msgDelivered / msgSent) * 100).toFixed(1) : '0';
    const openRate            = msgSent > 0 ? ((msgRead     / msgSent) * 100).toFixed(1) : '0';
    const clickRate           = msgSent > 0 ? ((clicks      / msgSent) * 100).toFixed(1) : '0';
    const cartRecoveryRate    = cartsSent > 0 ? ((cartsRecovered / cartsSent) * 100).toFixed(1) : '0';
    const roi                 = monthlyFee > 0 ? ((revenueRecovered / monthlyFee) * 100).toFixed(0) : '0';
    const revenuePerRupee     = monthlyFee > 0 ? (revenueRecovered / monthlyFee).toFixed(1) : '0';

    // ── Build WhatsApp-ready message ──────────────────────────────────────
    const daysLabel  = days === 30 ? 'this month' : days === 7 ? 'this week' : `last ${days} days`;
    const expiryStr  = merchant.subscriptionExpiry
      ? new Date(merchant.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'N/A';

    const whatsappMessage = `📊 *WA-Automation Monthly Report*
━━━━━━━━━━━━━━━━━━━━
🏪 *Brand:* ${merchant.brandName}
📅 *Period:* ${daysLabel} (${days} days)
━━━━━━━━━━━━━━━━━━━━

💬 *Messages Sent:* ${msgSent.toLocaleString('en-IN')}
✅ *Delivered:* ${msgDelivered.toLocaleString('en-IN')} (${deliveryRate}%)
👁️ *Read/Opened:* ${msgRead.toLocaleString('en-IN')} (${openRate}%)
🔗 *Link Clicks:* ${clicks.toLocaleString('en-IN')} (${clickRate}%)

🛒 *Abandoned Carts Targeted:* ${cartsSent.toLocaleString('en-IN')}
✅ *Carts Recovered:* ${cartsRecovered.toLocaleString('en-IN')} (${cartRecoveryRate}%)
${campaigns.length > 0 ? `📢 *Campaigns Sent:* ${campaigns.length}\n` : ''}
━━━━━━━━━━━━━━━━━━━━
💰 *Revenue Recovered:* ₹${revenueRecovered.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
📈 *ROI:* ${roi}% on ₹${monthlyFee.toLocaleString('en-IN')} subscription
⚡ *Every ₹1 you paid = ₹${revenuePerRupee} returned*
━━━━━━━━━━━━━━━━━━━━

📌 *Subscription expiry:* ${expiryStr}
💳 *Monthly fee:* ₹${monthlyFee.toLocaleString('en-IN')}

_Powered by WA-Automation_ 🚀
_Reply to renew your subscription_`;

    res.json({
      period:      { days, since: since.toISOString(), label: daysLabel },
      merchant:    { brandName: merchant.brandName, storeUrl: merchant.storeUrl, subscriptionExpiry: merchant.subscriptionExpiry },
      messages:    { sent: msgSent, delivered: msgDelivered, read: msgRead, failed: msgFailed, deliveryRate, openRate },
      engagement:  { clicks, conversions, clickRate, cartsSent, cartsRecovered, cartRecoveryRate },
      revenue:     { recovered: revenueRecovered, monthlyFee, roi, revenuePerRupee },
      campaigns:   campaigns.map((c: any) => ({ name: c.name, sent: c.sentCount, total: c.totalRecipients })),
      customers:   { total: customerCount },
      payments:    payments.map((p: any) => ({ amount: p.amount, paidAt: p.paidAt, note: p.note })),
      whatsappMessage,
      generatedAt: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── WABA Info — fetch live data from Meta Graph API ──────────────────────────
// Returns: phone number, display name, quality rating, messaging tier, WABA name
router.get('/waba-info/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

    if (!merchant?.metaPhoneNumberId || !merchant?.metaAccessToken || !merchant?.metaWabaId) {
      return res.status(400).json({ message: 'Meta credentials not fully configured (need PhoneNumberId, AccessToken, WabaId)' });
    }

    const axios = await import('axios');
    const headers = { Authorization: `Bearer ${merchant.metaAccessToken}` };
    const base = 'https://graph.facebook.com/v23.0';

    // Run both calls in parallel
    const [phoneResp, wabaResp] = await Promise.allSettled([
      // Phone number details: display name, quality rating, messaging limits
      axios.default.get(
        `${base}/${merchant.metaPhoneNumberId}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,platform_type,code_verification_status,account_mode`,
        { headers }
      ),
      // WABA details: name, currency, timezone, ownership
      axios.default.get(
        `${base}/${merchant.metaWabaId}?fields=name,currency,timezone_id,message_template_namespace,account_review_status,on_behalf_of_business_info`,
        { headers }
      ),
    ]);

    const phone = phoneResp.status === 'fulfilled' ? phoneResp.value.data : null;
    const waba  = wabaResp.status  === 'fulfilled' ? wabaResp.value.data  : null;

    // ── Normalize quality rating ──────────────────────────────────────────
    // Meta returns: GREEN | YELLOW | RED | UNKNOWN
    const qualityRating = phone?.quality_rating || 'UNKNOWN';
    const qualityColor  = qualityRating === 'GREEN'  ? 'green'  :
                          qualityRating === 'YELLOW' ? 'yellow' :
                          qualityRating === 'RED'    ? 'red'    : 'slate';

    // ── Normalize messaging tier ──────────────────────────────────────────
    // Meta returns: TIER_50 | TIER_250 | TIER_1K | TIER_10K | TIER_100K | UNLIMITED
    const tierRaw  = phone?.messaging_limit_tier || 'TIER_250';
    const tierMap: Record<string, { label: string; limit: number }> = {
      TIER_50:     { label: '50 / day',        limit: 50      },
      TIER_250:    { label: '250 / day',        limit: 250     },
      TIER_1K:     { label: '1,000 / day',      limit: 1000    },
      TIER_10K:    { label: '10,000 / day',     limit: 10000   },
      TIER_100K:   { label: '100,000 / day',    limit: 100000  },
      UNLIMITED:   { label: 'Unlimited',        limit: -1      },
    };
    const tier = tierMap[tierRaw] || { label: tierRaw, limit: 250 };

    res.json({
      phoneNumber:        phone?.display_phone_number  || merchant.metaPhoneNumberId,
      displayName:        phone?.verified_name         || merchant.brandName,
      qualityRating,
      qualityColor,
      accountMode:        phone?.account_mode          || 'LIVE',
      verificationStatus: phone?.code_verification_status || 'VERIFIED',
      messagingTier:      tier.label,
      messagingLimit:     tier.limit,
      tierRaw,
      wabaName:           waba?.name                   || '—',
      currency:           waba?.currency               || '—',
      timezoneId:         waba?.timezone_id            || '—',
      reviewStatus:       waba?.account_review_status  || '—',
      phoneNumberId:      merchant.metaPhoneNumberId,
      wabaId:             merchant.metaWabaId,
      // Raw for debugging
      _raw: { phone, waba },
    });
  } catch (e: any) {
    console.error('WABA info error:', e.response?.data || e.message);
    res.status(500).json({ message: e.response?.data?.error?.message || e.message });
  }
});

// ── Activity Log — get logs for a merchant ────────────────────────────────────
// GET /api/admin/activity-log/:merchantId?page=1&limit=50&action=CAMPAIGN_LAUNCHED
router.get('/activity-log/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const page       = parseInt(req.query.page   as string) || 1;
    const limit      = parseInt(req.query.limit  as string) || 50;
    const action     = (req.query.action as string) || '';   // optional filter by action type
    const skip       = (page - 1) * limit;

    const where: any = { merchantId };
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ]);

    // Parse metadata JSON for each log
    const parsedLogs = logs.map((log: any) => ({
      ...log,
      metadata: log.metadata ? (() => { try { return JSON.parse(log.metadata); } catch { return null; } })() : null,
    }));

    res.json({ logs: parsedLogs, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── Red Flags — per-merchant health alerts ────────────────────────────────────
// GET /api/admin/red-flags/:merchantId
// Returns array of alerts: { level: 'error'|'warning'|'info', code, message, action }
router.get('/red-flags/:merchantId', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const merchant   = await prisma.merchant.findUnique({ where: { id: merchantId } });
    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });

    const flags: Array<{
      level: 'error' | 'warning' | 'info';
      code: string;
      message: string;
      action: string;
    }> = [];

    // ── 1. Meta Access Token check + Quality Rating ──────────────────────
    if (!merchant.metaAccessToken || !merchant.metaPhoneNumberId) {
      flags.push({
        level:   'error',
        code:    'META_CREDS_MISSING',
        message: 'Meta credentials not configured — WhatsApp messages cannot be sent',
        action:  'Go to Credentials tab and set Meta Phone Number ID + Access Token',
      });
    } else {
      // Single API call — get token validity + quality rating together
      try {
        const axios = await import('axios');
        const resp = await axios.default.get(
          `https://graph.facebook.com/v23.0/${merchant.metaPhoneNumberId}?fields=id,quality_rating,messaging_limit_tier,account_mode`,
          { headers: { Authorization: `Bearer ${merchant.metaAccessToken}` }, timeout: 6000 }
        );

        const qualityRating = resp.data?.quality_rating || 'UNKNOWN';
        const tierRaw       = resp.data?.messaging_limit_tier || '';

        // ── Quality Rating alert ────────────────────────────────────────
        if (qualityRating === 'RED') {
          flags.push({
            level:   'error',
            code:    'META_QUALITY_RED',
            message: '🔴 Meta Quality Rating is RED — your number may get blocked!',
            action:  'Pause all campaigns immediately. Review recent messages. Avoid bulk sending until rating recovers to GREEN.',
          });
        } else if (qualityRating === 'YELLOW') {
          flags.push({
            level:   'warning',
            code:    'META_QUALITY_YELLOW',
            message: '🟡 Meta Quality Rating is YELLOW — declining, action needed',
            action:  'Reduce campaign frequency, check for spam-like templates, monitor for the next 24-48 hours.',
          });
        }
        // GREEN or UNKNOWN — no flag needed

        // ── Low messaging tier warning ──────────────────────────────────
        if (tierRaw === 'TIER_50') {
          flags.push({
            level:   'warning',
            code:    'LOW_MESSAGING_TIER',
            message: 'Messaging tier is very low — only 50 conversations/day allowed',
            action:  'Increase quality rating and volume gradually to upgrade to TIER_250+',
          });
        }

      } catch (e: any) {
        const code = e.response?.data?.error?.code;
        if (code === 190) {
          flags.push({
            level:   'error',
            code:    'META_TOKEN_EXPIRED',
            message: 'Meta access token has expired or is invalid',
            action:  'Go to Credentials tab and update the Meta Access Token immediately',
          });
        } else if (e.code === 'ECONNABORTED' || e.code === 'ETIMEDOUT') {
          flags.push({
            level:   'warning',
            code:    'META_API_TIMEOUT',
            message: 'Meta API did not respond in time — possible connectivity issue',
            action:  'Check Meta API status at developers.facebook.com',
          });
        }
      }
    }

    // ── 2. Shopify Token check ────────────────────────────────────────────
    if (!merchant.shopifyToken || !merchant.storeUrl) {
      if (merchant.status === 'ACTIVE') {
        flags.push({
          level:   'error',
          code:    'SHOPIFY_CREDS_MISSING',
          message: 'Shopify credentials missing — abandoned cart webhooks will not work',
          action:  'Go to Credentials tab and set Shopify Token + Store URL',
        });
      }
    } else {
      // Quick Shopify token check
      try {
        const axios = await import('axios');
        const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
        await axios.default.get(
          `https://${cleanUrl}/admin/api/2024-01/shop.json`,
          { headers: { 'X-Shopify-Access-Token': merchant.shopifyToken }, timeout: 5000 }
        );
      } catch (e: any) {
        if (e.response?.status === 401 || e.response?.status === 403) {
          flags.push({
            level:   'error',
            code:    'SHOPIFY_TOKEN_INVALID',
            message: 'Shopify access token is invalid or revoked',
            action:  'Go to Credentials tab → use Refresh Token button to generate a new token',
          });
        }
      }
    }

    // ── 3. Subscription expiry ────────────────────────────────────────────
    const now = new Date();
    if (merchant.subscriptionExpiry) {
      const daysLeft = Math.ceil(
        (merchant.subscriptionExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysLeft < 0) {
        flags.push({
          level:   'error',
          code:    'SUBSCRIPTION_EXPIRED',
          message: `Subscription expired ${Math.abs(daysLeft)} days ago`,
          action:  'Collect payment from merchant and add payment in Overview tab',
        });
      } else if (daysLeft <= 5) {
        flags.push({
          level:   'warning',
          code:    'SUBSCRIPTION_EXPIRING_SOON',
          message: `Subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
          action:  'Contact merchant for renewal and add payment before expiry',
        });
      }
    }

    // ── 4. Service paused but active ─────────────────────────────────────
    if (merchant.status === 'ACTIVE' && !(merchant as any).serviceActive) {
      flags.push({
        level:   'warning',
        code:    'SERVICE_PAUSED',
        message: 'Service is manually paused — messages are not being sent',
        action:  'Go to Overview tab and toggle Service to Resume if intended',
      });
    }

    // ── 5. WA Invalid customers (opted out or bad numbers) ───────────────
    const waInvalidCount = await prisma.customer.count({
      where: { merchantId, tags: { contains: 'wa_invalid' } }
    });
    if (waInvalidCount > 50) {
      flags.push({
        level:   'warning',
        code:    'HIGH_INVALID_NUMBERS',
        message: `${waInvalidCount} customers have invalid WhatsApp numbers`,
        action:  'Review Customers tab → WA Invalid filter. Consider cleaning up list.',
      });
    }

    // ── 6. Failed messages in last 24 hours ──────────────────────────────
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentFailed = await prisma.message.count({
      where: {
        merchantId,
        status:    'FAILED',
        direction: 'OUTGOING',
        timestamp: { gte: since24h },
      }
    });
    if (recentFailed > 20) {
      flags.push({
        level:   'error',
        code:    'HIGH_FAILED_MESSAGES',
        message: `${recentFailed} messages failed in the last 24 hours`,
        action:  'Check Meta credentials and quality rating in Overview tab',
      });
    } else if (recentFailed > 5) {
      flags.push({
        level:   'warning',
        code:    'SOME_FAILED_MESSAGES',
        message: `${recentFailed} messages failed in the last 24 hours`,
        action:  'Monitor Meta quality rating — may indicate delivery issues',
      });
    }

    // ── 7. No customers synced ────────────────────────────────────────────
    if (merchant.status === 'ACTIVE') {
      const customerCount = await prisma.customer.count({ where: { merchantId } });
      if (customerCount === 0) {
        flags.push({
          level:   'warning',
          code:    'NO_CUSTOMERS',
          message: 'No customers synced yet — campaigns and flows have no recipients',
          action:  'Go to Customers tab → Run Full Sync to import from Shopify',
        });
      }
    }

    // ── 8. No active flows ────────────────────────────────────────────────
    if (merchant.status === 'ACTIVE') {
      const activeFlows = await prisma.automationFlow.count({
        where: { merchantId, isActive: true }
      });
      if (activeFlows === 0) {
        flags.push({
          level:   'info',
          code:    'NO_ACTIVE_FLOWS',
          message: 'No automation flows are active — abandoned cart recovery is off',
          action:  'Go to Flows tab and enable at least one abandoned cart flow',
        });
      }
    }

    // ── Overall severity ──────────────────────────────────────────────────
    const levels  = flags.map(f => f.level);
    const overall = levels.includes('error')   ? 'error'
                  : levels.includes('warning') ? 'warning'
                  : levels.includes('info')    ? 'info' : 'ok';

    // Extract quality rating from flags for easy frontend access
    const qualityFlag = flags.find(f => f.code === 'META_QUALITY_RED' || f.code === 'META_QUALITY_YELLOW');
    const qualityRating = qualityFlag?.code === 'META_QUALITY_RED'    ? 'RED'
                        : qualityFlag?.code === 'META_QUALITY_YELLOW' ? 'YELLOW'
                        : flags.some(f => f.code === 'META_CREDS_MISSING' || f.code === 'META_TOKEN_EXPIRED') ? 'UNKNOWN'
                        : 'GREEN';

    res.json({
      overall,
      flagCount: flags.length,
      flags,
      qualityRating,   // GREEN | YELLOW | RED | UNKNOWN — for header badge
      checkedAt: now.toISOString(),
    });

  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
