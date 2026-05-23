import axios from "axios";
import prisma from "../../lib/prisma";

export const fetchAbandonedCarts = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });

  if (!merchant?.shopifyToken || !merchant?.storeUrl) return;

  try {
    // Shopify API for Abandoned Checkouts
    const response = await axios.get(
      `https://${merchant.storeUrl}/admin/api/2024-01/checkouts.json?status=open`,
      { headers: { "X-Shopify-Access-Token": merchant.shopifyToken } }
    );

    const checkouts = response.data.checkouts;
    console.log(`📦 Found ${checkouts.length} checkouts for ${merchant.brandName}`);

    return checkouts;
  } catch (error) {
    console.error(`❌ Shopify Fetch Error for ${merchantId}:`, error);
    return [];
  }
};