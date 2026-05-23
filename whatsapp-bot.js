/**
 * ============================================================================
 * WHATSAPP BUSINESS BOT - LEARNING VERSION
 * ============================================================================
 * 
 * This file contains a complete WhatsApp bot with detailed comments
 * to help you understand how everything works.
 * 
 * KEY CONCEPTS:
 * 1. WhatsApp Web Integration - Uses same protocol as WhatsApp Web in browser
 * 2. Session Management - Saves login so you don't need to scan QR again
 * 3. Event-Driven - Responds to events (messages, QR code, etc.)
 * 4. Message Handling - Receives and sends messages automatically
 * 
 * FLOW:
 * Business Owner → Scans QR → Bot Connected → Customer Messages → Bot Responds
 * ============================================================================
 */

// Import required libraries
const { Client, LocalAuth } = require('whatsapp-web.js');

/**
 * WhatsAppWebClient Class
 * 
 * This is the main class that handles all WhatsApp functionality.
 * Think of it as your WhatsApp bot's brain.
 */
class WhatsAppWebClient {
  
  /**
   * Constructor - Runs when you create a new bot
   * 
   * Sets up the WhatsApp client with configuration
   */
  constructor() {
    // Create WhatsApp client with settings
    this.client = new Client({
      // LocalAuth saves your session so you don't need to scan QR every time
      authStrategy: new LocalAuth(),
      
      // Puppeteer settings (controls the browser)
      puppeteer: {
        headless: false, // false = show browser, true = hide browser
        args: [
          '--no-sandbox',                    // Security setting
          '--disable-setuid-sandbox',        // Security setting
          '--disable-dev-shm-usage',         // Memory optimization
          '--disable-accelerated-2d-canvas', // Performance
          '--no-first-run',                  // Skip first run screens
          '--no-zygote',                     // Process management
          '--disable-gpu'                    // Disable GPU (not needed)
        ]
      }
    });
    
    // Track if bot is ready to send messages
    this.isReady = false;
    
    // Set up all event listeners (what happens when things occur)
    this.setupEventHandlers();
  }

  /**
   * Setup Event Handlers
   * 
   * This function sets up "listeners" for different events.
   * Think of it like: "When X happens, do Y"
   */
  setupEventHandlers() {
    
    // ========================================================================
    // EVENT 1: QR Code Generated
    // ========================================================================
    // This happens when you need to scan QR code to connect WhatsApp
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code received!');
      console.log('');
      console.log('🔗 QR Code Data:', qr);
      console.log('');
      console.log('📋 Instructions:');
      console.log('1. Open WhatsApp on your phone');
      console.log('2. Go to Settings > Linked Devices');
      console.log('3. Tap "Link a Device"');
      console.log('4. Scan the QR code from the browser window');
      console.log('');
      console.log('⚠️  Note: You only need to do this ONCE!');
      console.log('   After scanning, the session is saved forever.');
    });

    // ========================================================================
    // EVENT 2: Loading Screen
    // ========================================================================
    // Shows progress while WhatsApp is connecting
    this.client.on('loading_screen', (percent, message) => {
      console.log(`⏳ Loading... ${percent}% - ${message}`);
    });

    // ========================================================================
    // EVENT 3: Client Ready
    // ========================================================================
    // This happens when WhatsApp is fully connected and ready
    this.client.on('ready', () => {
      console.log('');
      console.log('✅ ============================================');
      console.log('✅ WhatsApp Web Client is READY!');
      console.log('✅ Bot is now active and listening for messages');
      console.log('✅ ============================================');
      console.log('');
      
      // Mark bot as ready
      this.isReady = true;
    });

    // ========================================================================
    // EVENT 4: Incoming Messages
    // ========================================================================
    // This is the MOST IMPORTANT event - runs when someone sends a message
    this.client.on('message', async (message) => {
      console.log('');
      console.log('📱 ============================================');
      console.log('📱 NEW MESSAGE RECEIVED!');
      console.log('📱 ============================================');
      console.log('From:', message.from);
      console.log('Message:', message.body);
      console.log('Time:', new Date().toLocaleString());
      console.log('============================================');
      console.log('');

      // Process the message and send response
      await this.handleIncomingMessage(message);
    });

    // ========================================================================
    // EVENT 5: Authentication Success
    // ========================================================================
    // Runs when QR code is scanned successfully
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp authenticated successfully!');
      console.log('💾 Session saved - no need to scan QR again');
    });

    // ========================================================================
    // EVENT 6: Authentication Failure
    // ========================================================================
    // Runs if QR code scanning fails
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      console.log('');
      console.log('💡 Troubleshooting:');
      console.log('1. Delete .wwebjs_auth folder');
      console.log('2. Restart the bot');
      console.log('3. Scan QR code again');
    });

    // ========================================================================
    // EVENT 7: Disconnected
    // ========================================================================
    // Runs if WhatsApp disconnects
    this.client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp disconnected:', reason);
      console.log('🔄 Bot will try to reconnect automatically...');
    });
  }

  /**
   * Start the Bot
   * 
   * This function starts the WhatsApp client and connects to WhatsApp Web
   */
  async start() {
    try {
      console.log('');
      console.log('🚀 ============================================');
      console.log('🚀 Starting WhatsApp Bot...');
      console.log('🚀 ============================================');
      console.log('📱 A browser window will open for QR code');
      console.log('⏳ Please wait...');
      console.log('');
      
      // Initialize the WhatsApp client
      await this.client.initialize();
      
    } catch (error) {
      console.error('❌ Failed to start WhatsApp bot:', error);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Make sure Chrome/Chromium is installed');
      console.log('2. Try deleting .wwebjs_auth folder');
      console.log('3. Check internet connection');
      console.log('4. Make sure port 3000 is not in use');
    }
  }

  /**
   * Send Message
   * 
   * This function sends a WhatsApp message to a phone number
   * 
   * @param {string} phoneNumber - Phone number in format: +919876543210
   * @param {string} message - The message text to send
   * @returns {boolean} - true if sent successfully, false if failed
   */
  async sendMessage(phoneNumber, message) {
    // Check if bot is ready
    if (!this.isReady) {
      console.log('⚠️  Bot is not ready yet. Please wait...');
      return false;
    }

    try {
      // Format phone number for WhatsApp
      // WhatsApp uses format: 919876543210@c.us
      let formattedNumber = phoneNumber;
      if (!phoneNumber.includes('@')) {
        // Remove + sign and add @c.us
        formattedNumber = phoneNumber.replace('+', '') + '@c.us';
      }
      
      // Send the message
      await this.client.sendMessage(formattedNumber, message);
      
      console.log('✅ Message sent successfully!');
      console.log(`📤 To: ${phoneNumber}`);
      console.log(`📝 Message: ${message.substring(0, 50)}...`);
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to send message:', error.message);
      return false;
    }
  }

  /**
   * Handle Incoming Message
   * 
   * This is the BRAIN of the bot - decides how to respond to messages
   * 
   * @param {object} message - The message object from WhatsApp
   */
  async handleIncomingMessage(message) {
    
    // ========================================================================
    // STEP 1: Filter out unwanted messages
    // ========================================================================
    
    // Skip group messages (we only want 1-on-1 chats)
    if (message.from.includes('@g.us')) {
      console.log('⏭️  Skipping group message');
      return;
    }
    
    // Skip status updates
    if (message.from.includes('status@broadcast')) {
      console.log('⏭️  Skipping status update');
      return;
    }

    // ========================================================================
    // STEP 2: Extract message details
    // ========================================================================
    
    const userMessage = message.body.toLowerCase(); // Convert to lowercase for easy matching
    const phoneNumber = message.from;               // Customer's phone number
    const customerName = message._data.notifyName || 'Customer'; // Customer's name

    console.log('🤖 Processing message...');
    console.log(`👤 Customer: ${customerName}`);
    console.log(`📱 Phone: ${phoneNumber}`);
    console.log(`💬 Message: "${message.body}"`);

    // ========================================================================
    // STEP 3: Generate Response (Bot Logic)
    // ========================================================================
    
    let response = ''; // This will store the bot's response

    // GREETING MESSAGES
    if (userMessage.includes('hi') || 
        userMessage.includes('hello') || 
        userMessage.includes('hey')) {
      
      response = `Hello ${customerName}! 👋 Welcome to our restaurant!

🍽️ Today's Special Menu:
1. 🍕 Margherita Pizza - ₹299
2. 🍔 Chicken Burger - ₹199  
3. 🍝 Pasta Alfredo - ₹249
4. 🥗 Caesar Salad - ₹149

Type "menu" for full menu or item name to order!`;
    }
    
    // MENU REQUEST
    else if (userMessage.includes('menu')) {
      
      response = `🍽️ Our Complete Menu:

🍕 PIZZAS:
• Margherita - ₹299
• Pepperoni - ₹349
• Veggie Supreme - ₹329

🍔 BURGERS:
• Chicken Burger - ₹199
• Veg Burger - ₹149
• Cheese Burger - ₹179

🍝 PASTA:
• Alfredo - ₹249
• Marinara - ₹229
• Pesto - ₹269

🥗 SALADS:
• Caesar - ₹149
• Greek - ₹129

What would you like to order? 😊`;
    }
    
    // PIZZA ORDER
    else if (userMessage.includes('pizza') || userMessage.includes('margherita')) {
      
      response = `🍕 Excellent choice! Margherita Pizza

💰 Price: ₹299
⏰ Prep time: 15-20 minutes
🚚 Delivery: 30-40 minutes

✅ Your order is confirmed!
📱 Order ID: #${Date.now().toString().slice(-6)}

We'll call you when it's ready!
Thank you ${customerName}! 🙏`;
    }
    
    // BURGER ORDER
    else if (userMessage.includes('burger')) {
      
      response = `🍔 Great choice! Chicken Burger

💰 Price: ₹199
⏰ Prep time: 10-15 minutes
🚚 Delivery: 25-35 minutes

✅ Your order is confirmed!
📱 Order ID: #${Date.now().toString().slice(-6)}

We'll notify you when it's ready!
Thank you ${customerName}! 🙏`;
    }
    
    // PASTA ORDER
    else if (userMessage.includes('pasta')) {
      
      response = `🍝 Perfect! Pasta Alfredo

💰 Price: ₹249
⏰ Prep time: 12-18 minutes
🚚 Delivery: 30-40 minutes

✅ Your order is confirmed!
📱 Order ID: #${Date.now().toString().slice(-6)}

We'll keep you updated!
Thank you ${customerName}! 🙏`;
    }
    
    // PRICE INQUIRY
    else if (userMessage.includes('price') || userMessage.includes('cost')) {
      
      response = `💰 Our Pricing:

🍕 Pizzas: ₹299 - ₹349
🍔 Burgers: ₹149 - ₹199
🍝 Pasta: ₹229 - ₹269
🥗 Salads: ₹129 - ₹149

🚚 Free delivery above ₹500
💳 We accept cash and online payments

What would you like to order?`;
    }
    
    // DEFAULT RESPONSE (when bot doesn't understand)
    else {
      
      response = `I'm here to help! 😊

You can:
• Type "hi" for welcome message
• Type "menu" to see our full menu
• Type item names like "pizza", "burger", "pasta"
• Ask about "prices"
• Place orders directly

What would you like to know? 🤔`;
    }

    // ========================================================================
    // STEP 4: Send Response
    // ========================================================================
    
    console.log('🤖 Sending response...');
    
    // Wait 1 second before responding (makes it feel more natural)
    setTimeout(async () => {
      await this.sendMessage(phoneNumber, response);
      console.log('✅ Response sent!');
      console.log('');
    }, 1000);
  }

  /**
   * Stop the Bot
   * 
   * Gracefully shuts down the WhatsApp client
   */
  async stop() {
    console.log('🛑 Stopping WhatsApp bot...');
    await this.client.destroy();
    console.log('✅ Bot stopped successfully');
  }
}

// ============================================================================
// EXPORT & RUN
// ============================================================================

// Export the class so it can be used in other files
module.exports = WhatsAppWebClient;

// If this file is run directly (not imported), start the bot
if (require.main === module) {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          🤖 WHATSAPP RESTAURANT BOT STARTING 🤖           ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Create new bot instance
  const whatsappBot = new WhatsAppWebClient();
  
  // Start the bot
  whatsappBot.start().catch(console.error);
  
  // Handle Ctrl+C to stop bot gracefully
  process.on('SIGINT', async () => {
    console.log('');
    console.log('🛑 Shutting down WhatsApp bot...');
    await whatsappBot.stop();
    process.exit(0);
  });
}

/**
 * ============================================================================
 * LEARNING NOTES
 * ============================================================================
 * 
 * 1. EVENT-DRIVEN PROGRAMMING:
 *    - The bot waits for events (messages, QR code, etc.)
 *    - When event happens, corresponding function runs
 *    - This is called "event-driven" or "reactive" programming
 * 
 * 2. ASYNC/AWAIT:
 *    - Used for operations that take time (sending messages, etc.)
 *    - "async" marks a function as asynchronous
 *    - "await" waits for async operation to complete
 * 
 * 3. SESSION MANAGEMENT:
 *    - LocalAuth saves your WhatsApp session
 *    - Stored in .wwebjs_auth folder
 *    - No need to scan QR code every time
 * 
 * 4. MESSAGE HANDLING:
 *    - Bot receives message → Analyzes text → Generates response → Sends back
 *    - Currently uses simple keyword matching
 *    - Next: We'll add AI for smarter responses
 * 
 * 5. PHONE NUMBER FORMAT:
 *    - WhatsApp uses: countrycode + number + @c.us
 *    - Example: 919876543210@c.us (India)
 *    - Bot automatically formats it for you
 * 
 * ============================================================================
 * NEXT STEPS
 * ============================================================================
 * 
 * Phase 2: Add Gemini AI
 * - Replace keyword matching with AI
 * - Understand natural language
 * - Context-aware conversations
 * - Learn from business knowledge base
 * 
 * Phase 3: Multi-Business Support
 * - Support multiple businesses
 * - Each business gets own session
 * - Separate menus and responses
 * 
 * Phase 4: Web Dashboard
 * - View conversations
 * - Manage orders
 * - Analytics
 * - Settings
 * 
 * ============================================================================
 */