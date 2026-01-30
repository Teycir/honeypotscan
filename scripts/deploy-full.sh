#!/bin/bash

echo "🚀 Deploying HoneypotScan to Cloudflare..."
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found!"
    echo "   Install: npm install -g wrangler"
    exit 1
fi

# Check if logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler login
fi

echo "📦 Step 1: Building Next.js app..."
npm run build

echo ""
echo "☁️ Step 2: Deploying frontend to Cloudflare Pages..."
wrangler pages deploy out --project-name=honeypotscan

echo ""
echo "🔧 Step 3: Creating KV namespace for API cache..."
KV_ID=$(wrangler kv:namespace create CACHE --preview false | grep "id =" | cut -d'"' -f2)
echo "   KV Namespace ID: $KV_ID"

# Update worker wrangler.toml with KV ID
sed -i "s/your-kv-namespace-id/$KV_ID/" worker/wrangler.toml

echo ""
echo "🔑 Step 4: Setting API secrets..."
echo "   You'll need to enter your 6 Etherscan API keys"
cd worker
wrangler secret put ETHERSCAN_API_KEY_1
wrangler secret put ETHERSCAN_API_KEY_2
wrangler secret put ETHERSCAN_API_KEY_3
wrangler secret put ETHERSCAN_API_KEY_4
wrangler secret put ETHERSCAN_API_KEY_5
wrangler secret put ETHERSCAN_API_KEY_6

echo ""
echo "⚡ Step 5: Deploying API Worker..."
wrangler deploy

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your app is live at:"
echo "   Frontend: https://honeypotscan.pages.dev"
echo "   API: https://honeypotscan-api.<your-subdomain>.workers.dev"
echo ""
echo "📝 Next steps:"
echo "   1. Update frontend to use Worker API URL"
echo "   2. Add custom domain in Cloudflare Dashboard"
echo "   3. Test with: curl -X POST <api-url> -d '{\"address\":\"0x...\",\"chain\":\"ethereum\"}'"
