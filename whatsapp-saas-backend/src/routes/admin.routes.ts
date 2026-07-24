// src/routes/admin.routes.ts
import { Router } from "express";
import {
  activateMerchant, recordPayment, extendSubscription,
  getAdminStats, getAllMerchants, launchCampaign,
  getMerchantDetail, getMerchantCampaigns, syncMerchantCustomers,
  getMerchantFlows, saveMerchantFlow, toggleMerchantFlow, getMerchantCustomers,
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
router.post('/sync-customers', syncMerchantCustomers);
router.get('/flows/:merchantId', getMerchantFlows);
router.post('/flows/save', saveMerchantFlow);
router.post('/flows/toggle', toggleMerchantFlow);
router.get('/customers/:merchantId', getMerchantCustomers);

// ── Meta: Delete a template ───────────────────────────────────────────────────
router.delete('/meta-templates/:merchantId/:templateName', async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
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
    const { merchantId, name, language, category, bodyText, headerText, footerText } = req.body;
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

    const axios = await import('axios');
    const resp = await axios.default.post(
      `https://graph.facebook.com/v23.0/${merchant.metaWabaId}/message_templates`,
      { name, language: language || 'en_US', category: category || 'MARKETING', components },
      { headers: { Authorization: `Bearer ${merchant.metaAccessToken}`, 'Content-Type': 'application/json' } }
    );
    res.status(200).json({ message: '✅ Template submitted for review!', data: resp.data });
  } catch (e: any) {
    res.status(500).json({ message: e.response?.data?.error?.message || e.message });
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

export default router;
