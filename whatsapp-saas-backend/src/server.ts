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

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "WA-Automation Backend running!" });
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
