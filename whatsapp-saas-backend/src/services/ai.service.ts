// src/services/ai.service.ts
// AI Auto-Reply using Groq API (free tier — llama-3.1-8b-instant)

import Groq from 'groq-sdk';

const DEFAULT_FALLBACK = "Thank you for reaching out! 😊 Our team will connect with you shortly to help you. We typically respond within a few hours.";

const DEFAULT_SYSTEM_PROMPT = `You are a helpful WhatsApp customer support assistant for a business.
Your job is to answer customer questions professionally, warmly, and concisely.
Keep replies under 150 words — WhatsApp users prefer short messages.
Use simple language. Add relevant emojis sparingly.
IMPORTANT RULES:
- Only answer based on the business information provided
- If you don't know the answer or it's not in the business info — respond ONLY with: [FALLBACK]
- Never make up prices, policies, or information not provided
- Never mention that you are an AI
- Respond in the same language the customer used`;

export interface AIReplyResult {
  replied:    boolean;   // true = AI sent a reply, false = fallback used
  message:    string;    // the actual text sent/to be sent
  isFallback: boolean;   // true = fallback message was used
  tokensUsed?: number;
}

export const generateAIReply = async (
  customerMessage:  string,
  knowledgeBase:    string,
  brandName:        string,
  fallbackMessage?: string | null,
): Promise<AIReplyResult> => {

  const fallback = (fallbackMessage?.trim()) || DEFAULT_FALLBACK;

  // Basic guard — empty or very short messages (greetings, stickers etc.)
  const trimmed = customerMessage.trim();
  if (!trimmed || trimmed.length < 3) {
    return { replied: false, message: fallback, isFallback: true };
  }

  // Ignore media placeholders — AI can't handle these
  const mediaPlaceholders = ['[image]', '[video]', '[audio]', '[document]', '[sticker]', '[location]', '📷', '🎥', '🎤', '📄', '📍'];
  if (mediaPlaceholders.some(p => trimmed.toLowerCase().includes(p))) {
    return { replied: false, message: fallback, isFallback: true };
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    console.warn('⚠️ GROQ_API_KEY not set — AI auto-reply disabled');
    return { replied: false, message: fallback, isFallback: true };
  }

  try {
    const groq = new Groq({ apiKey: groqApiKey });

    const systemPrompt = [
      DEFAULT_SYSTEM_PROMPT,
      '',
      `=== BUSINESS INFORMATION FOR ${brandName.toUpperCase()} ===`,
      knowledgeBase?.trim() || 'No business information provided.',
      '=== END OF BUSINESS INFORMATION ===',
    ].join('\n');

    const completion = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',   // fast + free
      max_tokens:  200,
      temperature: 0.4,   // lower = more factual, less creative
      messages: [
        { role: 'system',    content: systemPrompt },
        { role: 'user',      content: trimmed },
      ],
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim() || '';
    const tokensUsed = completion.usage?.total_tokens;

    // AI explicitly said it can't answer
    if (!aiResponse || aiResponse.includes('[FALLBACK]') || aiResponse.length < 5) {
      console.log(`🤖 AI fallback triggered for: "${trimmed.substring(0, 50)}..."`);
      return { replied: true, message: fallback, isFallback: true, tokensUsed };
    }

    console.log(`🤖 AI reply generated (${tokensUsed} tokens): "${aiResponse.substring(0, 60)}..."`);
    return { replied: true, message: aiResponse, isFallback: false, tokensUsed };

  } catch (error: any) {
    console.error('❌ Groq API error:', error.message);
    // On API error — use fallback silently
    return { replied: false, message: fallback, isFallback: true };
  }
};
