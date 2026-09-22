// src/server.ts
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth.routes";
import merchantRoutes from "./routes/merchant.routes";
import whatsappRoutes from "./routes/whatsapp.routes";
import adminRoutes from "./routes/admin.routes";
import { initMessageWorker } from './workers/message.worker';
import flowRoutes from './routes/flow.routes';
import trackingRoutes from './routes/tracking.routes';
import webhookRoutes from './routes/webhook.routes';
import inboxRoutes from './routes/inbox.routes';
import shopifyOAuthRoutes from './routes/shopify.oauth.routes';
import { messageQueue } from './lib/queue';
import redis from './lib/redis';
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// ── CORS first ────────────────────────────────────────────────────────────────
app.use(cors());

// ── Shopify webhook routes: use express.raw() to get exact bytes ──────────────
// express.raw() does NOT parse the body — gives us the exact Buffer Shopify signed
app.use('/api/webhooks/shopify', express.raw({ type: '*/*', limit: '10mb' }));

// After raw capture, parse JSON for webhook handler
app.use('/api/webhooks/shopify', (req: any, _res: Response, next: NextFunction) => {
  if (Buffer.isBuffer(req.body)) {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.rawBody.toString('utf8'));
    } catch {
      req.body = {};
    }
  }
  next();
});

// ── All other routes: standard JSON middleware ────────────────────────────────
app.use(express.json({ limit: '10mb' }));

// ── Health check (basic) ──────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "WA-Automation Backend running!" });
});

// ── System Health (detailed — admin only) ─────────────────────────────────────
app.get("/api/admin/system-health", async (_req: Request, res: Response) => {
  const checks: Record<string, any> = {};

  // 1. Database ping
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', label: 'Database', message: 'Connected' };
  } catch (e: any) {
    checks.database = { status: 'error', label: 'Database', message: e.message };
  }

  // 2. Redis ping
  try {
    const pong = await redis.ping();
    checks.redis = { status: pong === 'PONG' ? 'ok' : 'error', label: 'Redis', message: pong === 'PONG' ? 'Connected' : 'Unexpected response' };
  } catch (e: any) {
    checks.redis = { status: 'error', label: 'Redis', message: e.message };
  }

  // 3. BullMQ queue stats
  try {
    const [waiting, active, failed, completed, delayed] = await Promise.all([
      messageQueue.getWaitingCount(),
      messageQueue.getActiveCount(),
      messageQueue.getFailedCount(),
      messageQueue.getCompletedCount(),
      messageQueue.getDelayedCount(),
    ]);

    const queueStatus = failed > 50 ? 'error' : failed > 10 ? 'warning' : 'ok';
    checks.queue = {
      status: queueStatus,
      label: 'Message Queue',
      message: queueStatus === 'ok'
        ? `${waiting} waiting, ${active} active, ${delayed} scheduled`
        : `⚠️ ${failed} failed jobs — check worker logs`,
      stats: { waiting, active, failed, completed, delayed },
    };
  } catch (e: any) {
    checks.queue = { status: 'error', label: 'Message Queue', message: e.message };
  }

  // 4. Overall status — worst of all checks
  const statuses = Object.values(checks).map((c: any) => c.status);
  const overall = statuses.includes('error') ? 'error'
    : statuses.includes('warning') ? 'warning' : 'ok';

  res.json({ overall, checks, checkedAt: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/tracking', trackingRoutes);  // click tracking redirects
app.use('/api/webhooks', webhookRoutes);   // ← only once
app.use('/api/inbox', inboxRoutes);        // customer inbox — 2-way chat
app.use('/', shopifyOAuthRoutes);          // shopify oauth callback + status

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log("📦 Database connected!");
    initMessageWorker();
    // ── Daily Anniversary Check ───────────────────────────────────────────────────
    const runAnniversaryCheck = async () => {
      try {
        console.log('🎂 Running daily anniversary check...');
        const today = new Date();
        const todayMonth = today.getMonth() + 1; // 1-12
        const todayDay = today.getDate();       // 1-31

        // Find all customers whose firstOrderDate month+day matches today
        // We fetch all customers with firstOrderDate set and filter in JS
        // (Prisma doesn't support month/day extraction natively)
        const allMerchants = await prisma.merchant.findMany({
          where: { status: 'ACTIVE', serviceActive: true },
          select: { id: true, storeUrl: true }
        });

        for (const m of allMerchants) {
          // Check if merchant has STORE_ANNIVERSARY flow active
          const flow = await prisma.automationFlow.findFirst({
            where: { merchantId: m.id, type: 'STORE_ANNIVERSARY', isActive: true }
          });
          if (!flow || !(flow as any).metaTemplateName) continue;

          // Get customers with firstOrderDate matching today's month+day
          const customers = await prisma.customer.findMany({
            where: {
              merchantId: m.id,
              firstOrderDate: { not: null },
              phone: { not: 'NO_PHONE' },
              tags: { not: { contains: 'wa_invalid' } },
            },
            select: { phone: true, name: true, firstOrderDate: true }
          });

          const { messageQueue } = await import('./lib/queue');
          const { resumeWorkerIfPaused } = await import('./workers/message.worker');

          let queued = 0;
          for (const c of customers) {
            if (!c.firstOrderDate) continue;
            const fd = new Date(c.firstOrderDate);
            if (fd.getMonth() + 1 !== todayMonth || fd.getDate() !== todayDay) continue;

            const yearsCompleted = today.getFullYear() - fd.getFullYear();
            if (yearsCompleted < 1) continue; // less than 1 year — skip

            const discountCode = (flow as any).discountCode || null;
            const storeUrl = m.storeUrl || 'https://wautomation.shop';

            const variables: string[] = [
              c.name?.split(' ')[0] || 'there',
              String(yearsCompleted),
              storeUrl,
              ...(discountCode ? [discountCode] : []),
            ];

            await messageQueue.add('send-automated-msg', {
              cartId: null,
              merchantId: m.id,
              phone: c.phone,
              templateName: (flow as any).metaTemplateName,
              templateLang: (flow as any).metaTemplateLang || 'en_US',
              discountCode,
              variables,
              jobType: 'STORE_ANNIVERSARY',
            }, {
              attempts: 2,
              backoff: { type: 'exponential', delay: 30000 },
            });
            queued++;
          }

          if (queued > 0) {
            await resumeWorkerIfPaused();
            console.log(`🎂 Anniversary messages queued: ${queued} for merchant ${m.id}`);
          }
        }
      } catch (e: any) {
        console.error('❌ Anniversary check error:', e.message);
      }
    };

    // Run once at startup (catch any missed) then every 24 hours
    runAnniversaryCheck();
    setInterval(runAnniversaryCheck, 24 * 60 * 60 * 1000);


    // Keep-alive ping for Render free tier
    if (process.env.BACKEND_URL && process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        try {
          const mod = process.env.BACKEND_URL!.startsWith('https')
            ? await import('https') : await import('http');
          (mod as any).get(`${process.env.BACKEND_URL}/health`, () => { }).on('error', () => { });
        } catch { }
      }, 14 * 60 * 1000);
      console.log("🏓 Keep-alive enabled");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
});
