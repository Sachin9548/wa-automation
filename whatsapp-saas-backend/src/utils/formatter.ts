// src/utils/formatter.ts
export const formatWhatsAppNumber = (phone: string): string | null => {
  if (!phone) return null;
  // Saare spaces, plus (+), aur dashes (-) hata do
  let cleaned = phone.replace(/[^0-9]/g, '');

  // Agar Indian number hai aur 10 digit ka hai, toh aage 91 lagao
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  // Agar 0 se shuru hota hai (09876543210), toh 0 hata kar 91 lagao
  else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.substring(1)}`;
  }

  return `${cleaned}@s.whatsapp.net`; // Baileys requires this suffix
};