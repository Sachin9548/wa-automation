# Shopify Custom App Setup — Per Client (Non-Expiring Token)

This guide is followed **once per new client**. It creates a dedicated Shopify custom app for that client and generates a **permanent (non-expiring) access token**.

Repeat this entire document for every new client you onboard.

---

## Prerequisites (one-time, not per client)

- Shopify Partner account (already set up)
- Backend endpoint ready and publicly reachable:
  `https://api.wautomation.shop/shopify/callback/tokengenerate`
- A way to generate and store a random `state` string per install, and to store client tokens encrypted in your database.

---

## Step 1 — Create a new app in Dev Dashboard

1. Go to [dev.shopify.com/dashboard](https://dev.shopify.com/dashboard).
2. Click **Create app**.
3. Name it with the client's name so it's easy to identify later, e.g.
   `Wautomation - <ClientName>`

---


## Step 2 — Configure the app version

On the **Create version** page:

| Field | Value |
|---|---|
| App URL | `https://api.wautomation.shop/health` |
| Embed app in Shopify admin | **OFF** |
| Preferences URL | leave blank |
| Webhooks API version | latest available |

---

## Step 3 — Set scopes

In the **Scopes** field, enter:

```
read_customers,read_orders,read_products,read_all_orders
```

Only add more scopes if a specific feature genuinely needs them (least privilege).

---



## Step 4 — Enable legacy install flow

Find the **"Use legacy install flow"** toggle and turn it **ON**.

> Critical step. Without this, Shopify forces the new managed-install flow, which only issues expiring tokens.

---

## Step 5 — Set the redirect URL

In **Allowed redirection URL(s)**, enter:

```
https://api.wautomation.shop/shopify/callback/tokengenerate
```

This is the same for every client — you built this endpoint once.

---

## Step 6 — Release and collect credentials

1. Click **Release**.
2. Go to the app's credentials section and copy:
   - **Client ID**
   - **Client Secret**
3. Save both against this client's record in your database (encrypt the secret).

---


## Step 7 — Set distribution to Custom

1. Open **App settings** → **Distribution**.
2. Select **Custom distribution**.
3. Confirm.

> This step is what makes a non-expiring token possible. Custom distribution apps are exempt from Shopify's expiring-token requirement, but are limited to a single store — which is fine, since this app is only for this one client.

---

## Step 8 — Build the install link for this client

```
https://{client-shop}.myshopify.com/admin/oauth/authorize?client_id={CLIENT_ID}&scope=read_customers,read_orders,read_products&redirect_uri=https://api.wautomation.shop/shopify/callback/tokengenerate&state={RANDOM_STATE}
```

- `{client-shop}` — the client's `.myshopify.com` domain
- `{CLIENT_ID}` — from Step 7
- `{RANDOM_STATE}` — a fresh random string, saved temporarily against this client for verification in Step 10

---

## Step 9 — Client installs the app

Send the install link to the client. They log into their Shopify admin, review the requested permissions, and click **Install**.

---

## Step 10 — Handle the callback

Shopify redirects to your callback URL with `code`, `hmac`, `shop`, and `state` query parameters.

On your backend:

1. **Verify `state`** matches what you saved in Step 8. Reject if it doesn't.
2. **Verify the HMAC** signature using your client secret. Reject if invalid.

---

## Step 11 — Exchange the code for a token

```
POST https://{shop}.myshopify.com/admin/oauth/access_token
Content-Type: application/x-www-form-urlencoded

client_id={CLIENT_ID}
&client_secret={CLIENT_SECRET}
&code={CODE_FROM_CALLBACK}
```

Do **not** include an `expiring` parameter. This returns a non-expiring `access_token`.

---

## Step 12 — Save the token

Store the returned `access_token` encrypted, linked to this client's record and shop domain.

This token stays valid until the client uninstalls the app or you rotate the app's client secret — no refresh loop needed.

---

## Per-client checklist (copy this for each new client)

- [ ] App created in Dev Dashboard, named for the client
- [ ] Distribution set to Custom
- [ ] App URL, scopes, redirect URI configured
- [ ] Legacy install flow enabled
- [ ] Version released
- [ ] Client ID + Secret saved (encrypted)
- [ ] Install link sent to client
- [ ] Callback verified (state + HMAC)
- [ ] Token exchanged and saved (encrypted)