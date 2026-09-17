# WhatsApp (Meta) Client Onboarding — Option B: Fully Separate Per-Client Setup

**Why this option:** No business verification or App Review needed. Everything (App, WABA, System User) is created inside the *client's own* Facebook/Business account, so it's "direct developer accessing your own business data" — the case Meta exempts from Advanced Access requirements.

**Trade-off:** You repeat this entire setup for every client (more manual work than a shared app), but it needs zero approval from Meta and works immediately.

**How you'll do this:** Since clients are non-technical, plan to do this over a screen-share call with the client logged into their own Facebook account, or with their temporary permission to log in on their behalf.

---

## Per-Client Steps (repeat for every client)

### 1. Create a Meta App inside the client's own account
1. Log into [developers.facebook.com](https://developers.facebook.com) using the **client's** Facebook account.
2. Click **My Apps** → **Create App**.
3. Choose **Other** → Next → **Business** → Next.
4. Name it after the client, e.g. `<ClientName> WhatsApp`.
5. Click **Create app**.
6. On the products page, find **WhatsApp** → click **Set up**.

### 2. Add and verify the client's phone number
1. In the left menu: **WhatsApp → API Setup**.
2. Scroll down, click **Add Phone Number**.
3. Fill in the client's business name and details.
4. Enter their WhatsApp number. They'll receive an OTP by SMS — verify it.

   > Note: the number must not currently be active in the regular WhatsApp or WhatsApp Business app (or it needs to be migrated). Use a fresh number, or migrate their existing one, before this step.

5. Once verified, copy and save:
   - **Phone Number ID**
   - **WhatsApp Business Account ID (WABA ID)**

### 3. Create a System User (inside the same client account)
1. Open a new tab: [business.facebook.com/settings](https://business.facebook.com/settings) (still logged in as the client).
2. Left menu → **Users** → **System Users** → **Add**.
3. Name it, e.g. `<ClientName>-Bot`. Role: **Admin**. Create.

### 4. Assign BOTH the App and the WABA to the System User
This is the step the original quick-guide missed — skipping it produces a token that can't actually send messages.

1. Click the System User you just created.
2. Click **Assign Assets** (or "Add Assets").
3. In the dialog:
   - Go to **Apps** tab → select the client's App (from Step 1) → turn ON **Full Control**.
   - Go to **WhatsApp Accounts** tab → select the client's WABA (from Step 2) → turn ON **Full Control**.
4. Click **Save Changes**.

### 5. Generate the permanent token
1. On the System User's page, click **Generate New Token**.
2. Select the client's App.
3. Tick exactly these two permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Click **Generate Token**.
5. Copy the token immediately (starts with `EAA...`) — Meta shows it only once.

### 6. Subscribe this app to its own WABA's webhooks
```
POST https://graph.facebook.com/{API_VERSION}/{WABA_ID}/subscribed_apps
Authorization: Bearer {ACCESS_TOKEN}
```

### 7. Point the webhook to your backend
- Back in the client's App Dashboard: **WhatsApp → Configuration**.
- Set the **Callback URL** to your backend endpoint (can be the same URL for every client, since each client has a separate App/token — your backend identifies the client from the WABA ID in the payload either way), e.g. `https://api.wautomation.shop/api/webhooks/meta`.
- Set a **Verify Token** — any string you choose (e.g. `my_secret_token_123`). Save it in your backend config.
- Subscribe to the `messages` field, and `account_update` (so you're notified if this client's WABA ever gets restricted).

#### Webhook verification endpoint (build once, backend-side — needed before Meta will accept the callback URL)
When you save the callback URL, Meta sends a one-time **GET** request to it containing `hub.mode`, `hub.verify_token`, and `hub.challenge` as query params. Your backend must:
1. Check that `hub.verify_token` matches the token you set above.
2. If it matches, respond with the raw value of `hub.challenge` as plain text (HTTP 200).
3. If it doesn't match, respond with a 403.

Without this endpoint responding correctly, Meta will refuse to save the callback URL at all — so build this before Step 7.

### 8. Client adds a payment method (billing)
- Client: their Business Settings → **Billing & Payments** → add a credit card.
- Meta will not actually deliver messages until a valid payment method is attached, even if the token and webhook are working — don't skip this during the screen-share.

### 9. Save everything against this client's record
Store, encrypted, against this client in your database:
- App ID
- Permanent access token
- WABA ID
- Phone Number ID

---

## The 250-message/day limit (the biggest early bottleneck)

Because each client's App and Business Manager will be brand new and unverified, Meta caps them at **250 business-initiated conversations per 24 hours** by default.

- **Problem:** if a client has, say, 400 abandoned carts a day, messages beyond 250 will simply fail once the limit is hit.
- **Fix:** during the same screen-share, get the client to go to Business Settings → **Security Center** and submit their GST/MSME or business registration documents for verification. Once Meta approves it (usually 1-2 days), the limit jumps from 250 → 1,000, and can climb further (10,000+) with sustained good sending quality.

Flag this to every client at onboarding — otherwise they'll hit a silent wall a few days in and assume something is broken.

---

## Per-client checklist

- [ ] App created inside client's own Facebook account
- [ ] Phone number added and OTP-verified, WABA ID + Phone Number ID noted
- [ ] System User created (inside same client account)
- [ ] **Both** the App and the WABA assigned to the System User (not just the App)
- [ ] Permanent token generated and copied immediately
- [ ] App subscribed to its own WABA's webhooks
- [ ] Backend webhook verification endpoint (GET + hub.challenge) working *before* setting the callback URL
- [ ] Callback URL + verify token configured, subscribed to `messages` and `account_update`
- [ ] Client's payment method added (Billing & Payments)
- [ ] Client told about the 250/day limit and asked to start business verification (GST/MSME)
- [ ] App ID, token, WABA ID, Phone Number ID saved (encrypted) against client record