// src/services/automation.service.ts
import prisma from "../lib/prisma";

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

  const now = new Date();
  if (!merchant.subscriptionExpiry || merchant.subscriptionExpiry < now) {
    return { eligible: false, reason: `Subscription expired on ${merchant.subscriptionExpiry?.toDateString()}` };
  }

  // Check Meta credentials are configured
  if (!merchant.metaPhoneNumberId || !merchant.metaAccessToken) {
    return { eligible: false, reason: "Meta WhatsApp credentials not configured — contact admin" };
  }

  return { eligible: true, merchant };
};
