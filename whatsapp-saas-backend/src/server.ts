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
  const overall  = statuses.includes('error') ? 'error'
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

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log("📦 Database connected!");
    initMessageWorker();

    // Keep-alive ping for Render free tier
    if (process.env.BACKEND_URL && process.env.NODE_ENV === 'production') {
      setInterval(async () => {
        try {
          const mod = process.env.BACKEND_URL!.startsWith('https')
            ? await import('https') : await import('http');
          (mod as any).get(`${process.env.BACKEND_URL}/health`, () => {}).on('error', () => {});
        } catch {}
      }, 14 * 60 * 1000);
      console.log("🏓 Keep-alive enabled");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
});
