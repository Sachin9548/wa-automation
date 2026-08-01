// src/services/automation.service.ts
import prisma from "../lib/prisma";

export const checkMerchantEligibility = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant) {
    return { eligible: false, reason: "Merchant not found" };
  }

  // Must be activated by admin first
  if (merchant.status === "PENDING_ONBOARDING" || merchant.status === "PENDING_ADMIN") {
    return { eligible: false, reason: `Merchant not yet activated (status: ${merchant.status})` };
  }

  // Admin manually controls service — subscription expiry does NOT stop service
  // Only serviceActive toggle stops messages
  if (!(merchant as any).serviceActive) {
    return { eligible: false, reason: "Service paused by admin" };
  }

  // Meta credentials must be set
  if (!merchant.metaPhoneNumberId || !merchant.metaAccessToken) {
    return { eligible: false, reason: "Meta WhatsApp credentials not configured" };
  }

  return { eligible: true, merchant };
};
