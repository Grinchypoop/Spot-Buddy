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
});

// Initialize Telegram bot (don't block startup if it fails)
try {
  initializeTelegramBot();
} catch (error) {
  console.error('Telegram bot initialization failed:', error.message);
}

// Webhook endpoint for Telegram
app.post('/webhook', async (req, res) => {
  try {
    const bot = getBot();
    if (!bot) {
      console.warn('Bot not initialized, skipping webhook');
      res.status(200).send('ok');
      return;
    }

    // Log incoming updates for debugging
    if (req.body.message?.text) {
      console.log(`[Webhook] Received message: ${req.body.message.text}`);
    }

    await bot.handleUpdate(req.body);
    res.status(200).send('ok');
  } catch (error) {
    console.error('Error handling webhook:', error);
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
