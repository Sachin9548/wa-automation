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

  // Orders endpoint use karo — isme billing/shipping address ke saath phone milta hai
  let nextUrl: string | null = `https://${cleanUrl}/admin/api/2024-01/orders.json?limit=250&status=any&fields=id,customer,billing_address,shipping_address`;

  let totalSynced = 0;
  const seenPhones = new Set<string>(); // duplicate phones skip karo

  interface ShopifyOrderResponse {
    orders: any[];
  }

  try {
    while (nextUrl) {
      const response = await axios.get<ShopifyOrderResponse>(nextUrl, {
        headers: { "X-Shopify-Access-Token": merchant.shopifyToken },
      });

      const orders = response.data.orders;
      console.log(`📦 Shopify returned ${orders.length} orders in this page`);

      if (orders.length > 0) {
        console.log(`🔍 First order customer:`, {
          customer: orders[0].customer,
          billing: orders[0].billing_address,
          shipping: orders[0].shipping_address,
        });
      }

      for (const order of orders) {
        // Phone: customer > billing_address > shipping_address se nikaalo
        const phone =
          order.customer?.phone ||
          order.billing_address?.phone ||
          order.shipping_address?.phone ||
          null;

        const email = order.customer?.email || null;
        const firstName = order.customer?.first_name || order.billing_address?.first_name || order.shipping_address?.first_name || "Customer";
        const lastName = order.customer?.last_name || order.billing_address?.last_name || order.shipping_address?.last_name || "";
        const fullName = `${firstName} ${lastName}`.trim();

        console.log(`👤 Order customer: ${fullName} | Phone: ${phone || "NONE"} | Email: ${email || "NONE"}`);

        if (!phone && !email) {
          console.log(`  ⚠️ Skipped — no phone or email`);
          continue;
        }

        // Phone nahi hai — email se unique key banao, save karo "no_phone" group mein
        let cleanPhone: string;
        if (!phone) {
          if (!email) {
            console.log(`  ⚠️ Skipped — no phone AND no email`);
            continue;
          }
          // email-only customer — store with email: prefix as unique key
          cleanPhone = `email:${email}`;
          console.log(`  📧 No phone — saving as email-only: ${cleanPhone}`);
        } else {
          cleanPhone = String(phone).replace(/\s+/g, "");
        }

        // Duplicate skip
        if (seenPhones.has(cleanPhone)) continue;
        seenPhones.add(cleanPhone);

        await prisma.customer.upsert({
          where: { merchantId_phone: { merchantId, phone: cleanPhone } },
          update: {
            name: fullName,
            email: email,
            totalOrders: order.customer?.orders_count || 1,
            totalSpent: parseFloat(order.customer?.total_spent || "0"),
            hasPlacedOrder: true,
          },
          create: {
            merchantId,
            phone: cleanPhone,
            name: fullName,
            email: email,
            totalOrders: order.customer?.orders_count || 1,
            totalSpent: parseFloat(order.customer?.total_spent || "0"),
            hasPlacedOrder: true,
          },
        });
        totalSynced++;
      }

      // Next page check
      const linkHeader = response.headers["link"] as string | undefined;
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const matches = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextUrl = matches ? matches[1] : null;
      } else {
        nextUrl = null;
      }

      console.log(`⏳ Progress: Synced ${totalSynced} customers so far...`);
    }

    console.log(`✅ [${merchant.brandName}] Total ${totalSynced} synced from orders!`);
    return totalSynced;
  } catch (error: any) {
    console.error("❌ Sync Error:", error?.response?.data || error?.message || error);
    throw error;
  }
};