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
