import axios from "axios";
import prisma from "../../lib/prisma";

export const syncAllShopifyCustomers = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant?.shopifyToken || !merchant?.storeUrl) throw new Error("Credentials missing");

  const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // 1. SMART SYNC LOGIC: Check the last updated customer in our DB
  const lastCustomer = await prisma.customer.findFirst({
    where: { merchantId },
    orderBy: { updatedAt: 'desc' }
  });

  let nextUrl = `https://${cleanUrl}/admin/api/2024-01/customers.json?limit=250`;

  // Agar purana data hai, toh sirf naye customers fetch karo (Saves Time & Server Cost!)
  if (lastCustomer) {
    nextUrl += `&updated_at_min=${lastCustomer.updatedAt.toISOString()}`;
    console.log(`[${merchant.brandName}] Smart Sync: Fetching customers updated after ${lastCustomer.updatedAt.toISOString()}`);
  } else {
    console.log(`[${merchant.brandName}] First Time Sync: Fetching ALL customers...`);
  }

  let totalSynced = 0;

  try {
    while (nextUrl) {
      const response = await axios.get(nextUrl, {
        headers: { "X-Shopify-Access-Token": merchant.shopifyToken },
      });

      const customers = response.data.customers;

      for (const c of customers) {
        // Phone number nikaalo
        const phone = c.phone || c.default_address?.phone;
        if (!phone) continue; // Skip if no phone number

        // Database mein Save ya Update karo
        await prisma.customer.upsert({
          where: { merchantId_phone: { merchantId, phone } },
          update: { 
            name: c.first_name || "Customer", 
            totalSpent: parseFloat(c.total_spent || "0") 
          },
          create: {
            merchantId,
            phone,
            name: c.first_name || "Customer",
            totalSpent: parseFloat(c.total_spent || "0"),
          },
        });
        totalSynced++;
      }

      // Check if there's a next page in the 'Link' Header
      const linkHeader = response.headers["link"];
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextUrl = matches ? matches[1] : null;
      } else {
        nextUrl = null; // Saara data khatam, loop break
      }
      
      if (totalSynced % 250 === 0) {
        console.log(`⏳ Progress: Synced ${totalSynced} customers...`);
      }
    }

    console.log(`✅ [${merchant.brandName}] Total ${totalSynced} customers synced!`);
    return totalSynced;
  } catch (error) {
    console.error("❌ Sync Error:", error);
    throw error;
  }
};