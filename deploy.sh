#!/bin/bash

echo "🚀 Deploying HoneypotScan to Cloudflare Pages..."

# Build Next.js app
echo "📦 Building Next.js app..."
npm run build

# Deploy to Cloudflare Pages
echo "☁️ Deploying to Cloudflare..."
npx wrangler pages deploy .next --project-name=honeypotscan

echo "✅ Deployment complete!"
echo "🌐 Your app is live at: https://honeypotscan.pages.dev"
