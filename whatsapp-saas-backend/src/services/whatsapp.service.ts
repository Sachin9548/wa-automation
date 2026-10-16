// src/services/whatsapp.service.ts
import axios from 'axios';

const META_API_VERSION = 'v23.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Error codes that should NOT be retried
// These mean the phone number is invalid, not on WhatsApp, or user opted out
export const NON_RETRYABLE_META_CODES = [
  131030, // Recipient phone number not in allowed list (test mode)
  131047, // Re-engagement message — user opted out / hasn't messaged in 24h
  131026, // Message undeliverable — number not on WhatsApp or invalid
  131051, // Unsupported message type
  131052, // Media download error (non-recoverable)
  131053, // Media upload error (non-recoverable)
  100,    // Invalid parameter (bad phone format etc.)
  190,    // Access token expired / invalid
  368,    // Account blocked by Meta
  131000, // Something went wrong — but treat as non-retryable to avoid spam
];

// Codes that specifically mean "number not on WhatsApp" — mark customer invalid
export const INVALID_WHATSAPP_NUMBER_CODES = [
  131026, // Message undeliverable — most common "not on WhatsApp" code
  131030, // Not in allowed list
];

export type MetaSendResult = {
  success: boolean;
  retryable: boolean;
  invalidNumber?: boolean;  // true = number not on WhatsApp, mark customer
  errorCode?: number;
  rateLimited?: boolean;
  errorMessage?: string;
};


// Codes that mean daily/hourly rate limit hit — should retry after 24 hours
export const RATE_LIMIT_CODES = [
  131042, // Business account daily messaging limit reached
  131048, // Spam rate limit — too many messages
  131056, // Too many messages sent to phone number in short period
];


// ── Send a template message via Meta Cloud API ────────────────────────────────
// Auto-detects body vs header vs button URL variables from template structure
export const sendMetaTemplateMessage = async (
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  templateName: string,
  variables: string[],
  languageCode: string = 'en_US',
  variableSources?: string[],
): Promise<MetaSendResult> => {
  try {
    if (!variables || variables.length === 0) {
      // No variables — send as-is
      await axios.post(
        `${META_BASE_URL}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: toPhone,
          type: 'template',
          template: { name: templateName, language: { code: languageCode }, components: [] }
        },
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
      );
      return { success: true, retryable: false };
    }

    // ── Smart component builder ───────────────────────────────────────────────
    // Use variableSources if provided (from flow mapping),
    // otherwise default all to body — simplest correct behavior
    const sources: string[] = (variableSources && variableSources.length === variables.length)
      ? variableSources
      : variables.map(() => 'body');

    const bodyParams:   any[] = [];
    const headerParams: any[] = [];
    const buttonParams: Record<string, { sub_type: string; params: any[] }> = {};

    variables.forEach((v, i) => {
      const source = sources[i] || 'body';
      if (source === 'header') {
        headerParams.push({ type: 'text', text: String(v) });
      } else if (source.startsWith('button_url_')) {
        // URL button — send only the SUFFIX after the base URL
        // Template URL example: "https://api.wautomation.shop/api/tracking/{{1}}"
        // We need to extract just the suffix part from the full URL
        const btnIdx = source.replace('button_url_', '');
        if (!buttonParams[btnIdx]) buttonParams[btnIdx] = { sub_type: 'url', params: [] };
        // Extract suffix: remove the base URL portion that's already in the template
        // If value is a full URL, Meta expects only the dynamic part after the base
        const urlValue = String(v);
        // Check if it looks like a full URL — if so, extract path after last known base
        const suffix = urlValue.startsWith('http')
          ? urlValue.replace(/^https?:\/\/[^/]+\//, '') // strip scheme+host, keep path
          : urlValue;
        buttonParams[btnIdx].params.push({ type: 'text', text: suffix });
      } else if (source.startsWith('button_coupon_')) {
        // COPY_CODE button — send the coupon code
        const btnIdx = source.replace('button_coupon_', '');
        if (!buttonParams[btnIdx]) buttonParams[btnIdx] = { sub_type: 'copy_code', params: [] };
        buttonParams[btnIdx].params.push({ type: 'coupon_code', coupon_code: String(v) });
      } else {
        bodyParams.push({ type: 'text', text: String(v) });
      }
    });

    const components: any[] = [];
    if (headerParams.length > 0) {
      components.push({ type: 'header', parameters: headerParams });
    }
    if (bodyParams.length > 0) {
      components.push({ type: 'body', parameters: bodyParams });
    }
    Object.entries(buttonParams).forEach(([idx, btn]) => {
      components.push({
        type: 'button',
        sub_type: btn.sub_type,
        index: String(idx),
        parameters: btn.params,
      });
    });

    console.log(`📤 Sending template "${templateName}" to ${toPhone} | components: ${JSON.stringify(components)}`);

    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    return { success: true, retryable: false };

  } catch (error: any) {
    const metaError = error.response?.data?.error;
    const code: number = metaError?.code;
    const message: string = metaError?.message || error.message;
    const retryable = !NON_RETRYABLE_META_CODES.includes(code);
    const invalidNumber = INVALID_WHATSAPP_NUMBER_CODES.includes(code);

    const rateLimited = RATE_LIMIT_CODES.includes(code);  // ← NEW

    console.error(`❌ Meta API error for ${toPhone}: code=${code} msg=${message}`);

    if (!retryable) {
      console.error(`🚫 Non-retryable Meta error (${code}) — will NOT retry`);
    }
    if (invalidNumber) {
      console.warn(`📵 Phone ${toPhone} is NOT registered on WhatsApp (code ${code})`);
    }


    return { success: false, retryable, rateLimited, invalidNumber, errorCode: code, errorMessage: message };

  }
};

// ── Send a free-form text message ─────────────────────────────────────────────
export const sendMetaTextMessage = async (
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  text: string
): Promise<boolean> => {
  try {
    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { body: text }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return true;
  } catch (error: any) {
    console.error(`❌ Meta text message error for ${toPhone}:`, error.response?.data?.error || error.message);
    return false;
  }
};

// ── Mark message as read ──────────────────────────────────────────────────────
export const markMessageRead = async (
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> => {
  try {
    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
  } catch { /* non-critical */ }
};

// ── MPM Types ─────────────────────────────────────────────────────────────────
export interface MPMSection {
  title: string;               // e.g. "Trending Jewellery"
  product_items: Array<{
    product_retailer_id: string; // Shopify product ID / SKU in Facebook catalog
  }>;
}

export interface MPMSendOptions {
  phoneNumberId: string;
  accessToken: string;
  toPhone: string;
  templateName: string;   // approved MPM template name
  languageCode?: string;   // default 'en_US'
  bodyVariables?: string[]; // {{1}} {{2}} etc in template body
  thumbnailProductRetailerId: string;   // product shown as preview thumbnail
  sections: MPMSection[]; // up to 10 sections, 30 products total
}

// ── Send MPM (Multi-Product Message) via approved template ───────────────────
// Customer sees product cards inside WhatsApp — no need to visit website
// Requires: Facebook Catalog linked to WABA + products synced
export const sendMPMTemplateMessage = async (
  opts: MPMSendOptions
): Promise<MetaSendResult> => {
  const {
    phoneNumberId, accessToken, toPhone,
    templateName, languageCode = 'en_US',
    bodyVariables = [],
    thumbnailProductRetailerId,
    sections,
  } = opts;

  try {
    const components: any[] = [];

    // Body variables ({{1}}, {{2}} etc)
    if (bodyVariables.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyVariables.map(v => ({ type: 'text', text: String(v) })),
      });
    }

    // MPM button component — this is what makes it interactive product message
    components.push({
      type: 'button',
      sub_type: 'mpm',
      index: 0,
      parameters: [{
        type: 'action',
        action: {
          thumbnail_product_retailer_id: thumbnailProductRetailerId,
          sections,
        }
      }]
    });

    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    console.log(`✅ MPM sent to ${toPhone} — template: ${templateName}, products: ${sections.flatMap(s => s.product_items).length}`);
    return { success: true, retryable: false };

  } catch (error: any) {
    const metaError = error.response?.data?.error;
    const code: number = metaError?.code;
    const message: string = metaError?.message || error.message;
    const retryable = !NON_RETRYABLE_META_CODES.includes(code);
    const rateLimited = RATE_LIMIT_CODES.includes(code);  // ← NEW
    const invalidNumber = INVALID_WHATSAPP_NUMBER_CODES.includes(code);

    console.error(`❌ MPM send error for ${toPhone}: code=${code} msg=${message}`);
    return { success: false, retryable, rateLimited, invalidNumber, errorCode: code, errorMessage: message };
  }
};

// ── Send Catalog Message (no template needed — opens full catalog) ────────────
// Simpler than MPM — just sends a "View catalog" button message
// Does NOT require an approved template — works within 24hr window
export const sendCatalogMessage = async (
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  bodyText: string,
  footerText?: string,
  thumbnailProductRetailerId?: string,
): Promise<boolean> => {
  try {
    const action: any = { name: 'catalog_message' };
    if (thumbnailProductRetailerId) {
      action.parameters = { thumbnail_product_retailer_id: thumbnailProductRetailerId };
    }

    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'interactive',
        interactive: {
          type: 'catalog_message',
          body: { text: bodyText },
          ...(footerText ? { footer: { text: footerText } } : {}),
          action,
        }
      },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );

    console.log(`✅ Catalog message sent to ${toPhone}`);
    return true;

  } catch (error: any) {
    console.error(`❌ Catalog message error for ${toPhone}:`, error.response?.data?.error || error.message);
    return false;
  }
};


export const getMetaTemplateDetails = async (wabaId: string, accessToken: string, templateName: string) => {
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v23.0/${wabaId}/message_templates?fields=name,components,language`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const template = response.data.data.find((t: any) => t.name === templateName);

    // Yahan hum poora component return karenge
    return template;
  } catch (error) {
    return null;
  }
};