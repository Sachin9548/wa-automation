/**
 * Gemini AI Integration
 * Makes the bot understand natural language and respond intelligently
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Your Gemini API configuration
const API_KEY = 'AIzaSyBu4hmAbIXGniso02iChotQZXkwCv_ZX7M';
const MODEL_NAME = 'gemini-1.5-flash';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Restaurant Knowledge Base
 * This is what the AI knows about your business
 */
const RESTAURANT_KNOWLEDGE = `
You are a helpful restaurant assistant for "Mario's Pizza Restaurant".

OUR MENU:
🍕 PIZZAS:
- Margherita Pizza: ₹299 (Classic tomato, mozzarella, basil)
- Pepperoni Pizza: ₹349 (Spicy pepperoni, cheese)
- Veggie Supreme Pizza: ₹329 (Mixed vegetables, cheese)

🍔 BURGERS:
- Chicken Burger: ₹199 (Grilled chicken, lettuce, mayo)
- Veg Burger: ₹149 (Veggie patty, fresh veggies)
- Cheese Burger: ₹179 (Beef patty, cheese, pickles)

🍝 PASTA:
- Pasta Alfredo: ₹249 (Creamy white sauce)
- Pasta Marinara: ₹229 (Tomato basil sauce)
- Pasta Pesto: ₹269 (Basil pesto sauce)

🥗 SALADS:
- Caesar Salad: ₹149 (Lettuce, croutons, caesar dressing)
- Greek Salad: ₹129 (Feta, olives, cucumber)

BUSINESS INFO:
- Delivery: 30-40 minutes
- Free delivery above ₹500
- Payment: Cash and online
- Open: 11 AM - 11 PM daily
- Location: Mumbai, India

IMPORTANT RULES:
1. Be friendly and helpful
2. If customer asks about items NOT on menu (like tshirts, phones, etc), politely say we're a restaurant
3. When customer orders, confirm the item and price
4. Keep responses short and clear (max 3-4 lines)
5. Use emojis to make it friendly
6. Always end with asking if they need anything else
`;

/**
 * Get AI Response
 * Sends customer message to Gemini and gets intelligent response
 */
async function getAIResponse(customerMessage, customerName = 'Customer') {
  try {
    // Create the AI model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Create the prompt with context
    const prompt = `${RESTAURANT_KNOWLEDGE}

Customer Name: ${customerName}
Customer Message: "${customerMessage}"

Respond as the restaurant assistant. Be helpful, friendly, and concise.`;

    // Get AI response
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiMessage = response.text();

    console.log('🤖 AI Response generated successfully');
    return aiMessage;

  } catch (error) {
    console.error('❌ AI Error:', error.message);
    
    // Fallback response if AI fails
    return `I'm here to help! 😊

You can:
• Type "menu" to see our full menu
• Ask about any dish
• Place an order by typing the item name

What would you like to know?`;
  }
}

module.exports = {
  getAIResponse
};
