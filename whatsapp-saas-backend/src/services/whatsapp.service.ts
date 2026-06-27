import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore, // 🌟 NAYA: Prevents 515 Encryption Error
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import prisma from "../lib/prisma";
import path from "path";
import fs from "fs";
import { formatWhatsAppNumber } from "../utils/formatter";
import NodeCache from "node-cache"; // 🌟 NAYA: Required for stable connection

export const sessions = new Map<string, any>();
export const qrCodes = new Map<string, string>();
export const startingSessions = new Set<string>();

// 🌟 Cache object to prevent Baileys stream errors
const msgRetryCounterCache = new NodeCache();

export const startWhatsAppSession = async (merchantId: string) => {
  // Lock Check
  if (startingSessions.has(merchantId)) {
    return;
  }

  // Apply Lock
  startingSessions.add(merchantId);
  console.log(`⚙️ [${merchantId}] Initializing WhatsApp Baileys...`);

  try {
    const sessionPath = process.env.SESSION_PATH
      ? path.join(process.env.SESSION_PATH, merchantId)
      : path.resolve(__dirname, "../../storage/whatsapp-sessions", merchantId);

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    console.log(
      `📡 [${merchantId}] Using WhatsApp Web v${version.join(".")} (isLatest: ${isLatest})`,
    );

    const sock = makeWASocket({
      version,
      // 🌟 THE ULTIMATE FIX FOR 515: Wrap keys in CacheableStore
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(
          state.keys,
          pino({ level: "silent" }),
        ),
      },
      msgRetryCounterCache, // Prevents crashes on message retry
      printQRInTerminal: false,
      logger: pino({ level: "silent" }),
      browser: Browsers.macOS("Desktop"), // Best for anti-ban
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr);
        qrCodes.set(merchantId, qrDataUrl);
      }

      // --- SUCCESS CONNECTION ---
      if (connection === "open") {
        console.log(`🎉 [${merchantId}] WhatsApp Connected!`);
        qrCodes.delete(merchantId);

        // Remove Lock on Success
        startingSessions.delete(merchantId);

        const currentMerchant = await prisma.merchant.findUnique({
          where: { id: merchantId },
        });
        const newStatus =
          currentMerchant?.status === "PENDING_ONBOARDING"
            ? "PENDING_ADMIN"
            : currentMerchant?.status;

        await prisma.merchant.update({
          where: { id: merchantId },
          data: {
            whatsappConnected: true,
            status: newStatus,
          },
        });
      }

      // --- DISCONNECTION HANDLING ---
      if (connection === "close") {
        // 🚨 BUG FIXED: Remove lock on close so it can retry properly!
        startingSessions.delete(merchantId);

        const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(
          `❌ [${merchantId}] Connection Closed. Code: ${statusCode}. Reconnect: ${shouldReconnect}`,
        );

        if (shouldReconnect) {
          // 5 seconds baad dobara koshish karo
          setTimeout(() => startWhatsAppSession(merchantId), 5000);
        } else {
          // User ne Logout kiya / Session expired: Session files clean karo
          // ⚠️ IMPORTANT: status field mat badlo — merchant ka ACTIVE status preserve karo
          // Sirf whatsappConnected = false karo, baaki admin ne jo set kiya woh rehne do
          console.log(`🧹 [${merchantId}] Session ended (code 401). Cleaning session files...`);

          const sessionPath = path.resolve(
            __dirname,
            "../../storage/whatsapp-sessions",
            merchantId,
          );
          if (fs.existsSync(sessionPath))
            fs.rmSync(sessionPath, { recursive: true, force: true });

          sessions.delete(merchantId);
          qrCodes.delete(merchantId);

          // Only mark WhatsApp as disconnected — DO NOT change merchant status to DISCONNECTED
          // That would block all automation jobs
          await prisma.merchant.update({
            where: { id: merchantId },
            data: { whatsappConnected: false },
          });

          console.log(`✅ [${merchantId}] Session cleaned. Merchant status preserved. QR scan needed to reconnect.`);
        }
      }
    });

    sock.ev.on("messages.update", async (updates) => {
      for (const update of updates) {
        if (update.update.status === 3) {
          try {
            await prisma.merchant.update({
              where: { id: merchantId },
              data: { totalRead: { increment: 1 } },
            });
            console.log(`✅ [${merchantId}] 1 Marketing Message Read`);
          } catch (e) {}
        }
      }
    });

    sessions.set(merchantId, sock);
    return sock;
  } catch (error) {
    console.error(`❌ [${merchantId}] Error starting session:`, error);
    // Remove lock on Fatal Error
    startingSessions.delete(merchantId);
    throw error;
  }
};

export const restoreActiveSessions = async () => {
  try {
    const activeMerchants = await prisma.merchant.findMany({
      where: { whatsappConnected: true },
    });

    console.log(
      `🔄 Found ${activeMerchants.length} active WhatsApp sessions to restore.`,
    );

    for (let i = 0; i < activeMerchants.length; i++) {
      const merchant = activeMerchants[i];
      setTimeout(() => {
        console.log(
          `🔌 Auto-Restoring session for merchant: ${merchant.brandName}`,
        );
        startWhatsAppSession(merchant.id);
      }, i * 2000);
    }
  } catch (error) {
    console.error("❌ Error restoring sessions:", error);
  }
};

export const sendMessage = async (
  merchantId: string,
  phone: string,
  text: string,
) => {
  try {
    const sock = sessions.get(merchantId);
    if (!sock) {
      console.error(`❌ Session offline for Merchant: ${merchantId}`);
      return false;
    }

    const jid = formatWhatsAppNumber(phone);
    if (!jid) return false;

    await sock.sendMessage(jid, { text });
    return true;
  } catch (error) {
    console.error(`❌ Failed to send message for ${merchantId}:`, error);
    return false;
  }
};
