#!/usr/bin/env node
/**
 * Azure App Service startup wrapper
 * This ensures the server starts properly with correct logging
 */

console.log('[Startup] Starting Spot Buddy server...');
console.log('[Startup] Node version:', process.version);
console.log('[Startup] Environment:', process.env.NODE_ENV || 'development');
console.log('[Startup] Port:', process.env.PORT || process.env.WEBSITE_PORT || 8080);

// Set default port for Azure
if (!process.env.PORT && !process.env.WEBSITE_PORT) {
  process.env.PORT = '8080';
  console.log('[Startup] Set PORT to 8080 (Azure default)');
}

// Load and start the app
try {
  require('./src/index.js');
  console.log('[Startup] Application loaded successfully');
} catch (error) {
  console.error('[Startup] Failed to load application:', error);
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Startup] SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Startup] SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Startup] Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Startup] Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit on unhandled rejection, just log it
});

console.log('[Startup] Initialization complete');
