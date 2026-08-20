// src/server.ts
import express, { Request, Response } from "express";
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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Raw body capture for Shopify HMAC verification
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf; // Always capture rawBody for all routes
  }
}));

app.use(cors());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "WA-Automation Backend running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/webhooks', webhookRoutes);

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
