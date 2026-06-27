// src/services/automation.service.ts
import prisma from "../lib/prisma";
import { sessions } from "./whatsapp.service";

export const checkMerchantEligibility = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    return { eligible: false, reason: "Merchant not found" };
  }

  if (merchant.status === "PENDING_ONBOARDING" || merchant.status === "PENDING_ADMIN") {
    return { eligible: false, reason: `Merchant not yet activated (status: ${merchant.status})` };
  }

  if (merchant.status === "DISCONNECTED") {
    return { eligible: false, reason: "WhatsApp session disconnected — merchant needs to reconnect" };
  }

  const now = new Date();
  if (!merchant.subscriptionExpiry || merchant.subscriptionExpiry < now) {
    return { eligible: false, reason: `Subscription expired on ${merchant.subscriptionExpiry?.toDateString()}` };
  }

  if (merchant.walletBalance < 0.80) {
    return { eligible: false, reason: `Insufficient balance (₹${merchant.walletBalance.toFixed(2)})` };
  }

  // Check live WhatsApp session — if offline, job will throw and BullMQ will retry
  const session = sessions.get(merchantId);
  if (!session) {
    return { eligible: false, reason: "WhatsApp session not connected — retry after reconnect" };
  }

  return { eligible: true, merchant };
};