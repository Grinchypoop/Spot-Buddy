require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initializeTelegramBot, getBot } = require('./bot/telegram');
const { initializeDatabase } = require('./db/supabase');
const apiRoutes = require('./api/routes');

const app = express();
// Azure uses port 8080 by default, fallback to 3000 for local development
const PORT = process.env.PORT || process.env.WEBSITE_PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Initialize database (don't block startup if it fails)
initializeDatabase().catch(err => {
  console.error('Database initialization failed:', err.message);
  console.error('Database error stack:', err.stack);
});

// Initialize Telegram bot immediately and synchronously
// This ensures the bot is ready before the server starts accepting requests
try {
  console.log('Attempting to initialize Telegram bot...');
  initializeTelegramBot();
  console.log('Telegram bot initialized successfully');

  // Set up bot commands and webhook in the background (non-blocking)
  // This part can take time without blocking the server from starting
  (async () => {
    try {
      // Wait a bit to ensure bot is fully set up before trying to configure it
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Bot background setup error:', error.message);
    }
  })();
} catch (error) {
  console.error('Telegram bot initialization failed:', error.message);
  console.error('Bot error stack:', error.stack);
}

// Webhook endpoint for Telegram
app.post('/webhook', async (req, res) => {
  console.log('[Webhook] Incoming request received');
  try {
    const bot = getBot();
    if (!bot) {
      console.error('[Webhook] ERROR: Bot not initialized when webhook arrived!');
      res.status(200).send('ok');
      return;
    }

    // Log incoming updates for debugging
    console.log('[Webhook] Bot is initialized, processing update');
    if (req.body.message?.text) {
      console.log(`[Webhook] Received message: ${req.body.message.text}`);
    }
    if (req.body.callback_query) {
      console.log(`[Webhook] Received callback query`);
    }

    await bot.handleUpdate(req.body);
    console.log('[Webhook] Update handled successfully');
    res.status(200).send('ok');
  } catch (error) {
    console.error('[Webhook] Error handling webhook:', error.message);
    console.error('[Webhook] Error stack:', error.stack);
    res.status(500).send('error');
  }
});

// API Routes
app.use('/api', apiRoutes);

// Serve mini-app
app.get('/mini-app', (req, res) => {
  res.sendFile(__dirname + '/../public/mini-app/index.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server on all interfaces (required for Azure)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mini-app available at http://localhost:${PORT}/mini-app`);
  console.log(`Webhook endpoint: /webhook`);
});

module.exports = app;
