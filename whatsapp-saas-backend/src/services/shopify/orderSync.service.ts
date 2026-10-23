import prisma from '../../lib/prisma';

export const syncMerchantMissedOrders = async (merchantId: string) => {
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  if (!merchant || !merchant.shopifyToken || !merchant.storeUrl) {
    throw new Error('Merchant or Shopify credentials missing');
  }

  const cleanUrl = merchant.storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const axiosLib = await import('axios');

  // 1. Pata karo aakhiri processed order ID kya tha
  let queryParams = 'status=any&limit=250';
  if (merchant.lastSyncedOrderId) {
    // Shopify API sirf is ID ke BAAD ke naye orders degi (Zero Duplicate Fetching!)
    queryParams += `&since_id=${merchant.lastSyncedOrderId}`;
  } else {
    // Agar pehli baar chal raha hai toh sirf pichle 7 din ke orders lo
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    queryParams += `&created_at_min=${sevenDaysAgo}`;
  }

  console.log(`🔍 [${merchant.brandName}] Fetching new orders with params: ${queryParams}`);

  const response = await axiosLib.default.get(
    `https://${cleanUrl}/admin/api/2024-01/orders.json?${queryParams}`,
    {
      headers: {
        'X-Shopify-Access-Token': merchant.shopifyToken,
        'Content-Type': 'application/json',
      },
    }
  );

  const orders = response.data.orders || [];
  if (orders.length === 0) {
    console.log(`ℹ️ [${merchant.brandName}] No new orders found.`);
    return { newOrdersCount: 0, recoveredCount: 0, addedRevenue: 0 };
  }

  console.log(`📦 [${merchant.brandName}] Found ${orders.length} new orders to process.`);

  let recoveredCount = 0;
  let addedRevenue = 0;
  let latestSeenOrderId = merchant.lastSyncedOrderId;

  for (const o of orders) {
    latestSeenOrderId = String(o.id);
    const orderTotal = parseFloat(o.total_price || '0');
    const orderNumber = o.name || o.order_number || String(o.id);

    // Phone extract karo (kisi bhi field se)
    const rawPhone =
      o.phone ||
      o.customer?.phone ||
      o.customer?.default_address?.phone ||
      o.billing_address?.phone ||
      o.shipping_address?.phone;

    if (!rawPhone) continue;

    const phone10 = rawPhone.replace(/\D/g, '').slice(-10);
    if (phone10.length !== 10) continue;

    // Customer Name & Email
    const custName = o.customer?.first_name || o.billing_address?.first_name || 'Customer';
    const custEmail = o.email || o.customer?.email || null;

    // Products (Line items JSON)
    const lineItemsStr = o.line_items ? JSON.stringify(o.line_items) : null;
    const shippingStr = o.shipping_address ? JSON.stringify(o.shipping_address) : null;

    // 2. Customer Table mein Save / Update karo (Future Retargeting ke liye!)
    const customer = await prisma.customer.upsert({
      where: {
        merchantId_phone: {
          merchantId,
          phone: rawPhone,
        },
      },
      update: {
        name: custName,
        email: custEmail,
        hasPlacedOrder: true,
        lastOrderDate: new Date(o.created_at || Date.now()),
        totalOrders: { increment: 1 },
        totalSpent: { increment: orderTotal },
      },
      create: {
        merchantId,
        phone: rawPhone,
        name: custName,
        email: custEmail,
        hasPlacedOrder: true,
        totalOrders: 1,
        totalSpent: orderTotal,
        firstOrderDate: new Date(o.created_at || Date.now()),
        lastOrderDate: new Date(o.created_at || Date.now()),
      },
    });

    // 3. Order Table mein Save karo (Duplicate protected via unique shopifyOrderId)
    const existingDbOrder = await prisma.order.findUnique({
      where: {
        merchantId_shopifyOrderId: {
          merchantId,
          shopifyOrderId: String(o.id),
        },
      },
    });

    if (!existingDbOrder) {
      await prisma.order.create({
        data: {
          merchantId,
          customerId: customer.id,
          shopifyOrderId: String(o.id),
          orderNumber: String(orderNumber),
          totalPrice: orderTotal,
          currency: o.currency || 'INR',
          status: o.fulfillment_status || 'unfulfilled',
          paymentStatus: o.financial_status || 'paid',
          lineItems: lineItemsStr,
          shippingAddress: shippingStr,
          shopifyCreatedAt: new Date(o.created_at || Date.now()),
        },
      });

      // 4. WhatsApp Attribution Check (Kya pichle 7 din me is number ko message gaya tha?)
      const orderDate = new Date(o.created_at || Date.now());
      const sevenDaysBeforeOrder = new Date(orderDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const matchedMessage = await prisma.message.findFirst({
        where: {
          merchantId,
          customerPhone: { contains: phone10 },
          direction: 'OUTGOING',
          timestamp: {
            gte: sevenDaysBeforeOrder,
            lte: orderDate,
          },
        },
      });

      if (matchedMessage) {
        // Yeh WhatsApp se aaya hua order hai! Revenue add karo!
        await prisma.merchant.update({
          where: { id: merchantId },
          data: {
            totalConverted: { increment: 1 },
            recoveredRevenue: { increment: orderTotal },
          },
        });

        // Cart recover mark karo
        await prisma.abandonedCart.updateMany({
          where: {
            merchantId,
            customerPhone: { contains: phone10 },
            status: 'SENT',
          },
          data: { status: 'RECOVERED' },
        });

        recoveredCount++;
        addedRevenue += orderTotal;
        console.log(`🎉 [ATTRIBUTED] Order #${orderNumber} (₹${orderTotal}) credited to WhatsApp!`);

        // Shopify mein WA-Recovered tag laga do
        try {
          await axiosLib.default.put(
            `https://${cleanUrl}/admin/api/2024-01/orders/${o.id}.json`,
            {
              order: {
                id: o.id,
                tags: `${o.tags ? o.tags + ', ' : ''}WA-Recovered`,
                note_attributes: [
                  ...(o.note_attributes || []),
                  { name: 'Recovered by', value: 'WA-Automations (Reconciled)' },
                ],
              },
            },
            {
              headers: {
                'X-Shopify-Access-Token': merchant.shopifyToken,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (tagErr) {
          // Non-critical error
        }
      }
    }
  }

  // 5. Merchant ka lastSyncedOrderId update kar do (Next time yahan se aage chalega)
  if (latestSeenOrderId) {
    await prisma.merchant.update({
      where: { id: merchantId },
      data: { lastSyncedOrderId: latestSeenOrderId },
    });
  }

  return {
    newOrdersCount: orders.length,
    recoveredCount,
    addedRevenue,
  };
};