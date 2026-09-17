// src/utils/domainFinder.ts
import axios from 'axios';

export const resolveShopifyDomain = async (customUrl: string): Promise<string | null> => {
  try {
    // 1. URL ko theek format mein laao (agar 'https' nahi lagaya merchant ne)
    let url = customUrl.trim();
    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }

    // 2. Client ki website ka HTML code fetch karo
    const response = await axios.get(url);
    const htmlCode = response.data;

    // 3. Regex (Search Tool) se '.myshopify.com' dhoondho
    const match = htmlCode.match(/([a-zA-Z0-9\-]+\.myshopify\.com)/);

    if (match && match[1]) {
      console.log(`🔍 Original Shopify Domain Found: ${match[1]}`);
      return match[1]; // e.g. "sneakerhub.myshopify.com"
    }

    return null; // Agar website Shopify ki nahi hui
  } catch (error) {
    console.error(`❌ Failed to resolve domain for: ${customUrl}`);
    return null;
  }
};