// src/routes/shopify.oauth.routes.ts
// Shopify Custom App OAuth — callback + token status + install logs
import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { adminProtect } from '../middleware/admin.middleware';

const router = Router();

// ── 1. Shopify OAuth Callback ─────────────────────────────────────────────────
// Shopify redirects here after client installs the custom app
// URL: GET /shopify/callback/tokengenerate?code=xxx&shop=xxx
router.get('/shopify/callback/tokengenerate', async (req: Request, res: Response): Promise<any> => {
  const { code, shop } = req.query as Record<string, string>;

  console.log(`📦 Shopify callback received | shop: ${shop} | code: ${code ? 'present' : 'missing'}`);

  // ── Validate params ───────────────────────────────────────────────────────
  if (!code || !shop) {
    return res.status(400).send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px">
        <h2>❌ Invalid Request</h2>
        <p>Missing code or shop parameter.</p>
      </body></html>
    `);
  }

  // ── Find merchant by shop domain ──────────────────────────────────────────
  // storeUrl in DB should contain the shop domain
  const merchant = await prisma.merchant.findFirst({
    where: {
      OR: [
        { storeUrl: { contains: shop } },
        { storeUrl: shop },
        { storeUrl: `https://${shop}` },
      ]
    }
  });

  // Log the callback regardless — helps admin see what's happening
  const logData: any = {
    shop,
    rawCode: code.substring(0, 10) + '...',  // partial — security
    status: 'pending',
  };
  if (merchant) logData.merchantId = merchant.id;

  const installLog = await (prisma as any).shopifyInstallLog.create({ data: logData });

  if (!merchant) {
    console.warn(`⚠️ Shopify callback: No merchant found for shop: ${shop}`);
    // Still update log
    await (prisma as any).shopifyInstallLog.update({
      where: { id: installLog.id },
      data: { status: 'failed', errorMsg: `No merchant found for shop: ${shop}` }
    });
    return res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;background:#0f0f0f;color:#fff">
        <h2>⚠️ Shop Not Recognized</h2>
        <p>The shop <strong>${shop}</strong> is not registered in our system.</p>
        <p style="color:#9ca3af;font-size:13px">Please contact your administrator.</p>
      </body></html>
    `);
  }

  if (!merchant.shopifyClientId || !merchant.shopifyClientSecret) {
    await (prisma as any).shopifyInstallLog.update({
      where: { id: installLog.id },
      data: { status: 'failed', errorMsg: 'Client ID or Secret not configured — save both via admin panel first' }
    });
    return res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;background:#0f0f0f;color:#fff">
        <h2>⚙️ Configuration Missing</h2>
        <p>App Client ID or Secret not configured. Please contact your administrator.</p>
      </body></html>
    `);
  }

  // ── Exchange code for permanent access token ──────────────────────────────
  try {
    const axiosLib = await import('axios');
    const tokenResp = await axiosLib.default.post(
      `https://${shop}/admin/oauth/access_token`,
      new URLSearchParams({
        client_id:     merchant.shopifyClientId!,
        client_secret: merchant.shopifyClientSecret!,
        code,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken: string = tokenResp.data.access_token;
    if (!accessToken) throw new Error('No access_token in response');

    console.log(`✅ Shopify token obtained for ${merchant.brandName} (${shop})`);

    // ── Save token to merchant record ─────────────────────────────────────
    await prisma.merchant.update({
      where: { id: merchant.id },
      data: { shopifyToken: accessToken }
    });

    // ── Update install log ────────────────────────────────────────────────
    await (prisma as any).shopifyInstallLog.update({
      where: { id: installLog.id },
      data: {
        status:      'success',
        accessToken: accessToken.substring(0, 12) + '...',  // partial for security
        errorMsg:    null,
      }
    });

    // ── Success page for client ───────────────────────────────────────────
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>App Installed</title></head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:60px;background:#0d9488;color:#fff;min-height:100vh;margin:0">
        <div style="background:rgba(255,255,255,0.1);border-radius:20px;padding:40px;max-width:500px;margin:0 auto">
          <div style="font-size:60px;margin-bottom:20px">✅</div>
          <h1 style="margin:0 0 10px">App Installed Successfully!</h1>
          <p style="margin:0 0 20px;opacity:0.9">Your Shopify store <strong>${shop}</strong> has been connected to WA-Automations.</p>
          <p style="opacity:0.7;font-size:14px">You can close this window. Your administrator will activate the service.</p>
        </div>
      </body>
      </html>
    `);

  } catch (e: any) {
    const errMsg = e.response?.data?.error_description || e.message;
    console.error(`❌ Shopify token exchange failed for ${shop}:`, errMsg);

    await (prisma as any).shopifyInstallLog.update({
      where: { id: installLog.id },
      data: { status: 'failed', errorMsg: errMsg }
    });

    return res.send(`
      <html><body style="font-family:Arial;text-align:center;padding:50px;background:#0f0f0f;color:#fff">
        <h2>❌ Installation Failed</h2>
        <p>${errMsg}</p>
        <p style="color:#9ca3af;font-size:13px">Please try reinstalling or contact your administrator.</p>
      </body></html>
    `);
  }
});

// ── 2. Token Status Check (admin button) ─────────────────────────────────────
// GET /api/admin/shopify-token-status/:merchantId
router.get('/api/admin/shopify-token-status/:merchantId', adminProtect, async (req: Request, res: Response): Promise<any> => {
  try {
    const merchantId = req.params.merchantId as string;
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { shopifyToken: true, storeUrl: true, brandName: true }
    });

    if (!merchant) return res.status(404).json({ message: 'Merchant not found' });

    if (merchant.shopifyToken) {
      return res.json({
        status:   'received',
        token:    merchant.shopifyToken,
        storeUrl: merchant.storeUrl,
        message:  '✅ Permanent access token received and saved',
      });
    }

    // Check install logs
    const lastLog = await (prisma as any).shopifyInstallLog.findFirst({
      where: { merchantId },
      orderBy: { callbackAt: 'desc' }
    });

    return res.json({
      status:    'pending',
      message:   lastLog
        ? `⏳ Last callback: ${new Date(lastLog.callbackAt).toLocaleString('en-IN')} — Status: ${lastLog.status}`
        : '⏳ No install callback received yet',
      lastLog,
    });

  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ── 3. All Install Logs — for admin dashboard ─────────────────────────────────
// GET /api/admin/shopify-install-logs
router.get('/api/admin/shopify-install-logs', adminProtect, async (req: Request, res: Response): Promise<any> => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip  = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      (prisma as any).shopifyInstallLog.findMany({
        orderBy: { callbackAt: 'desc' },
        skip,
        take: limit,
        include: {
          merchant: {
            select: { brandName: true, storeUrl: true, status: true }
          }
        }
      }),
      (prisma as any).shopifyInstallLog.count(),
    ]);

    res.json({ logs, total, page, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
