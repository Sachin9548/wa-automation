// src/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Routes Import
import authRoutes from "./routes/auth.routes";
import merchantRoutes from "./routes/merchant.routes";
import whatsappRoutes from "./routes/whatsapp.routes";
import adminRoutes from "./routes/admin.routes";
import { restoreActiveSessions } from "./services/whatsapp.service";
import { initMessageWorker } from './workers/message.worker';
import flowRoutes from './routes/flow.routes';
import trackingRoutes from './routes/tracking.routes';
import webhookRoutes from './routes/webhook.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(express.json({
  limit: '10mb',
  verify: (req: any, res, buf) => {
    const currentUrl = req.originalUrl || req.url || "";
    
    if (currentUrl.includes('shopify')) { // Sirf 'shopify' check karo simplicity ke liye
      req.rawBody = buf;
      console.log("🛠️ SUCCESS: RawBody captured for URL:", currentUrl);
    }
  }
}));

app.use(cors());



// Basic Health Check Route
app.get("/health", (req: Request, res: Response) => {
  res
    .status(200)
    .json({ status: "OK", message: "WhatsApp SaaS Backend is running!" });
});

// Use Routes
app.use("/api/auth", authRoutes);
app.use("/api/merchant", merchantRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/admin", adminRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/webhooks', webhookRoutes);




// Start Server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  try {
    await prisma.$connect();
    console.log("📦 Database connected successfully!");
    initMessageWorker();

    await restoreActiveSessions();
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
});
