#!/bin/bash
set -e

echo "=== Starting Azure App Service Deployment ==="
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo ""
echo "=== Installing dependencies with npm ci ==="
npm ci --verbose

echo ""
echo "=== Verifying dotenv module is installed ==="
if [ -d "node_modules/dotenv" ]; then
  echo "✓ dotenv module found"
  ls -la node_modules/dotenv | head -5
else
  echo "✗ ERROR: dotenv module not found!"
  echo "Available modules:"
  ls -la node_modules/ 2>/dev/null | head -20
  exit 1
fi

echo ""
echo "=== Starting application ==="
npm start
