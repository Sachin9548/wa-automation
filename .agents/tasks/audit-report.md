# WhatsApp SaaS — Full Logic & Bug Audit Report

**Audited files:** 7  
**Bugs found:** 14 (4 critical, 6 warning, 4 minor)  
**Date:** 2025

---

## Executive Summary

The system has a working skeleton but several cross-cutting bugs that cause real production failures. The two bugs that already appear in the logs are:

1. **Meta error 132000** (wrong parameter count) — caused by the abandoned-cart flow not passing `variableSources` in the job payload, so the worker sends ALL variables as body params including button URL variables, which mismatch the actual template structure.
2. **Meta error 132012** (parameter format mismatch) — same root cause, different manifestation: button URL variables must go into a `button` component, not a `body` component.

Beyond those, the `saveMerchantFlow` controller silently drops `variableSources` and `customMessage` on **create** (upsert create branch), the `AutomationFlow` schema is missing the `customMessage` field, `page.tsx` `FlowDraftItem` interface is missing `variableSources`, and `fetchAll` never populates `variableSources`/`customMessage` from DB flows, so saved values are lost on page reload.

---

## File-by-File Findings

---

### FILE 1: `shopify.webhook.ts`

#### BUG-01 — Abandoned cart flow does NOT pass `variableSources` in job payload [CRITICAL]

**Location:** `queueAbandonedCartJobs()`, the `messageQueue.add('send-automated-msg', {...})` call (approx line 188)

**Problem:** The job payload for the abandoned-cart flow includes `variables` but **never includes `variableSources`**. Compare with the upsell flow (line ~272) which correctly reads `variableSources` from the DB and passes it. The abandoned-cart flow builds `mapping` from DB but never reads or passes `variableSources`.

```ts
// ABANDONED CART — missing variableSources:
await messageQueue.add('send-automated-msg', {
  cartId: cart.id, merchantId, phone, templateName, templateLang,
  discountCode, trackingLinkId: trackingLink?.id,
  variables,
  // ❌ variableSources is MISSING
}, ...);

// UPSELL — correctly includes variableSources:
await messageQueue.add('send-automated-msg', {
  ..., variables, variableSources,   // ✅ present
  jobType: 'POST_PURCHASE_UPSELL',
}, ...);
```

**Effect:** Worker receives `variableSources: undefined`, falls back to `variables.map(() => 'body')`, and sends all variables — including button URL variables — as body params. Meta rejects with **error 132012** (format mismatch) or **132000** (param count mismatch).

**Severity: CRITICAL**

---

#### BUG-02 — COD flow builds variables with hardcoded array, ignores DB `variableMapping`/`variableSources` [CRITICAL]

**Location:** `handleOrderCreatedWebhook()`, COD section, approx line 335–360

**Problem:** The COD flow ignores the `variableMapping` and `variableSources` saved by the admin in the UI. It hardcodes the variable array:

```ts
const codVariables: string[] = [
  orderData.customer?.first_name || ... || 'there',
  orderNumber,
  trackingUrl,
  ...(discountCode ? [discountCode] : []),
];
```

It also never passes `variableSources` in the job payload. This means:
- If the admin maps a different template with different variable order in the UI, the mapping is silently ignored.
- If the template has button URL variables, they are sent as body params → Meta error 132012.

**Severity: CRITICAL**

---

#### BUG-03 — Duplicate `console.log` for template variables [MINOR]

**Location:** `queueAbandonedCartJobs()`, approx lines 179–181

```ts
console.log(`📤 Dynamic variables for ${templateName}: [${variables.join(' | ')}]`);
console.log(`📤 Template variables: [${variables.join(' | ')}]`);
```

The same data is logged twice with different labels. This pollutes logs and makes debugging confusing.

**Severity: MINOR**

---

#### BUG-04 — Duplicate `messageQueue` and `resumeWorkerIfPaused` imports inside COD block [MINOR]

**Location:** `handleOrderCreatedWebhook()`, COD section, approx lines 330–333

```ts
const { messageQueue } = await import('../lib/queue');
const { resumeWorkerIfPaused } = await import('../workers/message.worker');
```

These are already imported at the top of the file as static imports. Dynamic re-importing them is redundant and creates a potential circular-import risk (message.worker imports from queue, queue should not import message.worker).

**Severity: MINOR**

---

### FILE 2: `message.worker.ts`

#### BUG-05 — `send-campaign-msg` does NOT pass `variableSources` to `sendMetaTemplateMessage` [WARNING]

**Location:** `send-campaign-msg` handler, approx line 265

```ts
const result = await sendMetaTemplateMessage(
  merchant.metaPhoneNumberId,
  merchant.metaAccessToken,
  toPhone,
  templateName || 'hello_world',
  variables || [],
  templateLang || 'en_US'
  // ❌ variableSources omitted — 7th parameter never passed
);
```

The `send-automated-msg` handler (line ~164) correctly passes `variableSources || []` as the 7th argument. The campaign handler does not. If a campaign template has button URL variables, they will be sent as body params.

**Severity: WARNING** (campaigns currently only use simple `[customerName]` variables, but will break if a template with button variables is used)

---

#### BUG-06 — `send-mpm-msg` handler has no `variableSources` concern, but `send-campaign-msg` campaign completion check uses stale `sentCount` [WARNING]

**Location:** `send-campaign-msg` handler, approx line 290–297

```ts
const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
if (campaign && campaign.sentCount + 1 >= campaign.totalRecipients) {
  await prisma.campaign.update({ ... data: { status: 'COMPLETED' } });
}
```

The `sentCount` was just incremented in the `$transaction` above, but this second `findUnique` reads the **pre-increment** value from DB (the transaction may not have flushed yet or the local read races). The `+1` compensates but this pattern is fragile — a concurrent job could cause the campaign to never reach `COMPLETED` status, or reach it prematurely.

**Severity: WARNING**

---

### FILE 3: `whatsapp.service.ts`

#### BUG-07 — `header` component variables are merged into `bodyParams` instead of a separate `header` component [WARNING]

**Location:** `sendMetaTemplateMessage()`, approx lines 60–70

```ts
if (source === 'body' || source === 'header') {
  bodyParams.push({ type: 'text', text: String(v) });
}
```

Variables with source `'header'` are pushed into `bodyParams` and sent under `{ type: 'body', parameters: [...] }`. The Meta API requires header text variables to be in a separate `{ type: 'header', parameters: [...] }` component. Sending a header variable as a body parameter will cause Meta to reject the message with error 132012.

**Severity: WARNING**

---

#### BUG-08 — Button index is cast to String but Meta API expects a string-form integer — this is correct, but `buttonParams` key `0` vs `"0"` inconsistency is a latent risk [MINOR]

**Location:** `sendMetaTemplateMessage()`, approx lines 73–80

```ts
const buttonParams: Record<number, any[]> = {};  // key is number
...
Object.entries(buttonParams).forEach(([idx, params]) => {
  components.push({ type: 'button', sub_type: 'url', index: String(idx), ... });
});
```

`Object.entries` always yields string keys, so `idx` is already a string when `String(idx)` is called. This works correctly today, but the TypeScript type `Record<number, any[]>` is misleading — JS object keys are always strings. Not a runtime bug, but a type confusion that can mislead future developers.

**Severity: MINOR**

---

### FILE 4: `admin.controller.ts`

#### BUG-09 — `saveMerchantFlow` upsert `create` branch is missing `variableSources` and `customMessage` [CRITICAL]

**Location:** `saveMerchantFlow()`, the `prisma.automationFlow.upsert` call, approx lines 290–315

```ts
const flow = await prisma.automationFlow.upsert({
  where: { merchantId_type: { merchantId, type } },
  update: {
    ...
    variableMapping: formattedMapping,
    variableSources: formattedSources,   // ✅ present in update
    customMessage: customMessage,         // ✅ present in update
    ...
  },
  create: {
    merchantId, type, delayMinutes: parseInt(delayMinutes),
    template: template || "",
    metaTemplateName: metaTemplateName || null,
    metaTemplateLang: metaTemplateLang || "en_US",
    variableMapping: formattedMapping,
    // ❌ variableSources MISSING from create branch
    // ❌ customMessage MISSING from create branch
    discountCode: discountCode || null,
    isActive,
  },
});
```

When a flow is saved for the **first time** (no existing record), `variableSources` and `customMessage` are silently dropped. The flow will be created with `variableSources: null` and `customMessage: null` regardless of what the admin configured. On next edit (update path), they will be saved correctly.

**Severity: CRITICAL** — first-save always loses variable source mapping, causing Meta 132012 on the first message sent.

---

#### BUG-10 — `getMerchantDetail` select does NOT include `variableSources` or `customMessage` from flows [WARNING]

**Location:** `getMerchantDetail()`, the `prisma.merchant.findUnique` select, approx lines 205–240

The merchant detail endpoint selects many fields but flows are fetched via a separate `/admin/flows/:merchantId` endpoint (`getMerchantFlows`). That endpoint does `prisma.automationFlow.findMany(...)` with **no explicit `select`**, which returns all fields — so `variableSources` and `customMessage` ARE returned by `getMerchantFlows`. This is not a bug in itself.

However, `getMerchantDetail` does not return flows at all. The frontend `fetchAll` calls both endpoints separately, so flows data is correct. **No bug here — marking as informational.**

---

### FILE 5: `prisma/schema.prisma`

#### BUG-11 — `AutomationFlow` model is missing the `customMessage` field [CRITICAL]

**Location:** `AutomationFlow` model, approx lines 170–195

```prisma
model AutomationFlow {
  ...
  variableMapping  String?  @db.Text
  variableSources  String?  @db.Text
  // ❌ customMessage field is NOT defined
  ...
}
```

`variableMapping` ✅ and `variableSources` ✅ are present, but `customMessage` is **absent from the schema**. The controller tries to write `customMessage: customMessage` to this model, which will either:
- Throw a Prisma validation error at runtime, OR
- Be silently ignored by Prisma (field not in schema = not mapped)

Either way, `customMessage` is never persisted to the database.

**Severity: CRITICAL** — the "Common Message" feature (custom broadcast text for all customers) is completely non-functional until this field is added and a migration is run.

---

### FILE 6: `FlowsTab.tsx`

#### BUG-12 — Template `onChange` counts header variables but merges them into body slots [WARNING]

**Location:** Template `onChange` handler, approx lines 230–270

```tsx
const allSlots = [
  ...bodyMatches.map(() => ({ source: "body", default: "customer_name" })),
  ...headerMatches.map(() => ({ source: "header", default: "customer_name" })),
  ...buttonMatches.map((btnKey) => ({ source: btnKey, default: "cart_url" })),
];
```

The slot detection is correct — `variableSources` will contain `"header"` for header variables. However, because `whatsapp.service.ts` (BUG-07) merges header variables into `bodyParams`, the header variable will be sent incorrectly at runtime. The UI correctly tracks the source, but the service doesn't honor it. This is a **dependent bug** on BUG-07.

**Severity: WARNING** (UI is correct; the service layer is the defect)

---

#### BUG-13 — `variableSources` missing from FlowsTab render when loading from DB (draft is undefined) [WARNING]

**Location:** FlowsTab render, variable mapping section, approx lines 390–430

```tsx
{draft?.variableMapping?.length > 0 && (
  <div ...>
    {draft.variableMapping.map((val, idx) => ( ... ))}
  </div>
)}
```

The variable mapping UI only renders when `draft` exists (i.e., the admin has made a change). If the page loads with a saved flow from DB (`db` object exists, `draft` is `undefined`), the variable mapping UI is **never shown**. The admin cannot see or edit the saved variable mapping without first touching another field to create a draft. This means saved mappings are invisible on load.

**Severity: WARNING** — UX bug; admin cannot verify existing variable mappings without triggering a draft.

---

### FILE 7: `page.tsx`

#### BUG-14 — `FlowDraftItem` interface in `page.tsx` is missing `variableSources` field [WARNING]

**Location:** `page.tsx`, `FlowDraftItem` interface, approx lines 50–58

```ts
interface FlowDraftItem {
  template: string;
  delay: number;
  active: boolean;
  lang: string;
  discount: string;
  variableMapping: any[];
  customMessage?: string;
  // ❌ variableSources is NOT in this interface
}
```

`FlowsTab.tsx` declares its own inline interface that DOES include `variableSources`, but `page.tsx` passes `flowDrafts` typed as `Record<string, FlowDraftItem>` to `FlowsTab`. TypeScript will either error or silently accept the mismatch depending on strict settings. More importantly, `fetchAll` populates `flowDrafts` from DB flows but since `variableSources` is not in the type, it is never hydrated, meaning after a page reload the saved `variableSources` is lost from state.

**Severity: WARNING**

---

## Summary Table

| ID | File | Severity | Description |
|---|---|---|---|
| BUG-01 | shopify.webhook.ts | **CRITICAL** | Abandoned cart job missing `variableSources` → Meta 132012 |
| BUG-02 | shopify.webhook.ts | **CRITICAL** | COD flow ignores DB mapping, hardcodes variables, no `variableSources` |
| BUG-03 | shopify.webhook.ts | MINOR | Duplicate console.log for template variables |
| BUG-04 | shopify.webhook.ts | MINOR | Redundant dynamic re-import of already-imported modules in COD block |
| BUG-05 | message.worker.ts | **WARNING** | Campaign job omits `variableSources` from `sendMetaTemplateMessage` call |
| BUG-06 | message.worker.ts | **WARNING** | Campaign completion check reads stale `sentCount` from DB |
| BUG-07 | whatsapp.service.ts | **WARNING** | `header` variables sent in `body` component instead of `header` component |
| BUG-08 | whatsapp.service.ts | MINOR | `Record<number, any[]>` type misleading (JS keys are always strings) |
| BUG-09 | admin.controller.ts | **CRITICAL** | `create` branch of upsert drops `variableSources` and `customMessage` |
| BUG-10 | admin.controller.ts | INFO | `getMerchantDetail` doesn't return flows — not a bug, flows use separate endpoint |
| BUG-11 | schema.prisma | **CRITICAL** | `customMessage` field missing from `AutomationFlow` model |
| BUG-12 | FlowsTab.tsx | **WARNING** | Header variable source tracked in UI but not honored in service (dependent on BUG-07) |
| BUG-13 | FlowsTab.tsx | **WARNING** | Variable mapping UI hidden when no draft exists (saved mappings invisible on load) |
| BUG-14 | page.tsx | **WARNING** | `FlowDraftItem` interface missing `variableSources`; never hydrated from DB on reload |

---

## Recommended Fixes (Priority Order)

### 1. Fix schema first — add `customMessage` to `AutomationFlow`
```prisma
model AutomationFlow {
  ...
  variableMapping  String?  @db.Text
  variableSources  String?  @db.Text
  customMessage    String?  @db.Text   // ← ADD THIS
  ...
}
```
Then run: `npx prisma migrate dev --name add_customMessage_to_flow`

### 2. Fix `saveMerchantFlow` upsert `create` branch (BUG-09)
Add `variableSources: formattedSources` and `customMessage: customMessage` to the `create` object.

### 3. Fix abandoned cart job payload — add `variableSources` (BUG-01)
In `queueAbandonedCartJobs`, read `variableSources` from `flow` (same pattern as upsell flow) and pass it in the job data:
```ts
let variableSources: string[] = [];
try {
  if ((flow as any).variableSources) {
    variableSources = JSON.parse((flow as any).variableSources);
  }
} catch {}
// then pass variableSources in messageQueue.add payload
```

### 4. Fix COD flow — read DB mapping + pass `variableSources` (BUG-02)
Replace the hardcoded `codVariables` array with the same `valueMap` + `mapping` + `variableSources` pattern used by the abandoned-cart and upsell flows.

### 5. Fix `whatsapp.service.ts` — separate `header` component (BUG-07)
```ts
const headerParams: any[] = [];
// ...
variables.forEach((v, i) => {
  const source = sources[i] || 'body';
  if (source === 'body') {
    bodyParams.push({ type: 'text', text: String(v) });
  } else if (source === 'header') {
    headerParams.push({ type: 'text', text: String(v) });
  } else if (source.startsWith('button_url_')) { ... }
});
if (headerParams.length > 0) {
  components.push({ type: 'header', parameters: headerParams });
}
```

### 6. Fix campaign worker — pass `variableSources` (BUG-05)
Add `variableSources` to the `sendMetaTemplateMessage` call in the `send-campaign-msg` handler (pass `job.data.variableSources || []`).

### 7. Fix `FlowDraftItem` in `page.tsx` — add `variableSources` (BUG-14)
```ts
interface FlowDraftItem {
  template: string; delay: number; active: boolean; lang: string;
  discount: string; variableMapping: any[];
  customMessage?: string;
  variableSources?: string[];   // ← ADD
}
```
And in `fetchAll`, populate `variableSources` when hydrating drafts from DB flows (if you want to pre-fill existing values).

### 8. Fix `FlowsTab.tsx` — show variable mapping even when no draft (BUG-13)
Change the condition from `draft?.variableMapping?.length > 0` to also check `db` flow data when no draft exists, or always initialize a draft when a template is already selected.

---

## Consistency Check: `variableSources` flow across all 3 automation types

| Step | Abandoned Cart | Post-Purchase Upsell | COD Convert |
|---|---|---|---|
| DB has `variableSources` field | ✅ | ✅ | ✅ |
| Webhook reads from DB | ❌ **BUG-01** | ✅ | ❌ **BUG-02** |
| Job payload includes it | ❌ **BUG-01** | ✅ | ❌ **BUG-02** |
| Worker passes to service | ✅ | ✅ | ✅ |
| Service uses it correctly | ⚠️ **BUG-07** (header) | ⚠️ **BUG-07** | ⚠️ **BUG-07** |

All three automation types share BUG-07 in the service layer. Abandoned cart and COD are also broken at the webhook layer.
