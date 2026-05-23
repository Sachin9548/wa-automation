import axios from 'axios';

export const verifyShopifyToken = async (shopUrl: string, token: string) => {
  try {
    // Shopify ka 'Shop' endpoint call karke check karte hain
    const response = await axios.get(`https://${shopUrl}/admin/api/2024-01/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': token,
      },
    });
    return response.status === 200; 
  } catch (error) {
    console.error("Shopify Verification Failed:", error);
    return false; 
  }
};