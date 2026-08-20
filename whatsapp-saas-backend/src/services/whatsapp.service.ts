// src/services/whatsapp.service.ts
import axios from 'axios';

const META_API_VERSION = 'v23.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Error codes that should NOT be retried
export const NON_RETRYABLE_META_CODES = [
  131030, // Recipient phone number not in allowed list (test mode)
  131047, // Recipient opted out
  131026, // Message undeliverable
  100,    // Invalid parameter
];

export type MetaSendResult = {
  success: boolean;
  retryable: boolean;
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

    console.error(`❌ Meta API error for ${toPhone}:`, metaError || error.message);

    if (!retryable) {
      console.error(`🚫 Non-retryable Meta error (${code}) — no retry will happen`);
    }

    return { success: false, retryable, errorCode: code, errorMessage: message };
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
