import axios from "axios";
import prisma from "../../lib/prisma";

export const syncAllShopifyCustomers = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant || !merchant.shopifyToken || !merchant.storeUrl) {
    throw new Error("Merchant credentials missing");
  }

  const cleanUrl = merchant.storeUrl
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  // 1. SMART SYNC LOGIC
  const lastCustomer = await prisma.customer.findFirst({
    where: { merchantId },
    orderBy: { updatedAt: "desc" },
  });

  // initial URL
  let nextUrl: string | null = `https://${cleanUrl}/admin/api/2024-01/customers.json?limit=250`;

  // 🚨 FIX: Safe string concatenation
  if (lastCustomer && nextUrl) {
    nextUrl = `${nextUrl}&updated_at_min=${lastCustomer.updatedAt.toISOString()}`;
    console.log(`[${merchant.brandName}] Smart Sync chalu hai...`);
  }

  let totalSynced = 0;
  
  interface ShopifyCustomerResponse {
    customers: any[];
  }

  try {
    while (nextUrl) {
      // 🚨 FIX: explicit check taaki axios ko null na mile
      const response = await axios.get<ShopifyCustomerResponse>(nextUrl, {
        headers: { "X-Shopify-Access-Token": merchant.shopifyToken },
      });

      const customers = response.data.customers;

      for (const c of customers) {
        const phone = c.phone || c.default_address?.phone || null;
        if (!phone) continue;

        await prisma.customer.upsert({
          where: { merchantId_phone: { merchantId, phone: String(phone) } },
          update: {
            name: c.first_name || "Customer",
            totalSpent: parseFloat(c.total_spent || "0"),
          },
          create: {
            merchantId,
            phone: String(phone),
            name: c.first_name || "Customer",
            totalSpent: parseFloat(c.total_spent || "0"),
          },
        });
        totalSynced++;
      }

      const linkHeader = response.headers["link"] as string | undefined;
      
      // 🚨 FIX: Strict check for next page
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextUrl = matches ? matches[1] : null;
      } else {
        nextUrl = null;
      }

      console.log(`⏳ Progress: Synced ${totalSynced} customers...`);
    }

    console.log(`✅ [${merchant.brandName}] Total ${totalSynced} synced!`);
    return totalSynced;
  } catch (error) {
    console.error("❌ Sync Error:", error);
    throw error;
  }
};