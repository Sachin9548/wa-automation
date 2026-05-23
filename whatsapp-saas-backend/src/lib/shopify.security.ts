import crypto from 'crypto';

export const verifyShopifyWebhook = (rawBody: Buffer, hmacHeader: string, secret: string) => {
  if (!hmacHeader || !secret) return false;

  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
};