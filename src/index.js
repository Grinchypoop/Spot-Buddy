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

// Initialize Telegram bot asynchronously (non-blocking)
// The bot handlers are registered immediately, setup happens in background
try {
  console.log('Attempting to initialize Telegram bot...');
  initializeTelegramBot();
  console.log('Telegram bot initialized and handlers registered');
} catch (error) {
  console.error('Telegram bot initialization failed:', error.message);
  console.error('Bot error stack:', error.stack);
  // Don't exit - continue without the bot
}

// Webhook endpoint for Telegram (kept for backward compatibility but not used in polling mode)
app.post('/webhook', async (req, res) => {
  console.log('[Webhook] Incoming request received (polling mode - should not receive webhooks)');
  res.status(200).send('ok');
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

// Test endpoint to verify webhook URL is accessible
app.get('/webhook-test', (req, res) => {
  try {
    const bot = getBot();
    res.json({
      status: 'webhook_url_accessible',
      message: 'Webhook endpoint is accessible from the internet',
      botInitialized: !!bot,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[WebhookTest] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server on all interfaces (required for Azure)
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Mini-app available at http://localhost:${PORT}/mini-app`);
  console.log(`Webhook endpoint: /webhook`);
  console.log(`[Startup] Server is ready to receive requests`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('[Server] Error:', err);
});

module.exports = app;
