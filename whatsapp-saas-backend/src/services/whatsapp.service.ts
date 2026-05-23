import { 
  makeWASocket, 
  useMultiFileAuthState, 
  DisconnectReason, 
  fetchLatestBaileysVersion 
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import prisma from "../lib/prisma";
import path from "path";
import fs from "fs";
import { formatWhatsAppNumber } from "../utils/formatter";

export const sessions = new Map<string, any>();
export const qrCodes = new Map<string, string>();
export const startingSessions = new Set<string>();

export const startWhatsAppSession = async (merchantId: string) => {
  if (startingSessions.has(merchantId)) {
    return;
  }

  startingSessions.add(merchantId);
  console.log(`⚙️ [${merchantId}] Initializing WhatsApp Baileys...`);

  try {
    const sessionPath = path.resolve(__dirname, "../../storage/whatsapp-sessions", merchantId);
    // Baileys keys
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    // 🌟 FIX 1: WhatsApp ka LATEST web version fetch karo taaki 405 na aaye
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📡 [${merchantId}] Using WhatsApp Web v${version.join('.')} (isLatest: ${isLatest})`);

    const sock = makeWASocket({
      version, // 🌟 FIX 1: Passed the latest version here!
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: ['Windows', 'Chrome', '10.0'], // 🌟 FIX 2: Standard Windows browser string
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log(`✅ [${merchantId}] Naya QR Code Generate Hua!`);
        const qrDataUrl = await QRCode.toDataURL(qr);
        qrCodes.set(merchantId, qrDataUrl);
        startingSessions.delete(merchantId);
      }

      if (connection === "open") {
        console.log(`🎉 [${merchantId}] WhatsApp Connected Successfully!`);
        qrCodes.delete(merchantId);
        startingSessions.delete(merchantId);

        await prisma.merchant.update({
          where: { id: merchantId },
          data: { whatsappConnected: true, status: "PENDING_ADMIN" },
        });
      }

      if (connection === "close") {
        startingSessions.delete(merchantId);
        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        
        console.log(`❌ [${merchantId}] Disconnected. Status Code: ${statusCode}`);

        // Agar Error 405, 401 ya Logged Out hai
        if (statusCode === 405 || statusCode === 401 || statusCode === DisconnectReason.loggedOut) {
          console.log(`🧹 [${merchantId}] Session Invalid. Clearing old files...`);
          
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          }
          
          sessions.delete(merchantId);
          qrCodes.delete(merchantId);
          
          await prisma.merchant.update({
            where: { id: merchantId },
            data: { whatsappConnected: false, status: "DISCONNECTED" },
          });

          
        } 
        else {
          // Normal Network Drop (Status 500, 503, etc) -> Reconnect in 5 seconds
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          if (shouldReconnect) {
            console.log(`⏳ Network Drop. Waiting 5 seconds before reconnecting...`);
            setTimeout(() => startWhatsAppSession(merchantId), 5000);
          }
        }
      }
    });

sock.ev.on('messages.update', async (updates) => {
  for (const update of updates) {
    // Status 3 ka matlab hai 'Read' (Blue Tick)
    if (update.update.status === 3) {
      // 1. Merchant ka totalRead counter badhao
      await prisma.merchant.update({
        where: { id: merchantId },
        data: { totalRead: { increment: 1 } }
      });
      console.log(`📖 Message Read for Merchant: ${merchantId}`);
    }
  }
});

    sessions.set(merchantId, sock);
    return sock;
  } catch (error) {
    console.error(`❌ [${merchantId}] Error starting session:`, error);
    startingSessions.delete(merchantId);
    throw error;
  }
};
export const restoreActiveSessions = async () => {
  try {
    const activeMerchants = await prisma.merchant.findMany({
      where: { whatsappConnected: true },
    });

    console.log(`🔄 Found ${activeMerchants.length} active WhatsApp sessions to restore.`);

    for (let i = 0; i < activeMerchants.length; i++) {
      const merchant = activeMerchants[i];

      setTimeout(() => {
        console.log(`🔌 Auto-Restoring session for merchant: ${merchant.brandName}`);
        startWhatsAppSession(merchant.id);
      }, i * 2000);
    }
  } catch (error) {
    console.error("❌ Error restoring sessions:", error);
  }
};

// Add this at the bottom of src/services/whatsapp.service.ts
export const sendMessage = async (merchantId: string, phone: string, text: string) => {
  try {
    const sock = sessions.get(merchantId);
    if (!sock) {
      console.error(`❌ Session offline for Merchant: ${merchantId}`);
      return false; // Session offline hai
    }

  
    const jid = formatWhatsAppNumber(phone);
    if (!jid) return false;

    // Send actual message
    await sock.sendMessage(jid, { text });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send message for ${merchantId}:`, error);
    return false;
  }
};