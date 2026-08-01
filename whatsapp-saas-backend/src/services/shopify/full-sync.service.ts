// src/services/shopify/full-sync.service.ts
// Full Shopify data sync — customers + orders (golden data)
// Rate-limit safe: 250 records/page, 1 min delay between pages

import axios from 'axios';
import prisma from '../../lib/prisma';

const PAGE_DELAY_MS = 60 * 1000; // 1 minute between pages (Shopify rate limit safe)
const PAGE_SIZE = 250;

// ── Helper: sleep ─────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Main full sync function ───────────────────────────────────────────────────
export const runFullShopifySync = async (merchantId: string): Promise<{ customers: number; orders: number }> => {
  const merchant = await prisma.merchant.findUnique({ where: { id: merchantId } });
  if (!merchant?.shopifyToken || !merchant?.storeUrl) {
    throw new Error('Shopify credentials missing');
  }

  const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const headers = { 'X-Shopify-Access-Token': merchant.shopifyToken };

  // Mark sync as running
  await (prisma as any).syncLog.upsert({
    where: { merchantId },
    update: { status: 'running', lastSyncAt: new Date(), note: 'Sync started' },
    create: { merchantId, status: 'running', lastSyncAt: new Date(), note: 'Sync started' }
  });

  console.log(`🔄 Starting full sync for ${merchant.brandName}`);

  let totalCustomers = 0;
  let totalOrders = 0;

  try {
    // ── 1. Sync Customers ───────────────────────────────────────────────────
    totalCustomers = await syncCustomers(merchantId, cleanUrl, headers);

    // ── 2. Sync Orders ──────────────────────────────────────────────────────
    totalOrders = await syncOrders(merchantId, cleanUrl, headers);

    // Update sync log
    await (prisma as any).syncLog.update({
      where: { merchantId },
      data: {
        status: 'completed',
        lastSyncAt: new Date(),
        totalSynced: totalCustomers + totalOrders,
        note: `✅ ${totalCustomers} customers, ${totalOrders} orders`
      }
    });

    console.log(`✅ Full sync complete: ${totalCustomers} customers, ${totalOrders} orders`);
    return { customers: totalCustomers, orders: totalOrders };

  } catch (error: any) {
    await (prisma as any).syncLog.update({
      where: { merchantId },
      data: { status: 'failed', note: error.message }
    });
    throw error;
  }
};

// ── Sync all customers ────────────────────────────────────────────────────────
async function syncCustomers(merchantId: string, cleanUrl: string, headers: any): Promise<number> {
  let nextUrl: string | null = `https://${cleanUrl}/admin/api/2024-01/customers.json?limit=${PAGE_SIZE}&order=updated_at+asc`;
  let total = 0;
  let page = 1;

  // Smart sync: only fetch updated after last sync
  const syncLog = await (prisma as any).syncLog.findUnique({ where: { merchantId } });
  if (syncLog?.lastSyncAt && syncLog.status === 'completed') {
    const lastSync = new Date(syncLog.lastSyncAt).toISOString();
    nextUrl = `https://${cleanUrl}/admin/api/2024-01/customers.json?limit=${PAGE_SIZE}&updated_at_min=${lastSync}&order=updated_at+asc`;
    console.log(`📅 Incremental sync from ${lastSync}`);
  } else {
    console.log(`📦 Full customer sync (first time)`);
  }

  while (nextUrl) {
    console.log(`📄 Customers page ${page} | URL: ${nextUrl.substring(0, 80)}...`);

    const resp = await axios.get(nextUrl, { headers });
    const customers = resp.data.customers || [];
    console.log(`   → Got ${customers.length} customers`);

    for (const c of customers) {
      const phone = c.phone || c.default_address?.phone || null;
      const email = c.email || null;
      const phoneKey = phone ? String(phone).replace(/\s+/g, '') : (email ? `email:${email}` : null);

      if (!phoneKey) continue;

      await prisma.customer.upsert({
        where: { merchantId_phone: { merchantId, phone: phoneKey } },
        update: {
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Customer',
          email: email,
          totalOrders: c.orders_count || 0,
          totalSpent: parseFloat(c.total_spent || '0'),
          shopifyCustomerId: String(c.id),
          city: c.default_address?.city || null,
          province: c.default_address?.province || null,
          country: c.default_address?.country || null,
          tags: c.tags || null,
          lastOrderDate: c.last_order_id ? new Date() : null,
        },
        create: {
          merchantId,
          phone: phoneKey,
          name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Customer',
          email: email,
          totalOrders: c.orders_count || 0,
          totalSpent: parseFloat(c.total_spent || '0'),
          shopifyCustomerId: String(c.id),
          city: c.default_address?.city || null,
          province: c.default_address?.province || null,
          country: c.default_address?.country || null,
          tags: c.tags || null,
        }
      });
      total++;
    }

    // Check for next page
    const linkHeader = resp.headers['link'] as string | undefined;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }

    // Rate limit: wait 1 minute before next page
    if (nextUrl) {
      console.log(`⏳ Waiting 60s before next page (rate limit safe)...`);
      await sleep(PAGE_DELAY_MS);
      page++;
    }
  }

  console.log(`✅ Customers synced: ${total}`);
  return total;
}

// ── Sync all orders ───────────────────────────────────────────────────────────
async function syncOrders(merchantId: string, cleanUrl: string, headers: any): Promise<number> {
  let nextUrl: string | null = `https://${cleanUrl}/admin/api/2024-01/orders.json?limit=${PAGE_SIZE}&status=any&order=created_at+asc`;
  let total = 0;
  let page = 1;

  while (nextUrl) {
    console.log(`📄 Orders page ${page}`);

    const resp = await axios.get(nextUrl, { headers });
    const orders = resp.data.orders || [];
    console.log(`   → Got ${orders.length} orders`);

    for (const o of orders) {
      const phone = o.customer?.phone || o.billing_address?.phone || o.shipping_address?.phone;
      const phoneKey = phone ? String(phone).replace(/\s+/g, '') : null;

      // Find customer in DB
      let customerId: string | null = null;
      if (phoneKey) {
        const customer = await prisma.customer.findFirst({
          where: { merchantId, phone: phoneKey }
        });
        if (customer) {
          customerId = customer.id;
          // Mark as has placed order
          await prisma.customer.update({
            where: { id: customer.id },
            data: {
              hasPlacedOrder: true,
              lastOrderDate: o.created_at ? new Date(o.created_at) : undefined,
              firstOrderDate: customer.firstOrderDate ? undefined : (o.created_at ? new Date(o.created_at) : undefined),
              averageOrderValue: customer.totalOrders > 0
                ? (customer.totalSpent + parseFloat(o.total_price || '0')) / (customer.totalOrders + 1)
                : parseFloat(o.total_price || '0'),
            }
          });
        }
      }

      // Upsert order
      try {
        await (prisma as any).order.upsert({
          where: { merchantId_shopifyOrderId: { merchantId, shopifyOrderId: String(o.id) } },
          update: {
            status: o.fulfillment_status || 'unfulfilled',
            paymentStatus: o.financial_status || 'paid',
            totalPrice: parseFloat(o.total_price || '0'),
            lineItems: JSON.stringify(o.line_items?.map((li: any) => ({
              name: li.name,
              quantity: li.quantity,
              price: li.price,
              sku: li.sku,
            }))),
          },
          create: {
            merchantId,
            customerId,
            shopifyOrderId: String(o.id),
            orderNumber: o.name || null,
            totalPrice: parseFloat(o.total_price || '0'),
            currency: o.currency || 'INR',
            status: o.fulfillment_status || 'unfulfilled',
            paymentStatus: o.financial_status || 'paid',
            lineItems: JSON.stringify(o.line_items?.map((li: any) => ({
              name: li.name,
              quantity: li.quantity,
              price: li.price,
              sku: li.sku,
            }))),
            shippingAddress: o.shipping_address ? JSON.stringify(o.shipping_address) : null,
            shopifyCreatedAt: o.created_at ? new Date(o.created_at) : null,
          }
        });
        total++;
      } catch (err: any) {
        console.error(`❌ Order ${o.id} error:`, err.message);
      }
    }

    // Next page
    const linkHeader = resp.headers['link'] as string | undefined;
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }

    if (nextUrl) {
      console.log(`⏳ Waiting 60s before next orders page...`);
      await sleep(PAGE_DELAY_MS);
      page++;
    }
  }

  console.log(`✅ Orders synced: ${total}`);
  return total;
}

// ── Quick sync — only new data (for manual sync button) ───────────────────────
export const runIncrementalSync = async (merchantId: string) => {
  return runFullShopifySync(merchantId); // uses smart sync logic inside
};
