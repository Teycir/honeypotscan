#!/bin/bash
set -e

echo "🚀 HoneypotScan Deployment Script"
echo "=================================="

# Check if logged in
if ! npx wrangler whoami &>/dev/null; then
    echo "❌ Not logged in to Cloudflare"
    echo "Run: npx wrangler login"
    exit 1
fi

# Check environment variables
if [ -z "$ETHERSCAN_API_KEY_1" ]; then
    echo "⚠️  ETHERSCAN_API_KEY_1 not set"
    echo "Set in Cloudflare Pages dashboard or .env.local"
fi

# Build
echo "🔨 Building..."
npm run build

# Deploy
echo "📦 Deploying to Cloudflare Pages..."
npx wrangler pages deploy out --project-name=honeypotscan

echo "✅ Deployment complete!"
echo "🌐 Live at: https://honeypotscan.pages.dev"
echo "📊 Dashboard: https://dash.cloudflare.com/pages"
