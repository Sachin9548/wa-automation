// src/services/whatsapp.service.ts
// Meta Cloud API — Official WhatsApp Business API (v23.0)
// Replaces Baileys entirely. No QR codes, no sessions, no ban risk.

import axios from 'axios';

const META_API_VERSION = 'v23.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// ── Send a template message via Meta Cloud API ────────────────────────────────
export const sendMetaTemplateMessage = async (
  phoneNumberId: string,
  accessToken: string,
  toPhone: string,
  templateName: string,
  variables: string[]    // ordered list matching {{1}}, {{2}}, {{3}} in template
): Promise<boolean> => {
  try {
    const parameters = variables.map(v => ({ type: 'text', text: v }));

    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
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

    return true;
  } catch (error: any) {
    console.error(
      `❌ Meta API error for ${toPhone}:`,
      error.response?.data?.error || error.message
    );
    return false;
  }
};

// ── Send a free-form text message (only within 24hr customer service window) ──
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
    console.error(
      `❌ Meta text message error for ${toPhone}:`,
      error.response?.data?.error || error.message
    );
    return false;
  }
};

// ── Mark message as read (for incoming messages) ──────────────────────────────
export const markMessageRead = async (
  phoneNumberId: string,
  accessToken: string,
  messageId: string
): Promise<void> => {
  try {
    await axios.post(
      `${META_BASE_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch { /* non-critical, ignore */ }
};
