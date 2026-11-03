# WA-Automations — Complete System Architecture

> **WhatsApp Marketing SaaS** — Shopify stores ke liye automated WhatsApp messaging platform

---

## 1. 🎯 PROJECT OVERVIEW

**Kya hai yeh?**
Ek SaaS platform jo Shopify merchants ko allow karta hai ki unke customers ko automatically WhatsApp messages jaayein — abandoned cart recovery, order confirmation, COD to prepaid conversion, bulk campaigns, aur bahut kuch.

**Business Model:**
- Admin (you) → Merchants onboard karta hai
- Merchants → Monthly subscription dete hain
- Revenue → Recovered revenue track hoti hai per merchant

**Stakeholders:**
- **Admin** → Platform manage karta hai, merchants activate karta hai
- **Merchants** → Shopify store owners jo service use karte hain
- **Customers** → Merchants ke end customers jo WhatsApp messages receive karte hain

---

## 2. 🛠️ TECH STACK

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router) | React-based, fast, Vercel-ready |
| Backend | Node.js + Express + TypeScript | Type-safe, scalable API |
| Database | PostgreSQL (Supabase) | Relational, reliable |
| ORM | Prisma | Type-safe DB queries |
| Message Queue | BullMQ + Redis (Upstash) | Async job processing |
| WhatsApp API | Meta Cloud API | Official, permanent tokens |
| Shopify API | REST Admin API 2024-01 | Webhooks + Order management |
| AI | Groq API (LLaMA 3.1) | Free tier, fast inference |
| Deployment | Render (backend), Vercel (frontend) | Easy CI/CD |
| Auth | JWT (merchants) + API Key (admin) | Simple, secure |

---

## 3. 🏗️ SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│  ┌──────────────┐    ┌─────────────────────────────────┐    │
│  │ Admin Panel  │    │    Merchant Dashboard           │    │
│  │ /admin       │    │    /dashboard                   │    │
│  └──────┬───────┘    └──────────────┬──────────────────┘    │
└─────────┼────────────────────────────┼─────────────────────┘
          │ REST API calls              │ REST API calls
          ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express + TypeScript)              │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Admin   │  │ Merchant │  │ Webhook  │  │  Inbox   │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │          │
│       └──────────────┴──────────────┴──────────────┘         │
│                              │                               │
│                    ┌─────────▼──────────┐                   │
│                    │   Prisma ORM       │                   │
│                    └─────────┬──────────┘                   │
│                              │                               │
│  ┌───────────────────────────▼──────────────────────────┐   │
│  │              Message Worker (BullMQ)                  │   │
│  │  - Rate limiting (1 msg/15-30s random)               │   │
│  │  - Sending window (7am-12am IST)                     │   │
│  │  - 24h reschedule on rate limit                      │   │
│  │  - Per-merchant rate limit Map (Redis)               │   │
│  └───────────────────────────┬───────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────────┐    ┌──────────────┐
│  PostgreSQL  │    │  Redis (Upstash) │    │  Meta Cloud  │
│  (Supabase)  │    │  BullMQ Queue    │    │  WhatsApp API│
└──────────────┘    └──────────────────┘    └──────────────┘
          ▲                                         ▲
          │                                         │
┌──────────────────┐                    ┌──────────────────┐
│  Shopify Stores  │                    │ Instagram Graph  │
│  (Webhooks)      │                    │     API          │
└──────────────────┘                    └──────────────────┘
```

---

## 4. ✨ COMPLETE FEATURES

### 4.1 🛒 Abandoned Cart Recovery

**Flow:**
```
Customer → Shopify checkout → Abandons cart
    ↓
Shopify fires checkouts/create + checkouts/update webhooks
    ↓
Backend receives → HMAC verify karo → Cart save karo DB mein
    ↓
Phone number milne pe → Flow check karo (ABANDONED_CART_1, ABANDONED_CART_2)
    ↓
TrackingLink create karo (cart URL se)
    ↓
BullMQ job add karo with delay (30 min / 24 hours)
    ↓
Worker job process kare → Meta API → WhatsApp message send
    ↓
Customer link click kare → /api/tracking/click/:id → Record click → Redirect
    ↓
Customer order kare → orders/create webhook → 7-day phone match → Revenue add
```

**Template Variables:**
- `{{1}}` = Customer Name (body)
- `{{2}}` = Products List (body)
- BTN COUPON = Discount Code
- BTN URL = Tracking Link (UUID suffix only)

**Error Handling:**
- HMAC verification fail → 401 reject
- Invalid phone → mark as `wa_invalid`, never retry
- Rate limit → 24h reschedule, per-merchant Map in Redis
- Duplicate cart → race condition handled with `P2002` catch

---

### 4.2 📦 Order Confirmation

**Flow:**
```
Customer places order → orders/create webhook
    ↓
ORDER_CONFIRM flow active check
    ↓
Template bhejo with order details
```

**Template Variables:** Customer Name, Products List

---

### 4.3 🎁 Post-Purchase Upsell

**Flow:**
```
Order created webhook
    ↓
POST_PURCHASE_UPSELL flow check (isActive)
    ↓
7-day dedup check (same customer ko 7 din mein dobara nahi)
    ↓
Delay ke baad (2 hrs recommended) → Template bhejo
    ↓
Customer store link click kare → Tracking record
```

**Template Variables:** Customer Name, Purchased Product, Discount Code

---

### 4.4 💳 COD → Prepaid Converter (RTO Killer)

**Flow:**
```
orders/create webhook
    ↓
COD detect: financial_status === 'pending' OR gateway contains 'cod/cash'
    ↓
COD_CONVERT flow active check
    ↓
checkout_token se Shopify payment URL banao:
  https://store.myshopify.com/checkouts/{token}/pay
    ↓
TrackingLink create karo (payment URL se)
    ↓
2 min delay ke baad → Template bhejo
    ↓
Customer "Pay Now" click → payment page → Online pay
```

**Business Value:** COD orders ka ~30% RTO hota hai. 10% bhi prepaid convert ho gaye toh merchant ka shipping cost bachta hai.

---

### 4.5 🎂 Store Anniversary

**Flow:**
```
Daily cron (server.ts mein setInterval 24h)
    ↓
Sabhi active merchants check karo
    ↓
STORE_ANNIVERSARY flow active hai toh...
    ↓
Customers jinका firstOrderDate = aaj ka month+day
    ↓
yearsCompleted >= 1 check
    ↓
Template bhejo with years completed
```

**Template Variables:** Customer Name, Years Completed, Store URL, Discount Code

---

### 4.6 📢 Bulk Campaign

**Flow:**
```
Admin → Campaign Tab → Template select + Variable mapping → Launch
    ↓
Customer filter: all / abandoned / ordered
    ↓
BullMQ mein 15s stagger ke saath jobs add
    ↓
variableMapping + variableSources DB se read → correct variables build
    ↓
Scheduled campaigns: delay calculate karke queue mein add
```

**Variable Mapping System:**
- Template select hone pe auto-detect: header + body + button variables
- Admin har slot pe value map karta hai
- Backend valueMap se actual values inject karta hai

---

### 4.7 💣 COD Blast (Direct Order)

**Flow:**
```
Admin → COD Blast Tab → Abandoned/Ordered customers list
    ↓
Customer select karo → Template bhejo (Quick Reply buttons)
    ↓
Customer "Place My Order" dabaye → interactive webhook
    ↓
Backend automatically Shopify COD order create kare:
  - Placeholder address: "Address to be confirmed via WhatsApp call"
  - Tags: WA-Automations, WhatsApp-COD
    ↓
Confirmation message customer ko
```

---

### 4.8 🤖 AI Auto-Reply (Copilot)

**Flow:**
```
Customer WhatsApp message bheje
    ↓
Webhook receive → merchant dhundho by metaPhoneNumberId
    ↓
aiAutoReply === true check
    ↓
Last 5 messages fetch (conversation history)
    ↓
Groq API → LLaMA 3.1 → aiKnowledgeBase se context
    ↓
AI reply generate → sendMetaTextMessage
    ↓
[FALLBACK] token se detect: aiFallbackMessage bhejo
```

---

### 4.9 📸 Instagram Integration

**Flow:**
```
Instagram webhook → object: 'instagram'
    ↓
igAccountId se merchant dhundho
    ↓
field: 'messaging' → Instagram DM
field: 'comments' → Comment
    ↓
AI auto-reply → graph.instagram.com/{accountId}/messages
Comment reply → /{commentId}/replies
```

---

### 4.10 📊 Revenue Tracking (Triple Attribution)

**Layer 1 — Magic Link:**
```
WhatsApp message mein → /api/tracking/click/{UUID}
    ↓
Click record → redirect to cart URL with UTM params
utm_source=whatsapp&utm_medium=wa_automations&utm_campaign=cart_recovery
```

**Layer 2 — 7-Day Phone Match:**
```
orders/create webhook → phone extract
    ↓
Last 7 days mein iss phone ko koi message gaya?
    ↓
YES → recoveredRevenue + increment, cart status = RECOVERED
```

**Layer 3 — Shopify Order Tagging:**
```
Match mila → Shopify order pe tag lagao: WA-Recovered
note_attributes: Recovered by WA-Automations
```

---

### 4.11 💬 Inbox (2-Way Chat)

**Features:**
- Conversations list by merchant
- 24hr window enforcement (Meta rule)
- Free-text within window, template outside
- Media support (image, video, audio, document, location)
- Customer opt-out (STOP keyword)
- Service conversation counter (1000 free/month — Meta new pricing)
- Merchant inbox (admin-controlled toggle)
- Instagram DMs + Comments inbox

---

## 5. 🛍️ SHOPIFY INTEGRATION

**Custom App Flow (Permanent Token):**
```
1. Admin → Shopify Partner → App banao (Custom distribution)
2. Scopes: read_customers, read_orders, read_products, read_all_orders, write_orders
3. Legacy install flow ON (permanent token ke liye)
4. Redirect URL: https://api.wautomation.shop/shopify/callback/tokengenerate
5. Admin Panel → Generate Install Link → Client ko share karo
6. Client install kare → callback → code exchange → permanent token save
```

**Webhooks (Programmatic):**
- `checkouts/create` → Abandoned cart
- `checkouts/update` → Cart update
- `orders/create` → Revenue tracking + upsell + COD convert

**HMAC Verification:**
- App Client Secret se `HMAC-SHA256` verify
- `rawBody` capture before JSON parse
- Old secret support (rotation ke baad 1 hour grace period)

---

## 6. 📱 META WHATSAPP INTEGRATION

**Per-Client Setup (Option B — No App Review):**
```
1. Client ke Facebook account mein app banao
2. Phone number add + OTP verify
3. System User banao (Admin role)
4. App + WABA dono assign karo System User ko
5. Permanent token generate (EAA... — never expires)
6. Webhook subscribe: POST /{WABA_ID}/subscribed_apps
7. Callback URL: https://api.wautomation.shop/api/webhooks/meta
8. Verify Token: wa_auto_verify_2026
```

**Stored Per Merchant:**
- `metaPhoneNumberId` — API calls ke liye
- `metaAccessToken` — Authorization
- `metaWabaId` — Templates + WABA info
- `metaAppId` — Reference
- `metaAppSecret` — Webhook HMAC (future)

**Template Components API:**
```json
{
  "components": [
    { "type": "header", "parameters": [{"type":"text","text":"..."}] },
    { "type": "body", "parameters": [{"type":"text","text":"..."}] },
    { "type": "button", "sub_type": "copy_code", "index": "0", 
      "parameters": [{"type":"coupon_code","coupon_code":"VIP10"}] },
    { "type": "button", "sub_type": "url", "index": "1",
      "parameters": [{"type":"text","text":"UUID-only-suffix"}] }
  ]
}
```

---

## 7. ⚙️ MESSAGE QUEUE SYSTEM

**Architecture:**
```
messageQueue.add() → Redis → BullMQ Worker → sendMetaTemplateMessage()
```

**Smart Features:**
- **Random delay:** 15-30 seconds between messages (human-like, avoids spam detection)
- **Sending window:** 7am-12am IST only (outside window → reschedule to next 7am)
- **Rate limit handling:** 131042/131048/131056 codes → 24h reschedule
- **Per-merchant Map:** Redis mein `ratelimit:{merchantId}` key → wasteful API calls avoid
- **removeOnComplete: 100** — Redis mein sirf last 100 completed jobs
- **removeOnFail: 500** — Last 500 failed jobs

**Job Types:**
- `send-automated-msg` — Abandoned cart, upsell, COD convert, anniversary, COD blast
- `send-campaign-msg` — Bulk campaigns
- `send-mpm-msg` — Multi-product catalog messages

**Worker Idle Optimization:**
```
5 min koi job nahi → worker.pause()
New job add hote hi → resumeWorkerIfPaused() → worker.resume()
(QueueEvents removed — was using 500k Redis requests/month alone)
```

---

## 8. 🔒 SECURITY

| Feature | Implementation |
|---------|---------------|
| CORS | Origin restricted to wautomation.shop domains |
| Security Headers | Helmet middleware |
| JWT Auth | HS256 algorithm, no fallback secret |
| Admin Auth | x-admin-api-key header |
| Shopify HMAC | Client Secret se SHA256 verify |
| Rate Limiting | express-rate-limit on auth routes |
| Body Size | 10MB limit |
| SQL Injection | Prisma parameterized queries |
| Secrets | .env only, never in code |

---

## 9. 🖥️ ADMIN PANEL TABS

| Tab | Features |
|-----|---------|
| Overview | Activate merchant, service toggle, AI settings, payments |
| Inbox | 2-way WhatsApp chat, media support |
| Flows | 6 automation flows with variable mapping |
| Campaign | Bulk campaigns with scheduling |
| Products (MPM) | Multi-product catalog messages |
| Customers | List, filter, sync, export CSV |
| Analytics | Messages, clicks, revenue, funnel |
| Activity Log | All admin actions |
| Credentials | Shopify + Meta + Instagram credentials |
| Templates | Create/delete Meta templates |
| COD Blast | Select customers → send blast → place orders |
| Instagram | DMs + Comments inbox |

---

## 10. 📊 DATABASE SCHEMA (Key Models)

```
Merchant
├── Shopify: storeUrl, shopifyToken, shopifyClientId, shopifyClientSecret
├── Meta: metaPhoneNumberId, metaAccessToken, metaWabaId, metaAppId
├── Instagram: igAccountId, igAccessToken, igTokenExpiresAt
├── Controls: serviceActive, isFree, inboxEnabled
├── AI: aiAutoReply, aiKnowledgeBase, aiFallbackMessage
├── Stats: totalSent, totalRead, totalClicked, totalConverted, recoveredRevenue
└── Pricing: serviceConvCount, serviceConvMonth (1000 free/month)

AutomationFlow
├── type: ABANDONED_CART_1/2, ORDER_CONFIRM, POST_PURCHASE_UPSELL
│        COD_CONVERT, STORE_ANNIVERSARY
├── metaTemplateName, metaTemplateLang
├── variableMapping: JSON array ["customer_name", "products_list", ...]
├── variableSources: JSON array ["body", "body", "button_coupon_0", "button_url_1"]
└── customMessage: custom broadcast text

TrackingLink
├── merchantId, customerPhone, originalUrl
├── discountCode
├── clicked, clickedAt
└── converted, convertedAt, convertedRevenue

Message
├── merchantId, customerPhone
├── direction: INCOMING/OUTGOING
├── channel: WHATSAPP/INSTAGRAM_DM/INSTAGRAM_COMMENT
├── mediaType, mediaId (for media messages)
└── templateName

Campaign / WhatsAppBlast / ShopifyInstallLog / Order / Customer / Payment
```

---

## 11. 🚀 DEPLOYMENT

```
Frontend (Next.js)
└── Vercel / any static host
    └── NEXT_PUBLIC_API_URL=https://api.wautomation.shop/api

Backend (Express)
└── Render.com (Web Service)
    ├── Build: npm run build
    ├── Start: node dist/server.js
    ├── Keep-alive ping: every 14 min (free tier)
    └── Environment vars: DATABASE_URL, JWT_SECRET, ADMIN_API_KEY,
                          REDIS_URL, GROQ_API_KEY, META_WEBHOOK_VERIFY_TOKEN

Database
└── Supabase (PostgreSQL)
    ├── DATABASE_URL (pooled — port 6543)
    └── DIRECT_URL (direct — port 5432, for migrations)

Redis
└── Upstash (serverless Redis)
    └── rediss:// URL (TLS required)
    └── Plan: Pay-as-you-go (500k free → then $0.2/100k)
```

---

## 12. 🎤 INTERVIEW TALKING POINTS

### "Tell me about this project"
> "Maine ek WhatsApp Marketing SaaS banaya hai jo Shopify merchants ko help karta hai abandoned carts recover karne ke liye. System automatically WhatsApp messages bhejta hai customers ko — abandoned cart reminders, order confirmations, COD to prepaid conversion. Backend Node.js + Express hai, queue BullMQ + Redis se handle hoti hai, aur Meta Cloud API se messages jaate hain."

### "Biggest Technical Challenge?"
> "Sabse bada challenge tha Meta ka daily rate limit handle karna. Agar 250 messages/day limit hit ho toh baaki 4750 messages waste nahi ho sakti. Maine in-memory Map + Redis persistence use kiya — jab rate limit hit ho, remaining jobs automatically 24 hours baad reschedule ho jaati hain bina Meta API waste kiye."

### "How does the queue work?"
> "BullMQ use kiya hai Redis ke saath. Har message ek job hai. Worker ek time pe ek job process karta hai (concurrency: 1). Messages ke beech 15-30 second ka random delay hai — yeh human-like sending pattern Meta ke spam detection se bachata hai. Rate limit hit hone pe job 24h delay se re-queue hoti hai."

### "How do you track revenue?"
> "Triple attribution system hai. Pehla — magic tracking link: WhatsApp mein tracking URL jaata hai, customer click kare toh record hota hai. Doosra — 7-day phone match: jab order aata hai, check karo ki 7 din mein iss customer ko koi message gaya tha. Teesra — Shopify order tagging: matched order pe 'WA-Recovered' tag lagta hai."

### "Security measures?"
> "CORS restricted hai specific domains pe, Helmet security headers hain, JWT HS256 algorithm enforce karta hai, Shopify webhooks HMAC-SHA256 se verify hoti hain App Client Secret se, aur admin routes ek alag API key se protect hain."

### "Why Meta Cloud API instead of WhatsApp Business App?"
> "Meta Cloud API se per-client permanent tokens milte hain via System User setup. Yeh kabhi expire nahi hote. WhatsApp Business App mein session tokens hote hain jo expire ho jaate hain — our old system mein yahi problem thi. Custom App + OAuth flow se permanent `shpat_` token milta hai."

### "How do you handle multiple merchants?"
> "Sab messages ek hi queue mein hain lekin merchant isolation properly handle hoti hai. Per-merchant rate limit tracking, per-merchant webhook URLs (Shopify ke liye), aur Meta mein `metaPhoneNumberId` se incoming messages route hote hain sahi merchant ke paas."

---

## 13. 📋 VARIABLE MAPPING SYSTEM

**Problem:** Har template alag hota hai — kisi mein 2 variables, kisi mein 6. Hardcode nahi kar sakte.

**Solution:**
```
Admin template select kare
    ↓
Auto-detect: Meta template ke components scan karo
  - Header text → source: "header"
  - Body {{1}}, {{2}}... → source: "body"
  - COPY_CODE button → source: "button_coupon_N"
  - URL button with {{1}} → source: "button_url_N"
    ↓
Admin har slot pe value map kare:
  customer_name / products_list / discount_code / order_number / cart_url / etc.
    ↓
Save to DB: variableMapping + variableSources JSON arrays
    ↓
Backend at send time:
  valueMap = { customer_name: "Rahul", products_list: "Nike Air", ... }
  variables = mapping.map(key => valueMap[key])
  sources = [...] → body/header/button components correctly split
```

---

*Document generated: November 2026*
*Project: WA-Automations — WhatsApp Marketing SaaS*

---

## 14. 🔄 HOW TO ADD A NEW FEATURE (Step-by-Step)

Jab bhi naya feature add karna ho, yeh order follow karo:

```
Step 1: Schema change karo (schema.prisma) → npx prisma db push
Step 2: Backend route/controller banao (admin.routes.ts ya naya file)
Step 3: Webhook handler update karo (agar Shopify/Meta event se trigger ho)
Step 4: Worker mein naya job type add karo (agar message bhejni ho)
Step 5: valueMap mein naya variable add karo (shopify.webhook.ts)
Step 6: Frontend tab/component banao
Step 7: TypeScript check → npx tsc --noEmit
Step 8: Git commit + push
```

---

## 15. 📁 PROJECT FILE STRUCTURE

```
whatsapp-saas-backend/
├── src/
│   ├── server.ts              ← Express app + routes mount + anniversary cron
│   ├── controllers/
│   │   ├── admin.controller.ts    ← Merchant activate, launch campaign, flows save
│   │   └── merchant.controller.ts ← Merchant stats, analytics
│   ├── routes/
│   │   ├── admin.routes.ts        ← All admin endpoints (2500+ lines)
│   │   ├── merchant.routes.ts     ← Merchant-facing endpoints
│   │   ├── webhook.routes.ts      ← Meta + Shopify webhook handlers
│   │   ├── inbox.routes.ts        ← 2-way chat endpoints
│   │   ├── tracking.routes.ts     ← Click tracking redirect
│   │   └── shopify.oauth.routes.ts← Shopify permanent token callback
│   ├── services/
│   │   ├── whatsapp.service.ts    ← sendMetaTemplateMessage (body/header/button split)
│   │   ├── ai.service.ts          ← Groq API, conversation history
│   │   └── shopify/
│   │       ├── customer.service.ts← Customer sync
│   │       ├── full-sync.service.ts← Full Shopify sync
│   │       └── polling.service.ts ← Abandoned cart polling
│   ├── webhooks/
│   │   └── shopify.webhook.ts     ← Cart + Order webhook handlers
│   ├── workers/
│   │   └── message.worker.ts      ← BullMQ worker (3 job types)
│   ├── lib/
│   │   ├── queue.ts               ← BullMQ queue setup
│   │   ├── redis.ts               ← Redis client
│   │   ├── prisma.ts              ← Prisma client
│   │   └── shopify.security.ts    ← HMAC verification
│   └── middleware/
│       ├── auth.middleware.ts     ← JWT protect
│       └── admin.middleware.ts    ← Admin API key check
└── prisma/
    └── schema.prisma              ← All DB models

whatsappsaas/ (Frontend)
├── src/app/
│   ├── admin/
│   │   ├── page.tsx               ← Admin dashboard (merchants list, guides)
│   │   └── merchants/[id]/
│   │       ├── page.tsx           ← Merchant control hub (all tabs)
│   │       └── components/
│   │           ├── OverviewTab.tsx
│   │           ├── FlowsTab.tsx   ← Variable mapping UI
│   │           ├── CampaignTab.tsx← Campaign + variable mapping
│   │           ├── CODBlastTab.tsx← COD blast + variable mapping
│   │           ├── InboxTab.tsx   ← 2-way chat
│   │           ├── CredentialsTab.tsx
│   │           ├── InstagramTab.tsx
│   │           └── ...
│   └── dashboard/
│       ├── page.tsx               ← Merchant dashboard
│       └── inbox/page.tsx         ← Merchant inbox
```

---

## 16. 🌊 COMPLETE DATA FLOW EXAMPLE (Abandoned Cart)

```
[Time 0] Customer adds product → Shopify checkout page kholti hai

[Time 0:01] Customer checkout chhod deta hai
    → Shopify fires POST /api/webhooks/shopify/abandoned-cart/{merchantId}
    → HMAC verify (App Client Secret se)
    → Cart save in DB (status: PENDING)
    → Phone nahi hai → wait

[Time 0:05] Customer phone number dalta hai
    → Shopify fires checkouts/update webhook
    → DB mein phone update
    → Active flows check (ABANDONED_CART_1 isActive: true)
    → TrackingLink create (cart URL → /api/tracking/click/UUID)
    → BullMQ job add: delay = 30 min

[Time 0:30] Worker job process kare
    → Sending window check (7am-12am IST)
    → Rate limit check (Redis: ratelimit:{merchantId})
    → valueMap build: { customer_name: "Rahul", products_list: "Nike Air", ... }
    → variableMapping se variables array build
    → whatsapp.service.ts → components split (body/coupon/url)
    → Meta API POST /{phoneNumberId}/messages
    → Message status: SENT

[Later] Customer message READ kare → webhook → status: READ

[Customer clicks button]
    → GET /api/tracking/click/{UUID}
    → clicked: true, clickedAt saved
    → merchant.totalClicked++
    → Redirect to cart URL with UTM params

[Customer places order]
    → orders/create webhook
    → 7-day phone match: message found ✅
    → merchant.recoveredRevenue += ₹2499
    → merchant.totalConverted++
    → cart.status = RECOVERED
    → trackingLink.converted = true, convertedRevenue = 2499
    → Shopify order tagged: WA-Recovered
```

---

## 17. 💡 KEY DESIGN DECISIONS & WHY

| Decision | Reason |
|----------|--------|
| BullMQ instead of setTimeout | Server restart pe jobs survive karte hain (Redis-backed) |
| Per-merchant rate limit in Redis | In-memory Map restart pe reset hoti — Redis persist karta hai |
| Random delay 15-30s | Fixed delay = bot-like → Meta spam detection. Random = human-like |
| QueueEvents removed | Ek dedicated Redis connection 24/7 chalta tha = 500k+ requests/month waste |
| Custom App (not Partner App) | Per-client permanent tokens, no App Review needed, instant setup |
| /api/tracking/click/ for URL buttons | Meta URL button mein template URL base hoti hai, {{1}} = UUID suffix only |
| variableMapping + variableSources JSON | Har template alag hota hai — dynamic mapping DB mein store karo |
| `(prisma as any)` for new fields | Prisma client auto-generate lag jaata hai — type safety ke liye |
| lazyConnect: true for Redis | Startup pe connection nahi khulta — sirf use hone pe |
| Fallback in valueMap | Agar key na mile toh empty string — no crash |
