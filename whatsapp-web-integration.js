// WhatsApp Web Integration - Real-time messaging without Facebook approval
const { Client, LocalAuth } = require('whatsapp-web.js');
const { getAIResponse } = require('./gemini-ai');

class WhatsAppWebClient {
  constructor() {
    // Create WhatsApp client with settings
    this.client = new Client({
      // LocalAuth saves your session so you don't need to scan QR every time
      authStrategy: new LocalAuth(),
      
      // Puppeteer settings (controls the browser)
      puppeteer: {
        headless: true, // true = browser runs invisibly in background
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

  setupEventHandlers() {
    // QR Code for authentication
    this.client.on('qr', (qr) => {
      console.log('📱 QR Code received!');
      console.log('');
      console.log('� QR Code Data:', qr);
      console.log('');
      console.log('📋 Instructions:');
      console.log('1. Open WhatsApp on your phone');
      console.log('2. Go to Settings > Linked Devices');
      console.log('3. Tap "Link a Device"');
      console.log('4. Scan the QR code from the browser window that opened');
      console.log('');
      console.log('⚠️  If browser didn\'t open, copy this QR data to a QR generator:');
      console.log(qr);
    });

    // Loading states
    this.client.on('loading_screen', (percent, message) => {
      console.log('⏳ Loading...', percent, message);
    });

    // Client ready
    this.client.on('ready', () => {
      console.log('✅ WhatsApp Web Client is ready!');
      console.log('🎉 You can now receive and send messages!');
      this.isReady = true;
    });

    // Incoming messages
    this.client.on('message', async (message) => {
      console.log('� NEW MESSAGE RECEIVED:');
      console.log('From:', message.from);
      console.log('Message:', message.body);
      console.log('Time:', new Date().toLocaleString());
      console.log('---');

      // Handle the message
      await this.handleIncomingMessage(message);
    });

    // Authentication success
    this.client.on('authenticated', () => {
      console.log('🔐 WhatsApp authenticated successfully!');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      console.error('❌ Authentication failed:', msg);
      console.log('💡 Try deleting the .wwebjs_auth folder and restart');
    });

    // Disconnected
    this.client.on('disconnected', (reason) => {
      console.log('📱 WhatsApp disconnected:', reason);
    });
  }

  async start() {
    try {
      console.log('🚀 Starting WhatsApp Web Client...');
      console.log('📱 A browser window will open for QR code scanning');
      console.log('');
      
      await this.client.initialize();
    } catch (error) {
      console.error('❌ Failed to start WhatsApp client:', error);
      console.log('');
      console.log('🔧 Troubleshooting:');
      console.log('1. Make sure Chrome/Chromium is installed');
      console.log('2. Try deleting .wwebjs_auth folder');
      console.log('3. Check if port 3000 is free');
    }
  }

  async sendMessage(phoneNumber, message) {
    if (!this.isReady) {
      console.log('⚠️  WhatsApp client not ready yet');
      return false;
    }

    try {
      // Format phone number
      let formattedNumber = phoneNumber;
      if (!phoneNumber.includes('@')) {
        // Remove + and add @c.us
        formattedNumber = phoneNumber.replace('+', '') + '@c.us';
      }
      
      // Send message with options to avoid errors
      await this.client.sendMessage(formattedNumber, message, {
        sendSeen: false  // Don't mark as seen to avoid the error
      });
      
      console.log(`✅ Message sent to ${phoneNumber}`);
      console.log(`📤 Message: ${message.substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error.message);
      
      // Try alternative method
      try {
        console.log('🔄 Trying alternative send method...');
        const chat = await this.client.getChatById(formattedNumber);
        await chat.sendMessage(message);
        console.log('✅ Message sent using alternative method!');
        return true;
      } catch (altError) {
        console.error('❌ Alternative method also failed:', altError.message);
        return false;
      }
    }
  }

  async handleIncomingMessage(message) {
    // Skip group messages and status updates
    if (message.from.includes('@g.us') || message.from.includes('status@broadcast')) {
      console.log('⏭️  Skipping group/status message');
      return;
    }

    const userMessage = message.body;
    const phoneNumber = message.from;
    const customerName = message._data.notifyName || 'Customer';

    console.log('🤖 Processing message with AI...');
    console.log(`👤 Customer: ${customerName}`);
    console.log(`💬 Message: "${userMessage}"`);

    // Get AI-powered response
    const response = await getAIResponse(userMessage, customerName);

    // Send response after a short delay (more natural)
    setTimeout(async () => {
      await this.sendMessage(phoneNumber, response);
      console.log('✅ AI Response sent!');
      console.log('');
    }, 1000);
  }

  async stop() {
    await this.client.destroy();
    console.log('🛑 WhatsApp client stopped');
  }
}

module.exports = WhatsAppWebClient;

// Test the client
if (require.main === module) {
  console.log('🎯 WhatsApp Restaurant Bot Starting...');
  console.log('');
  
  const whatsappClient = new WhatsAppWebClient();
  
  whatsappClient.start().catch(console.error);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down WhatsApp bot...');
    await whatsappClient.stop();
    process.exit(0);
  });
}