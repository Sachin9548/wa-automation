# Meta WhatsApp Cloud API — Complete Setup Guide
**Source: Meta Official Docs (Updated July 2, 2026 + June 16, 2026)**
**API Version: v23.0**

> This guide is verified directly from:
> - https://developers.facebook.com/docs/whatsapp/cloud-api/get-started (Updated Jun 16, 2026)
> - https://developers.facebook.com/docs/whatsapp/pricing (Updated Jul 2, 2026)

---

## 💰 PRICING — July 2026 (Confirmed from Meta Official Docs)

**Meta switched from per-conversation to per-message pricing on July 1, 2025.**

### India Rates (INR billing launched January 1, 2026)

| Message Type | When | Cost (India) |
|---|---|---|
| **Marketing** | Abandoned cart, campaigns (outside CSW) | ₹1.09 (~$0.0118) per message |
| **Utility** | Order confirmations OUTSIDE customer service window | ₹0.145 per message |
| **Utility inside CSW** | Order confirmations when customer messaged you first | **FREE** |
| **Authentication** | OTP messages | ₹0.145 per message |
| **Service** | Any message within 24hr customer service window | **FREE** |
| **Non-template (text/image)** | Within open customer service window | **FREE** |

### What is a Customer Service Window (CSW)?
When a customer messages YOU first, a 24-hour window opens. During this window:
- All text/image/non-template messages = FREE
- Utility templates = FREE
- Marketing templates = still charged

### Free Entry Point Window (72 hours FREE)
If customer clicks your **Click-to-WhatsApp Ad** or Facebook Page button:
- 72-hour window opens
- ALL messages including templates = FREE during this window
- Great for retargeting campaigns

### Your Business Model — Subscription Only ✅

**You collect:** Monthly subscription fee from client (e.g. ₹999/month or ₹1999/month)

**Meta collects:** Per-message charges directly from client's payment method

**You never handle per-message billing.** This is the same model used by AiSensy, Interakt, and WATI.

### How Meta bills the client
- Client adds their own credit/debit card to **their** Meta Business Account
- Go to: business.facebook.com → Billing → Payment Methods → Add Card
- All message charges are auto-debited from their card by Meta
- You have zero involvement in per-message payments

### Your Pricing (Subscription only)
| Plan | Monthly Fee | What client gets |
|---|---|---|
| Starter | ₹999/month | Abandoned cart automation, up to 1000 msg/day |
| Pro | ₹1999/month | + Bulk campaigns, order confirmations |

### Meta's charges go directly to client
| Message Type | Meta charges client directly |
|---|---|
| Marketing (abandoned cart, campaigns) | ₹1.09 per message |
| Utility (order confirmation outside CSW) | ₹0.145 per message |
| Utility inside CSW | FREE |
| Service replies | FREE |

> Meta pricing may change on Jan 1, Apr 1, Jul 1, or Oct 1 each year.
> Since client pays Meta directly, price changes don't affect your subscription revenue.

---

## 📌 Requirements — No Documents Needed

### You (Developer) need:
- ✅ Personal Facebook account
- ✅ Meta Developer account (free, 5 minutes to create)
- ✅ WhatsApp-enabled phone to receive test messages

### Client needs:
- ✅ Existing Facebook/Meta Business account (they already have — running ads)
- ✅ Phone number for WhatsApp marketing
- ✅ Ability to receive OTP on that number

### NOT required:
- ❌ GST
- ❌ Company registration
- ❌ Aadhaar Udyam
- ❌ Business verification (Tier 1 works without it)

### Messaging Limits by Tier
| Tier | Messages/day | Requirement |
|---|---|---|
| Tier 1 | 1,000 | Default — no documents |
| Tier 2 | 10,000 | Business verified |
| Tier 3 | 100,000 | High volume + verified |
| Unlimited | Unlimited | Enterprise |

---

## 🔧 PART 1 — YOUR ONE-TIME SETUP (Developer)

### Step 1: Create Meta Developer Account

1. Go to **https://developers.facebook.com**
2. Login with your personal Facebook account
3. Click **Get Started** (top right)
4. Follow prompts — verify phone if asked
5. Accept developer terms
6. ✅ Developer account ready

---

### Step 2: Create Your App (Updated flow — June 2026)

> Meta updated the app creation flow. Follow these exact steps.

1. Click **My Apps** → **Create App**
2. Add your **app name** (e.g. `WA-Automation`) and your **email**
3. Select use case: **"Connect with customers through WhatsApp"** → click **Next**
4. Select an existing business portfolio OR click **"Create a new one"**
   - If creating new: name it `WA-Automation Business` → submit
5. A list of publishing requirements appears — click **Next** (you may have none)
6. Confirm details → click **Create App**
7. You are redirected to the **Quickstart / API Setup page** automatically
8. ✅ App created with WhatsApp product already added

---

### Step 3: Send Your First Test Message

1. On the API Setup page, click **"Start using the API"**
2. Connect to a WhatsApp Business Account (create new or use existing)
3. Note down your **WhatsApp Business Account ID (WABA ID)** shown on screen
4. Click **Generate access token** — this is a temporary token (expires quickly)
5. Select a **From** phone number (Meta gives you a free test number)
6. Enter YOUR personal WhatsApp number in **To** field
7. Click **Send message**
8. Check your WhatsApp — you should receive "Hello World" message
9. **Reply to it** — this opens a customer service window for testing
10. ✅ API is working

---

### Step 4: Save Important IDs

From the API Setup page, note down:

```
Test Phone Number ID      : [shown on API Setup page]
WhatsApp Business Acct ID : [shown on API Setup page, ~15 digits]
App ID                    : [from Settings → Basic]
App Secret                : [from Settings → Basic]
```

---

### Step 5: Create System User & Generate PERMANENT Token

> Official Meta docs (June 2026): Temporary tokens expire quickly — always use system user token in production.

1. Go to **https://business.facebook.com/latest/settings**
2. Left sidebar → click **System Users**
3. Click **Add+** button (top right)
4. Follow prompts:
   - System User Name: `wa-automation-bot`
   - Role: **Admin**
5. Click **Create System User** ✅

**Assign Assets to the System User:**

6. Click on `wa-automation-bot` → click **Assign Assets**
7. Select **Apps** → find your `WA-Automation` app → toggle **"Manage app"** under Full control ✅
8. Select **WhatsApp Accounts** → select your WABA → toggle **"Manage WhatsApp Business accounts"** under Full control ✅
9. Click **Assign assets** button

**Generate the Token:**

10. Click **Generate Token** button
11. In the popup, add these **3 permissions** (all 3 required as of 2026):
    - ✅ `business_management`
    - ✅ `whatsapp_business_messaging`
    - ✅ `whatsapp_business_management`
12. Set expiration: **Never** (or maximum available)
13. Click **Generate Token**
14. **⚠️ COPY IMMEDIATELY — shown only once**

```
Permanent System User Token : EAAxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 👤 PART 2 — PER CLIENT SETUP (30 minutes per client)

### Step 1: Client gives you access

**Tell your client (5 minutes for them):**

Since they already run Facebook Ads, they already have a Meta Business Account.

1. Client goes to **https://business.facebook.com**
2. Left sidebar → **Settings** (gear icon)
3. Under **Users** → **People**
4. Click **Add People** → enter **your email address**
5. Role: **Admin**
6. Under access: enable **WhatsApp Accounts**
7. Click **Invite**

You receive email → click **Accept** → ✅ You have access.

---

### Step 2: Add client's WhatsApp number

> **⚠️ CRITICAL:** The phone number CANNOT be active on WhatsApp app AND Cloud API at the same time.
> 
> If number is currently used on WhatsApp app, client must:
> - Open WhatsApp → Settings → Account → **Delete My Account**
> - Then the number is free to use with Cloud API
> 
> The number can still receive calls and SMS — just not WhatsApp app.

1. In your app dashboard → **WhatsApp → API Setup**
2. Scroll to **"Add a phone number"** section → click **Add phone number**
3. Fill form:
   - **Business display name:** Client's shop name (e.g. "Raj Fashion Store")
   - **Business category:** Retail / appropriate
   - **Connect to:** Select **CLIENT's Business Account** (you have access now)
4. Click **Next**
5. Enter client's number: `+91XXXXXXXXXX`
6. Choose **SMS** for OTP (recommended) — client receives OTP
7. Client tells you OTP → you enter it
8. ✅ Number verified and registered

---

### Step 3: Get Phone Number ID

1. Go to **WhatsApp → API Setup**
2. Under **Send and receive messages** → click the dropdown → select client's number
3. Copy the **Phone Number ID** (e.g. `120364xxxxxxxxxx`)

```
Client Phone Number ID : 120364xxxxxxxxxx
Client WABA ID         : 9876543210987654
```

---

### Step 4: Generate PERMANENT token for client

> Do this inside **CLIENT's Business Account** (not yours)

1. Top left on business.facebook.com → click dropdown → select **CLIENT's Business Account**
2. Settings → **System Users** → click **Add+**
3. Name: `wa-bot`, Role: **Admin** → Create
4. Click `wa-bot` → **Assign Assets**
   - Your `WA-Automation` app → Full control ✅
   - Client's WhatsApp Account → Full control ✅
5. Click **Assign assets**
6. Click **Generate Token** → add all 3 permissions:
   - ✅ `business_management`
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
7. Expiration: **Never**
8. **Copy token immediately**

```
Client Permanent Token : EAAxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Step 5: Create Message Templates

For marketing messages (abandoned cart, campaigns), you MUST use pre-approved templates.
You cannot send free-form marketing messages outside a customer service window.

**To create a template:**

1. Go to **business.facebook.com** → CLIENT's account
2. Left sidebar → **WhatsApp Manager** → **Account Tools** → **Message Templates**
3. Click **Create Template**

**Template 1 — Abandoned Cart Reminder 1:**
- Category: **Marketing**
- Name: `abandoned_cart_reminder` (lowercase, underscores only)
- Language: English
- Body:
  ```
  Hi {{1}},
  
  You left something in your cart! 🛒
  
  Don't miss out — complete your order here:
  {{2}}
  
  This offer won't last long!
  ```
- Variables: `{{1}}` = customer name, `{{2}}` = cart URL
- Submit → awaits review (usually 2-4 hours, sometimes minutes)

**Template 2 — Abandoned Cart with Discount:**
- Category: **Marketing**
- Name: `abandoned_cart_discount`
- Body:
  ```
  Hi {{1}},
  
  Still thinking about it? Here's a special offer for you! 🎁
  
  Use code *{{2}}* for 10% OFF your cart today only.
  
  Complete your order: {{3}}
  
  Hurry — offer expires in 24 hours! ⏳
  ```
- Variables: `{{1}}` = name, `{{2}}` = discount code, `{{3}}` = cart URL

**Template 3 — Order Confirmation:**
- Category: **Utility** (cheaper! ₹0.145 vs ₹1.09)
- Name: `order_confirmed`
- Body:
  ```
  Hi {{1}},
  
  ✅ Your order has been confirmed!
  
  Thank you for shopping with us. We'll notify you once it ships.
  
  Need help? Just reply to this message.
  ```

**Template 4 — Bulk Campaign:**
- Category: **Marketing**
- Name: `bulk_campaign`
- Body: (customize per campaign)
  ```
  Hi {{1}},
  
  We have something special for you! ✨
  
  {{2}}
  
  Shop now: {{3}}
  
  Reply STOP to unsubscribe.
  ```

---

### Step 6: Enter in your Admin Panel

After setup, you have:

```
Phone Number ID  : 120364xxxxxxxxxx
WABA ID          : 9876543210987654
Access Token     : EAAxxxxxxxxxxxxxxxxx (permanent)
Template Names   : abandoned_cart_reminder, abandoned_cart_discount, order_confirmed, bulk_campaign
```

Enter these in your admin panel when activating the merchant.

---

## 📡 PART 3 — API Reference (v23.0 — Current as of July 2026)

### Send a Template Message

```bash
POST https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

```json
{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "abandoned_cart_reminder",
    "language": { "code": "en" },
    "components": [
      {
        "type": "body",
        "parameters": [
          { "type": "text", "text": "Sachin" },
          { "type": "text", "text": "https://wa-automation.myshopify.com/checkouts/..." }
        ]
      }
    ]
  }
}
```

### Send a Free-form Text Message (only within CSW)

```bash
POST https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json
```

```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919876543210",
  "type": "text",
  "text": {
    "body": "Hello! How can we help you today?"
  }
}
```

### Webhook Payload (incoming message)

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "919876543210",
          "phone_number_id": "PHONE_NUMBER_ID"
        },
        "messages": [{
          "from": "919876543210",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "text": { "body": "Hello!" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

---

## 🔄 PART 4 — What Changes in Your Code

### DB Schema — Add to Merchant model

```prisma
metaPhoneNumberId  String?
metaAccessToken    String?
metaWabaId         String?
```

### Remove from Merchant model (no longer needed)

```
whatsappSessionId  — DELETE
```

### New `whatsapp.service.ts` — Replace Baileys entirely

```typescript
import axios from 'axios';

const META_API_VERSION = 'v23.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

export const sendMetaMessage = async (
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  templateName: string,
  variables: string[]
): Promise<boolean> => {
  try {
    const params = variables.map(v => ({ type: "text", text: v }));

    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: toPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [{
            type: "body",
            parameters: params
          }]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error: any) {
    console.error('Meta API Error:', error.response?.data || error.message);
    return false;
  }
};
```

### Onboarding — Remove QR scan step

Replace QR scan with: "Your WhatsApp number will be connected by your account manager."

Merchant just enters their number, you connect it manually via the setup process above.

---

## ⚠️ Important Policies (July 2026 — Verified from Meta)

### Content policies
- ✅ E-commerce: allowed
- ✅ Abandoned cart recovery: allowed
- ✅ Order confirmations: allowed
- ✅ Promotional campaigns: allowed (with approved templates)
- ❌ Spam / unsolicited messages: not allowed
- ❌ Alcohol, weapons, gambling, adult content: not allowed

### Opt-out compliance
- You must honor "STOP" replies
- Meta monitors block/report rates
- High block rates → account warning → reduced limits → suspension

### Template approval
- Submit templates → Meta reviews in 2-4 hours usually
- Once approved, use permanently
- If template rejected, revise and resubmit

### Quality rating
- Green: Good — no issues
- Yellow: Warning — too many blocks/reports
- Red: Limits reduced
- Gray: Disabled

---

## 📋 Quick Reference Card

```
Business Model:
  Your income  : Subscription fee only (e.g. ₹999/month per client)
  Meta charges : Directly to client's own card — you don't handle this
  
Per client — 3 values needed:
  1. Phone Number ID  → WhatsApp → API Setup → select number
  2. Access Token     → Business Settings → System Users → Generate Token
  3. Template Names   → WhatsApp Manager → Message Templates

API endpoint (v23.0):
  POST https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages
  Header: Authorization: Bearer {ACCESS_TOKEN}

India pricing Meta charges client directly (July 2026):
  Marketing message : ₹1.09 each  ← client's card, not yours
  Utility message   : ₹0.145 each ← client's card, not yours
  Service/replies   : FREE

Messaging limit without verification:
  1,000 messages/day — enough for small business
```

---

*Source: Meta Developer Documentation, verified July 2026*
*Pricing doc: developers.facebook.com/docs/whatsapp/pricing — Updated July 2, 2026*
*Get started doc: developers.facebook.com/docs/whatsapp/cloud-api/get-started — Updated June 16, 2026*
