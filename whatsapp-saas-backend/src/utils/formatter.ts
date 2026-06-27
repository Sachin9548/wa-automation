// src/utils/formatter.ts
export const formatWhatsAppNumber = (phone: string): string | null => {
  if (!phone || phone === "NO_PHONE") return null;

  // Strip everything except digits
  let cleaned = phone.replace(/[^0-9]/g, '');

  // Indian 10-digit number → prefix 91
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  // 11-digit starting with 0 (landline style) → strip 0, prefix 91
  else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.substring(1)}`;
  }
  // Already has country code for India (91XXXXXXXXXX = 12 digits)
  else if (cleaned.length === 12 && cleaned.startsWith('91')) {
    // already correct
  }
  // International numbers — must be at least 10 digits with country code
  // Anything less than 10 digits total is invalid (e.g. test numbers like 555-555)
  
  // Final validation: must be 10–15 digits (E.164 range)
  if (cleaned.length < 10 || cleaned.length > 15) {
    console.warn(`⚠️ Invalid phone number rejected: "${phone}" → cleaned="${cleaned}" (${cleaned.length} digits)`);
    return null;
  }

  return `${cleaned}@s.whatsapp.net`;
};