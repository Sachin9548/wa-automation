// src/services/automation.service.ts
import prisma from "../lib/prisma";

export const checkMerchantEligibility = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant || merchant.status !== "ACTIVE") {
    return { eligible: false, reason: "Merchant is not active" };
  }

  const now = new Date();
  if (!merchant.subscriptionExpiry || merchant.subscriptionExpiry < now) {
    return { eligible: false, reason: "Subscription Expired" };
  }

  if (merchant.walletBalance < 0.80) {
    return { eligible: false, reason: "Insufficient Balance" };
  }

  return { eligible: true, merchant };
};