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
router.post("/meta", async (req: Request, res: Response): Promise<any> => {
  try {
    const body = req.body;

    // Gatekeeper: Sirf valid objects ko andar aane do
    if (!["whatsapp_business_account", "instagram", "page"].includes(body.object)) {
      return res.status(404).send("Not Found");
    }

    // ==========================================
    // 1. INSTAGRAM HANDLER
    // ==========================================
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        const igAccountId = String(entry.id);

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

            // AI auto-reply for Instagram DMs
            if (igMerchant.aiAutoReply && igMerchant.igAccessToken) {
              setImmediate(async () => {
                try {
                  const { generateAIReply } = await import("../services/ai.service");
                  const aiResult = await generateAIReply(
                    text,
                    (igMerchant as any).aiKnowledgeBase || "",
                    igMerchant.brandName,
                    (igMerchant as any).aiFallbackMessage,
                  );
                  if (aiResult.replied || aiResult.isFallback) {
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
                        templateName: aiResult.isFallback ? "ai_fallback" : "ai_reply",
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
                  const { generateAIReply } = await import("../services/ai.service");
                  const aiResult = await generateAIReply(
                    text,
                    (igMerchant as any).aiKnowledgeBase || "",
                    igMerchant.brandName,
                    (igMerchant as any).aiFallbackMessage,
                  );
                  if (aiResult.replied || aiResult.isFallback) {
                    const axiosLib = await import("axios");
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
      return res.status(200).send("EVENT_RECEIVED");
    }

    // ==========================================
    // 2. WHATSAPP HANDLER
    // ==========================================
    else if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;

          // ── Incoming message from customer ──────────────────────────────
          if (value.messages) {
            for (const message of value.messages) {
              const from = message.from;
              const phoneNumberId = value.metadata?.phone_number_id;
              const msgType = message.type || "text";

              let content = "";
              let mediaData: any = {};

              if (msgType === "text") {
                content = message.text?.body || "";
              } else if (msgType === "image") {
                const img = message.image || {};
                content = img.caption ? `📷 ${img.caption}` : "📷 Image";
                mediaData = { mediaId: img.id, mediaType: "image", mediaMimeType: img.mime_type, mediaCaption: img.caption || null };
              } else if (msgType === "video") {
                const vid = message.video || {};
                content = vid.caption ? `🎥 ${vid.caption}` : "🎥 Video";
                mediaData = { mediaId: vid.id, mediaType: "video", mediaMimeType: vid.mime_type, mediaCaption: vid.caption || null };
              } else if (msgType === "audio") {
                const aud = message.audio || {};
                content = "🎤 Voice Message";
                mediaData = { mediaId: aud.id, mediaType: "audio", mediaMimeType: aud.mime_type };
              } else if (msgType === "document") {
                const doc = message.document || {};
                content = `📄 ${doc.filename || "Document"}`;
                mediaData = { mediaId: doc.id, mediaType: "document", mediaMimeType: doc.mime_type, mediaFilename: doc.filename || null };
              } else if (msgType === "sticker") {
                const stk = message.sticker || {};
                content = "🎭 Sticker";
                mediaData = { mediaId: stk.id, mediaType: "sticker", mediaMimeType: stk.mime_type };
              } else if (msgType === "location") {
                const loc = message.location || {};
                content = `📍 ${loc.name || loc.address || `${loc.latitude},${loc.longitude}`}`;
                mediaData = { mediaType: "location", mediaLat: loc.latitude, mediaLng: loc.longitude, mediaAddress: loc.name || loc.address || null };
              } else if (msgType === "reaction") {

                content = `${message.reaction?.emoji || "👍"} Reaction`;
              } else if (msgType === "interactive") {
                // ── Button reply — COD Blast "Place My Order" button ──────────────
                const btnReply = message.interactive?.button_reply;
                content = btnReply?.title || `[Interactive: ${message.interactive?.type}]`;

                if (btnReply?.title?.includes('Place My Order') || btnReply?.id === 'place_order') {
                  // Find pending COD blast customer record
                  setImmediate(async () => {
                    try {
                      // Find merchant
                      const merchant2 = await prisma.merchant.findFirst({
                        where: { metaPhoneNumberId: phoneNumberId }
                      }) as any;
                      if (!merchant2?.shopifyToken || !merchant2?.storeUrl) return;

                      const cleanUrl = merchant2.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

                      // Get customer's last abandoned cart for product info
                      const lastCart = await prisma.abandonedCart.findFirst({
                        where: { merchantId: merchant2.id, customerPhone: from },
                        orderBy: { createdAt: 'desc' },
                        select: { lineItems: true, totalPrice: true, customerName: true }
                      });

                      let lineItems: any[] = [];
                      try {
                        if (lastCart?.lineItems) lineItems = JSON.parse(lastCart.lineItems);
                      } catch { }

                      if (lineItems.length === 0) {
                        lineItems = [{ title: 'Product (WhatsApp COD)', price: '0.00', quantity: 1 }];
                      }

                      const shippingAddress = {
                        first_name: lastCart?.customerName?.split(' ')[0] || 'Customer',
                        last_name: lastCart?.customerName?.split(' ').slice(1).join(' ') || '',
                        address1: 'Address to be confirmed via WhatsApp call',
                        city: 'Pending', province: 'Pending', zip: '000000',
                        country: 'India', phone: from,
                      };

                      const axiosLib = await import('axios');
                      const orderResp = await axiosLib.default.post(
                        `https://${cleanUrl}/admin/api/2024-01/orders.json`,
                        {
                          order: {
                            line_items: lineItems.map((li: any) => ({
                              title: li.name || li.title || 'Product',
                              quantity: li.quantity || 1,
                              price: li.price ? String(li.price) : '0.00',
                            })),
                            customer: { phone: from },
                            shipping_address: shippingAddress,
                            billing_address: shippingAddress,
                            financial_status: 'pending',
                            tags: 'WA-Automations, WhatsApp-COD, COD-Blast',
                            note: 'COD order placed via WhatsApp bot (COD Blast button click)',
                            send_receipt: false,
                            send_fulfillment_receipt: false,
                          }
                        },
                        { headers: { 'X-Shopify-Access-Token': merchant2.shopifyToken, 'Content-Type': 'application/json' } }
                      );

                      const shopifyOrder = orderResp.data?.order;
                      const orderNum = shopifyOrder?.name || String(shopifyOrder?.id);

                      // Confirm message to customer
                      const { sendMetaTextMessage } = await import('../services/whatsapp.service');
                      await sendMetaTextMessage(
                        phoneNumberId,
                        merchant2.metaAccessToken,
                        from,
                        `🎉 Order ${orderNum} placed successfully!\n\nOur team will call you shortly to confirm your address.\n\nThank you for shopping with us! 🛍️`
                      );

                      // Save order message
                      await prisma.message.create({
                        data: {
                          merchantId: merchant2.id,
                          customerPhone: from,
                          content: `✅ COD order placed: ${orderNum}`,
                          direction: 'OUTGOING',
                          status: 'SENT',
                        }
                      });

                      // Update recovered revenue
                      await prisma.merchant.update({
                        where: { id: merchant2.id },
                        data: { totalConverted: { increment: 1 }, recoveredRevenue: { increment: parseFloat(shopifyOrder?.total_price || '0') } }
                      });

                      console.log(`🛒 COD Blast order placed: ${orderNum} for ${from}`);
                    } catch (e: any) {
                      console.error('❌ COD Blast auto-order error:', e.message);
                    }
                  });
                }
              } else {
                content = `[${msgType}]`;
              }


              console.log(`📨 Incoming WA from ${from} [${msgType}]: ${content}`);

              const merchant = (await prisma.merchant.findFirst({
                where: { metaPhoneNumberId: phoneNumberId },
              })) as any;

              if (!merchant) {
                console.warn(`⚠️ No merchant found for phoneNumberId: ${phoneNumberId}`);
                continue;
              }

              // ── STOP keyword ─────────────────────────────
              const STOP_KEYWORDS = ["stop", "unsubscribe", "no", "quit", "cancel", "optout", "opt out", "opt-out"];
              if (msgType === "text" && STOP_KEYWORDS.includes(content.trim().toLowerCase())) {
                console.log(`🚫 STOP keyword from ${from} — opting out`);
                await prisma.customer.updateMany({
                  where: { merchantId: merchant.id, phone: from },
                  data: { tags: "wa_invalid|auto_optout" },
                });
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
                if (merchant.metaAccessToken) {
                  await markMessageRead(phoneNumberId!, merchant.metaAccessToken, message.id);
                }
                continue;
              }

              // ── Save incoming message ───────────────────────────────────
              await prisma.message.create({
                data: {
                  merchantId: merchant.id,
                  customerPhone: from,
                  content,
                  direction: "INCOMING",
                  status: "DELIVERED",
                  ...mediaData,
                },
              });

              if (merchant.metaAccessToken) {
                await markMessageRead(phoneNumberId!, merchant.metaAccessToken, message.id);
              }

              // ── AI Auto-Reply ────────────────────────────────────────────
              if (
                msgType === "text" &&
                content.trim().length > 2 &&
                (merchant as any).aiAutoReply === true &&
                merchant.metaPhoneNumberId &&
                merchant.metaAccessToken
              ) {
                setImmediate(async () => {
                  try {
                    const recentMsgs = await prisma.message.findMany({
                      where: { merchantId: merchant.id, customerPhone: from },
                      orderBy: { timestamp: "desc" },
                      take: 5,
                      select: { direction: true, content: true },
                    });

                    const conversationHistory = recentMsgs.reverse().map((m: any) => ({
                      role: (m.direction === "INCOMING" ? "user" : "assistant") as "user" | "assistant",
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
                      const sent = await sendMetaTextMessage(
                        merchant.metaPhoneNumberId!,
                        merchant.metaAccessToken!,
                        from,
                        aiResult.message,
                      );

                      if (sent) {
                        await prisma.message.create({
                          data: {
                            merchantId: merchant.id,
                            customerPhone: from,
                            content: aiResult.message,
                            direction: "OUTGOING",
                            status: "SENT",
                            templateName: aiResult.isFallback ? "ai_fallback" : "ai_reply",
                          },
                        });
                        await prisma.merchant.update({
                          where: { id: merchant.id },
                          data: { totalSent: { increment: 1 } },
                        });
                      }
                    }
                  } catch (aiErr: any) {
                    console.error("❌ AI auto-reply error:", aiErr.message);
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
                  updateData.failReason = status.errors?.[0]?.title || `Meta error ${status.errors?.[0]?.code}`;
                }
                await prisma.message.update({
                  where: { id: latestMsg.id },
                  data: updateData,
                });
              }

              if (dbStatus === "READ") {
                await prisma.merchant.update({
                  where: { id: merchant.id },
                  data: { totalRead: { increment: 1 } },
                });
              }
            }
          }
        }
      }
      return res.status(200).send("EVENT_RECEIVED");
    }

    // ==========================================
    // 3. FALLBACK FOR OTHER OBJECTS (e.g. 'page')
    // ==========================================
    return res.status(200).send("EVENT_RECEIVED");

  } catch (error) {
    console.error("Meta webhook error:", error);
    return res.status(200).send("EVENT_RECEIVED");
  }
});
export default router;
