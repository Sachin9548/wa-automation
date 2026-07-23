# Client WhatsApp Setup — Step-by-Step Guide (2026)
**Complete flow to get permanent access token for client's Meta Business Account**

---

## 📋 What You (Admin) Will Do For Each Client

| Step | Time | What Happens |
|------|------|--------------|
| 1 | 5 min | Add client's business account to your access |
| 2 | 10 min | Connect client's phone number to WhatsApp API |
| 3 | 5 min | Generate permanent access token |
| 4 | 10 min | Create message templates |
| **TOTAL** | **30 min/client** | Done! |

---

## 🎯 PREREQUISITE — Client Already Has Meta Business Account

**If client already runs Facebook Ads, they have this:**
- ✅ Business Manager account
- ✅ Facebook Page (for their business)
- ✅ Billing payment method added

**If NOT:**
- Go to business.facebook.com → "Create Business"
- Takes 10 minutes → Skip to Step 1

---

## 🔧 PART 1 — YOUR SETUP (Add Client's Business to Your Access)

### Step 1: Add Client's Business Account to Your Access

1. Ask client to go to: **https://business.facebook.com**

2. Left sidebar → Click **"Settings"** (gear icon)

3. Under **"Users"** → Click **"People"**

4. Click **"Add"** button (top right)

5. Enter **your Facebook email** (the one you use for developer account)

6. Set Role: **"Admin"**

7. Under "Access" section, enable:
   - ✅ **"WhatsApp Accounts"**
   - ✅ **"Facebook Pages"** (optional but helpful)

8. Click **"Invite"**

9. **You receive email** → Click **"Accept"**

10. ✅ You now have admin access to client's business

---

## 📱 PART 2 — CONNECT CLIENT'S WHATSAPP NUMBER

### Step 2: Add Phone Number to WhatsApp API

1. In your Meta Developer App (or business.facebook.com) → Go to **WhatsApp** section

2. Under **"Send and receive messages"** → Click **"Add phone number"**

3. Fill in:
   - **Business display name:** Client's shop name (e.g., "Raj Fashion Store")
   - **Business category:** Choose appropriate (Retail, E-commerce, etc.)
   - **Connect to:** Select **client's business account** from dropdown
   - Click **Next**

4. Enter client's phone number: **+91XXXXXXXXXX**

   ⚠️ **CRITICAL:** This number CANNOT be used on WhatsApp app currently!
   
   **If number is on WhatsApp app:**
   - Client must open WhatsApp → Settings → Account → **"Delete my account"**
   - Wait 1 minute → Number is free for Cloud API
   - Number can still receive calls/SMS, just not WhatsApp

5. Choose verification method:
   - **SMS** (recommended) ← Most reliable
   - Voice call (if SMS fails)

6. Client receives **OTP on their phone**

7. Enter OTP → Click **Verify**

8. ✅ Phone number registered! You now see it in the dropdown

---

## 🔑 PART 3 — GENERATE PERMANENT ACCESS TOKEN

### Step 3: Create System User & Generate Token

> **IMPORTANT:** Do this INSIDE CLIENT'S Business Account (not yours)

1. Go to: **https://business.facebook.com**

2. Top left → Click business dropdown → Select **CLIENT'S business**

3. Left sidebar → Click **"Settings"** → **"System users"**

4. Click **"Add"** (plus button, top right)

5. System User Name: `wa-bot`
   - Role: **Admin**
   - Click **Create**

6. Click on the new `wa-bot` user

7. Click **"Assign assets"**

8. Assign these two assets:

   **Asset 1: Your WhatsApp Automation App**
   - Click **"Apps"** tab
   - Find your app (e.g., "WA-Automation")
   - Toggle **"Manage app"** under "Full control"
   - Click **"Assign assets"**

   **Asset 2: Client's WhatsApp Account**
   - Click **"WhatsApp accounts"** tab
   - Find client's WhatsApp Business Account
   - Toggle **"Manage WhatsApp business accounts"** under "Full control"
   - Click **"Assign assets"**

9. Click **"Generate token"** button

10. In the popup, add these 3 permissions:
    - ✅ `business_management`
    - ✅ `whatsapp_business_messaging`
    - ✅ `whatsapp_business_management`

11. Set expiration: **"Never"** (or maximum available)

12. Click **"Generate token"**

13. ⚠️ **COPY TOKEN IMMEDIATELY** — shown only once!

```
Client Permanent Token: EAAxxxxxxxxxxxxxxxxxxxxxxxxxx
```

14. Save this in your admin panel for the merchant

---

## 📝 PART 4 — CREATE MESSAGE TEMPLATES

### Step 4: Create Approved Templates (2-4 hours approval)

1. Go to: **business.facebook.com** → **CLIENT's business account**

2. Left sidebar → **"WhatsApp Manager"**

3. Click **"Account Tools"** → **"Message Templates"**

4. Click **"Create template"**

---

### Template 1: Abandoned Cart Reminder (Marketing)

**Category:** Marketing  
**Name:** `abandoned_cart_reminder`  
**Language:** English  

**Body:**
```
Hi {{1}},

You left something in your cart! 🛒

Don't miss out — complete your order here:
{{2}}

This offer won't last long!
```

**Variables:**
- `{{1}}` = Customer name
- `{{2}}` = Cart URL

**Submit** → Wait for approval (usually 2-4 hours)

---

### Template 2: Abandoned Cart with Discount (Marketing)

**Category:** Marketing  
**Name:** `abandoned_cart_discount`  
**Language:** English  

**Body:**
```
Hi {{1}},

Still thinking about it? Here's a special offer for you! 🎁

Use code *{{2}}* for 10% OFF your cart today only.

Complete your order: {{3}}

Hurry — offer expires in 24 hours! ⏳
```

**Variables:**
- `{{1}}` = Customer name
- `{{2}}` = Discount code
- `{{3}}` = Cart URL

**Submit** → Wait for approval

---

### Template 3: Order Confirmed (Utility - Cheaper!)

**Category:** Utility  
**Name:** `order_confirmed`  
**Language:** English  

**Body:**
```
Hi {{1}},

✅ Your order has been confirmed!

Thank you for shopping with us. We'll notify you once it ships.

Need help? Just reply to this message.
```

**Variables:**
- `{{1}}` = Customer name

**Submit** → Wait for approval

---

### Template 4: Bulk Campaign (Marketing)

**Category:** Marketing  
**Name:** `bulk_campaign`  
**Language:** English  

**Body:**
```
Hi {{1}},

We have something special for you! ✨

{{2}}

Shop now: {{3}}

Reply STOP to unsubscribe.
```

**Variables:**
- `{{1}}` = Customer name
- `{{2}}` = Campaign message
- `{{3}}` = Link

**Submit** → Wait for approval

---

## ✅ PART 5 — SAVE IN YOUR ADMIN PANEL

After completing setup, you have these 4 values:

```
1. Phone Number ID: 120364xxxxxxxxxx
   (Where: WhatsApp → API Setup → Select number → Copy ID)

2. WhatsApp Business Account ID: 9876543210987654
   (Where: WhatsApp Manager → Settings → Show WABA ID)

3. Access Token: EAAxxxxxxxxxxxxxxxxxxxxxxxxxx
   (The permanent token you just generated)

4. Template Names: abandoned_cart_reminder, abandoned_cart_discount, order_confirmed, bulk_campaign
```

Enter these in your admin panel when activating the merchant.

---

## 💰 HOW CLIENT PAYS FOR MESSAGES (July 2026)

### Client Adds Payment Method to THEIR Meta Account

1. Client goes to: **business.facebook.com**

2. Left sidebar → **"Billing"**

3. Click **"Add payment method"**

4. Add credit/debit card

5. ✅ Meta will now charge their card directly for messages

### You (Developer) Never Handle Per-Message Billing

| What You Do | What Client Does |
|-------------|------------------|
| Collect monthly subscription (₹999, ₹1999, etc.) | Add card to Meta Business Account |
| Provide WhatsApp marketing service | Pay Meta directly for messages sent |
| Manage the platform | Use your WhatsApp marketing |

**Meta's charges go directly to client's card — you don't see this money!**

---

## 📊 PRICING FOR CLIENT (July 2026, India)

| Message Type | Meta Charges Client |
|--------------|---------------------|
| Marketing (abandoned cart, campaigns) | ₹1.09 per message |
| Utility (order confirmation outside CSW) | ₹0.145 per message |
| Utility inside CSW (when customer messaged first) | FREE |
| Replies within 24hr window | FREE |

**Example:** If client sends 100 abandoned cart messages/day:
- 100 × ₹1.09 = ₹109/day
- ₹109 × 30 = ₹3,270/month to their card

**Your income:** Still ₹999/month subscription fee

---

## ⚠️ IMPORTANT WARNINGS

### Don't Break These Rules:

1. **Don't spam** — Meta monitors block rates
2. **Don't send marketing outside CSW without template** — Instant ban risk
3. **Always honor "STOP" replies** — Required by Meta
4. **Don't use number on WhatsApp app AND Cloud API** — Will get blocked

### Tier Limits (No Business Verification Needed):

| Tier | Messages/Day | How to Get |
|------|--------------|------------|
| Tier 1 | 1,000 | Default — no documents needed |
| Tier 2 | 10,000 | Business verified |
| Tier 3 | 100,000 | High volume + verified |

**For small businesses:** Tier 1 (1,000/day) is plenty!

---

## 🆘 TROUBLESHOOTING

### Problem: Phone number still shows as "Not registered"

**Solution:**
- Verify number is NOT on WhatsApp app currently
- Wait 5 minutes after deleting from WhatsApp app
- Try SMS verification again

### Problem: Token not showing in dropdown

**Solution:**
- Make sure you're in CLIENT's business account (top left dropdown)
- Check that system user has "Admin" role
- Ensure WhatsApp Account is assigned to system user

### Problem: Templates stuck in "Reviewing" for >24 hours

**Solution:**
- Check template follows Meta guidelines:
  - No external links in first 3 words
  - No ALL CAPS except acronyms
  - No excessive emojis
- Try simpler template text

---

## 📞 SUMMARY — What You Need From Client

| Item | Time | Notes |
|------|------|-------|
| Client email for business access | 5 min | Client invites you as admin |
| OTP on client's phone | 5 min | For phone verification |
| 10 minutes | 10 min | Template creation |
| Client adds payment method | 5 min | To Meta Business Account |

**Total:** 30 minutes per client, no documents required!

---

## 🎓 YOUR BUSINESS MODEL — Explained to Client

**You (Developer):**
- Monthly subscription: ₹999/month
- You manage the platform
- You set up and maintain WhatsApp
- You handle automation and AI

**Client (Business Owner):**
- Adds their own card to Meta
- Meta charges their card directly per message
- Gets WhatsApp marketing service
- Receives customer queries via AI bot

**No confusion:** Client understands they pay Meta for messages, you for the service.

---

## 🚀 NEXT STEPS

After you complete client setup:

1. ✅ Store their Meta credentials in database
2. ✅ Configure automation flows in your admin panel
3. ✅ Test sending a message via Postman or your API
4. ✅ Show client the dashboard
5. ✅ Train client on how to manage templates

---

**Source:** Meta Developer Documentation (Updated July 2026)  
**Verified:** July 15, 2026  
**API Version:** v23.0 (Cloud API)