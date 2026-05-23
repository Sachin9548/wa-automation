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

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Isse app.use(express.json()) ki jagah replace kijiye
app.use(express.json({
  verify: (req: any, res, buf) => {
    if (req.url.includes('/api/webhooks/shopify')) {
      req.rawBody = buf;
    }
  }
}));


app.use(express.json({
  limit: '10mb', 
  verify: (req: any, res, buf) => {
    if (req.originalUrl.includes('/api/webhooks/shopify')) {
      req.rawBody = buf; // Asli raw buffer yahan save hoga
    }
  }
}));

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
