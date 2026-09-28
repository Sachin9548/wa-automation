import { Router, Request, Response } from "express";
import {
  handleAbandonedCartWebhook,
  handleOrderCreatedWebhook,
} from "../webhooks/shopify.webhook";
import {
  markMessageRead,
  sendMetaTextMessage,
} from "../services/whatsapp.service";
import { generateAIReply } from "../services/ai.service";
import prisma from "../lib/prisma";

const router = Router();

// ── Shopify Webhooks ──────────────────────────────────────────────────────────
router.post("/shopify/cart-abandoned/:merchantId", handleAbandonedCartWebhook);
router.post("/shopify/abandoned-cart/:merchantId", handleAbandonedCartWebhook);
router.post("/shopify/order-created/:merchantId", handleOrderCreatedWebhook);

// ── Meta Webhook — Verification (GET) ────────────────────────────────────────
// Meta calls this once when you register the webhook to verify the URL
router.get("/meta", (req: Request, res: Response) => {
  const VERIFY_TOKEN =
    process.env.META_WEBHOOK_VERIFY_TOKEN || "wa_auto_verify_2026";
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log(`📡 Meta webhook verification: mode=${mode} token=${token}`);

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Meta webhook verified!");
    return res.status(200).send(challenge);
  }
  console.log("❌ Meta webhook verification failed");
  return res.status(403).send("Forbidden");
});

// ── Meta Webhook — Events (POST) ─────────────────────────────────────────────
// Meta sends message status updates & incoming messages here
router.post("/meta", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body.object !== "whatsapp_business_account") {
      return res.status(404).send("Not Found");
    } else if (body.object !== "whatsapp_business_account") {
      return res.status(404).send("Not Found");
    }
    // ── Instagram DMs + Comments ───────────────────────────────────────
    for (const entry of body.entry || []) {
      const igAccountId = String(entry.id);

      // Find merchant by igAccountId
      const igMerchant = await prisma.merchant.findFirst({
        where: { igAccountId },
      });
      if (!igMerchant) {
        console.warn(`⚠️ No merchant found for igAccountId: ${igAccountId}`);
        continue;
      }

      for (const change of entry.changes || []) {
        // ── Instagram DM ──────────────────────────────────────────────
        if (change.field === "messaging") {
          const msgValue = change.value;
          const senderId = msgValue.sender?.id;
          const text = msgValue.message?.text || "[media]";
          if (!senderId) continue;

          await prisma.message.create({
            data: {
              merchantId: igMerchant.id,
              customerPhone: senderId,
              content: text,
              direction: "INCOMING",
              status: "DELIVERED",
              channel: "INSTAGRAM_DM",
            },
          });

          // AI auto-reply (same as WhatsApp — reuse generateAIReply)
          if (igMerchant.aiAutoReply && igMerchant.igAccessToken) {
            setImmediate(async () => {
              try {
                const { generateAIReply } =
                  await import("../services/ai.service");
                const aiResult = await generateAIReply(
                  text,
                  (igMerchant as any).aiKnowledgeBase || "",
                  igMerchant.brandName,
                  (igMerchant as any).aiFallbackMessage,
                );
                if (aiResult.replied || aiResult.isFallback) {
                  // Send IG DM reply
                  const axiosLib = await import("axios");
                  await axiosLib.default.post(
                    `https://graph.instagram.com/v23.0/${igAccountId}/messages`,
                    {
                      recipient: { id: senderId },
                      message: { text: aiResult.message },
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${igMerchant.igAccessToken}`,
                      },
                    },
                  );
                  await prisma.message.create({
                    data: {
                      merchantId: igMerchant.id,
                      customerPhone: senderId,
                      content: aiResult.message,
                      direction: "OUTGOING",
                      status: "SENT",
                      channel: "INSTAGRAM_DM",
                      templateName: aiResult.isFallback
                        ? "ai_fallback"
                        : "ai_reply",
                    },
                  });
                }
              } catch (e: any) {
                console.error("❌ IG AI reply error:", e.message);
              }
            });
          }
        }

        // ── Instagram Comment ──────────────────────────────────────────
        if (change.field === "comments") {
          const comment = change.value;
          const commentId = comment.id;
          const fromId = comment.from?.id || "unknown";
          const text = comment.text || "";
          if (!commentId || !text) continue;

          await prisma.message.create({
            data: {
              merchantId: igMerchant.id,
              customerPhone: fromId,
              content: text,
              direction: "INCOMING",
              status: "DELIVERED",
              channel: "INSTAGRAM_COMMENT",
              sourceId: commentId,
            },
          });

          // Auto-reply to comment (public reply)
          if (igMerchant.igAccessToken) {
            setImmediate(async () => {
              try {
                const { generateAIReply } =
                  await import("../services/ai.service");
                const aiResult = await generateAIReply(
                  text,
                  (igMerchant as any).aiKnowledgeBase || "",
                  igMerchant.brandName,
                  (igMerchant as any).aiFallbackMessage,
                );
                if (aiResult.replied || aiResult.isFallback) {
                  const axiosLib = await import("axios");
                  // Public comment reply
                  await axiosLib.default.post(
                    `https://graph.instagram.com/v23.0/${commentId}/replies`,
                    { message: aiResult.message },
                    {
                      headers: {
                        Authorization: `Bearer ${igMerchant.igAccessToken}`,
                      },
                    },
                  );
                  await prisma.message.create({
                    data: {
                      merchantId: igMerchant.id,
                      customerPhone: fromId,
                      content: aiResult.message,
                      direction: "OUTGOING",
                      status: "SENT",
                      channel: "INSTAGRAM_COMMENT",
                      sourceId: commentId,
                      templateName: "ai_reply",
                    },
                  });
                }
              } catch (e: any) {
                console.error("❌ IG comment reply error:", e.message);
              }
            });
          }
        }
      }
    }




    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // ── Incoming message from customer ──────────────────────────────
        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from; // customer phone
            const phoneNumberId = value.metadata?.phone_number_id;
            const msgType = message.type || "text";

            // Extract content based on message type
            let content = "";
            let mediaData: {
              mediaId?: string;
              mediaType?: string;
              mediaMimeType?: string;
              mediaCaption?: string;
              mediaFilename?: string;
              mediaLat?: number;
              mediaLng?: number;
              mediaAddress?: string;
            } = {};

            if (msgType === "text") {
              content = message.text?.body || "";
            } else if (msgType === "image") {
              const img = message.image || {};
              content = img.caption ? `📷 ${img.caption}` : "📷 Image";
              mediaData = {
                mediaId: img.id,
                mediaType: "image",
                mediaMimeType: img.mime_type,
                mediaCaption: img.caption || null,
              };
            } else if (msgType === "video") {
              const vid = message.video || {};
              content = vid.caption ? `🎥 ${vid.caption}` : "🎥 Video";
              mediaData = {
                mediaId: vid.id,
                mediaType: "video",
                mediaMimeType: vid.mime_type,
                mediaCaption: vid.caption || null,
              };
            } else if (msgType === "audio") {
              const aud = message.audio || {};
              content = "🎤 Voice Message";
              mediaData = {
                mediaId: aud.id,
                mediaType: "audio",
                mediaMimeType: aud.mime_type,
              };
            } else if (msgType === "document") {
              const doc = message.document || {};
              content = `📄 ${doc.filename || "Document"}`;
              mediaData = {
                mediaId: doc.id,
                mediaType: "document",
                mediaMimeType: doc.mime_type,
                mediaFilename: doc.filename || null,
                mediaCaption: doc.caption || null,
              };
            } else if (msgType === "sticker") {
              const stk = message.sticker || {};
              content = "🎭 Sticker";
              mediaData = {
                mediaId: stk.id,
                mediaType: "sticker",
                mediaMimeType: stk.mime_type,
              };
            } else if (msgType === "location") {
              const loc = message.location || {};
              const name =
                loc.name || loc.address || `${loc.latitude},${loc.longitude}`;
              content = `📍 ${name}`;
              mediaData = {
                mediaType: "location",
                mediaLat: loc.latitude,
                mediaLng: loc.longitude,
                mediaAddress: loc.name || loc.address || null,
              };
            } else if (msgType === "reaction") {
              content = `${message.reaction?.emoji || "👍"} Reaction`;
            } else {
              content = `[${msgType}]`;
            }

            console.log(`📨 Incoming WA from ${from} [${msgType}]: ${content}`);

            // Find merchant by phoneNumberId
            const merchant = (await prisma.merchant.findFirst({
              where: { metaPhoneNumberId: phoneNumberId },
            })) as any;

            if (!merchant) {
              console.warn(
                `⚠️ No merchant found for phoneNumberId: ${phoneNumberId}`,
              );
              continue;
            }

            // ── STOP keyword — auto opt-out ─────────────────────────────
            const STOP_KEYWORDS = [
              "stop",
              "unsubscribe",
              "no",
              "quit",
              "cancel",
              "optout",
              "opt out",
              "opt-out",
            ];
            if (
              msgType === "text" &&
              STOP_KEYWORDS.includes(content.trim().toLowerCase())
            ) {
              console.log(`🚫 STOP keyword from ${from} — opting out`);
              await prisma.customer.updateMany({
                where: { merchantId: merchant.id, phone: from },
                data: { tags: "wa_invalid|auto_optout" },
              });
              // Save the incoming stop message
              await prisma.message.create({
                data: {
                  merchantId: merchant.id,
                  customerPhone: from,
                  content,
                  direction: "INCOMING",
                  status: "READ",
                  ...mediaData,
                },
              });
              // Mark as read on Meta side
              if (merchant.metaAccessToken) {
                await markMessageRead(
                  phoneNumberId!,
                  merchant.metaAccessToken,
                  message.id,
                );
              }
              continue; // Skip normal save — already saved above
            }

            // ── Save incoming message ───────────────────────────────────
            const savedMsg = await prisma.message.create({
              data: {
                merchantId: merchant.id,
                customerPhone: from,
                content,
                direction: "INCOMING",
                status: "DELIVERED",
                ...mediaData,
              },
            });

            // Mark as read on Meta side
            if (merchant.metaAccessToken) {
              await markMessageRead(
                phoneNumberId!,
                merchant.metaAccessToken,
                message.id,
              );
            }

            // ── AI Auto-Reply ────────────────────────────────────────────
            // Only trigger for text messages — AI can't answer media
            if (
              msgType === "text" &&
              content.trim().length > 2 &&
              (merchant as any).aiAutoReply === true &&
              merchant.metaPhoneNumberId &&
              merchant.metaAccessToken
            ) {
              // Fire-and-forget — don't block webhook response
              setImmediate(async () => {
                try {
                  // Fetch last 5 messages for conversation context
                  const recentMsgs = await prisma.message.findMany({
                    where: {
                      merchantId: merchant.id,
                      customerPhone: from,
                    },
                    orderBy: { timestamp: "desc" },
                    take: 5,
                    select: { direction: true, content: true },
                  });

                  // Reverse to chronological order, map to AI role format
                  const conversationHistory = recentMsgs
                    .reverse()
                    .map((m: any) => ({
                      role: (m.direction === "INCOMING"
                        ? "user"
                        : "assistant") as "user" | "assistant",
                      content: m.content,
                    }));

                  const aiResult = await generateAIReply(
                    content,
                    (merchant as any).aiKnowledgeBase || "",
                    merchant.brandName,
                    (merchant as any).aiFallbackMessage,
                    conversationHistory,
                  );

                  if (aiResult.replied || aiResult.isFallback) {
                    // Send reply via WhatsApp
                    const sent = await sendMetaTextMessage(
                      merchant.metaPhoneNumberId!,
                      merchant.metaAccessToken!,
                      from,
                      aiResult.message,
                    );

                    if (sent) {
                      // Save AI reply as outgoing message
                      await prisma.message.create({
                        data: {
                          merchantId: merchant.id,
                          customerPhone: from,
                          content: aiResult.message,
                          direction: "OUTGOING",
                          status: "SENT",
                          templateName: aiResult.isFallback
                            ? "ai_fallback"
                            : "ai_reply",
                        },
                      });
                      await prisma.merchant.update({
                        where: { id: merchant.id },
                        data: { totalSent: { increment: 1 } },
                      });
                      console.log(
                        `🤖 AI ${aiResult.isFallback ? "fallback" : "reply"} sent to ${from} (${aiResult.tokensUsed || 0} tokens)`,
                      );
                    }
                  }
                } catch (aiErr: any) {
                  console.error("❌ AI auto-reply error:", aiErr.message);
                  // Non-critical — swallow silently
                }
              });
            }
          }
        }

        // ── Message status updates ────────────────────────────────────────
        if (value.statuses) {
          for (const status of value.statuses) {
            const statusMap: Record<string, string> = {
              sent: "SENT",
              delivered: "DELIVERED",
              read: "READ",
              failed: "FAILED",
            };

            const dbStatus = statusMap[status.status];
            if (!dbStatus) continue;

            const phoneNumberId = value.metadata?.phone_number_id;
            const merchant = await prisma.merchant.findFirst({
              where: { metaPhoneNumberId: phoneNumberId },
            });
            if (!merchant) continue;

            const recipientPhone = status.recipient_id;

            // Update latest outgoing message for this recipient
            const latestMsg = await prisma.message.findFirst({
              where: {
                merchantId: merchant.id,
                customerPhone: { contains: recipientPhone.slice(-10) },
                direction: "OUTGOING",
                status: { not: "FAILED" },
              },
              orderBy: { timestamp: "desc" },
            });

            if (latestMsg) {
              const updateData: any = { status: dbStatus };
              if (dbStatus === "FAILED") {
                updateData.failReason =
                  status.errors?.[0]?.title ||
                  `Meta error ${status.errors?.[0]?.code}`;
              }
              await prisma.message.update({
                where: { id: latestMsg.id },
                data: updateData,
              });
            }

            // Increment merchant read count
            if (dbStatus === "READ") {
              await prisma.merchant.update({
                where: { id: merchant.id },
                data: { totalRead: { increment: 1 } },
              });
            }

            console.log(`📊 Status [${dbStatus}] for ${recipientPhone}`);
          }
        }
      }
    }

    res.status(200).send("EVENT_RECEIVED");
  } catch (error) {
    console.error("Meta webhook error:", error);
    res.status(200).send("EVENT_RECEIVED"); // Always 200 to Meta
  }
});

export default router;
