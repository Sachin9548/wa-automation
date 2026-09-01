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
  errorMessage?: string;
};

// ── Send a template message via Meta Cloud API ────────────────────────────────
export const sendMetaTemplateMessage = async (
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  templateName: string,
  variables: string[],
  languageCode: string = 'en_US'
): Promise<MetaSendResult> => {
  try {
    const parameters = variables.map(v => ({ type: 'text', text: String(v) }));

    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components: parameters.length > 0
            ? [{ type: 'body', parameters }]
            : []
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return { success: true, retryable: false };

  } catch (error: any) {
    const metaError = error.response?.data?.error;
    const code: number = metaError?.code;
    const message: string = metaError?.message || error.message;
    const retryable = !NON_RETRYABLE_META_CODES.includes(code);
    const invalidNumber = INVALID_WHATSAPP_NUMBER_CODES.includes(code);

    console.error(`❌ Meta API error for ${toPhone}: code=${code} msg=${message}`);

    if (!retryable) {
      console.error(`🚫 Non-retryable Meta error (${code}) — will NOT retry`);
    }
    if (invalidNumber) {
      console.warn(`📵 Phone ${toPhone} is NOT registered on WhatsApp (code ${code})`);
    }

    return { success: false, retryable, invalidNumber, errorCode: code, errorMessage: message };
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
  phoneNumberId:              string;
  accessToken:                string;
  toPhone:                    string;
  templateName:               string;   // approved MPM template name
  languageCode?:              string;   // default 'en_US'
  bodyVariables?:             string[]; // {{1}} {{2}} etc in template body
  thumbnailProductRetailerId: string;   // product shown as preview thumbnail
  sections:                   MPMSection[]; // up to 10 sections, 30 products total
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
      type:     'button',
      sub_type: 'mpm',
      index:    0,
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
        recipient_type:    'individual',
        to:                toPhone,
        type:              'template',
        template: {
          name:     templateName,
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

    console.error(`❌ MPM send error for ${toPhone}: code=${code} msg=${message}`);
    return { success: false, retryable, errorCode: code, errorMessage: message };
  }
};

// ── Send Catalog Message (no template needed — opens full catalog) ────────────
// Simpler than MPM — just sends a "View catalog" button message
// Does NOT require an approved template — works within 24hr window
export const sendCatalogMessage = async (
  phoneNumberId: string,
  accessToken:   string,
  toPhone:       string,
  bodyText:      string,
  footerText?:   string,
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
        recipient_type:    'individual',
        to:                toPhone,
        type:              'interactive',
        interactive: {
          type:   'catalog_message',
          body:   { text: bodyText },
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
