#!/bin/bash

set -e

echo "🚀 Deploying HoneypotScan to Cloudflare..."
echo ""

# Check wrangler
if ! command -v wrangler &> /dev/null; then
    echo "❌ Install wrangler: npm install -g wrangler"
    exit 1
fi

# Check login
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Logging in to Cloudflare..."
    wrangler login
fi

# Load API keys from .env.local
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    exit 1
fi

source .env.local

echo "📦 Step 1: Building frontend..."
npm run build

echo ""
echo "☁️ Step 2: Deploying frontend..."
wrangler pages deploy out --project-name=honeypotscan

echo ""
echo "🔧 Step 3: Creating KV namespace..."
KV_OUTPUT=$(wrangler kv:namespace create CACHE 2>&1 || echo "exists")
if [[ $KV_OUTPUT == *"id ="* ]]; then
    KV_ID=$(echo "$KV_OUTPUT" | grep "id =" | cut -d'"' -f2)
    sed -i "s/your-kv-namespace-id/$KV_ID/" worker/wrangler.toml
    echo "   Created KV: $KV_ID"
else
    echo "   KV namespace already exists"
fi

echo ""
echo "🔑 Step 4: Setting API secrets..."
cd worker

for i in {1..6}; do
    KEY_VAR="ETHERSCAN_API_KEY_$i"
    KEY_VALUE="${!KEY_VAR}"
    if [ -n "$KEY_VALUE" ]; then
        echo "$KEY_VALUE" | wrangler secret put "$KEY_VAR" > /dev/null 2>&1
        echo "   ✓ Set $KEY_VAR"
    fi
done

echo ""
echo "⚡ Step 5: Deploying API Worker..."
wrangler deploy

WORKER_URL=$(wrangler deployments list 2>&1 | grep -o 'https://[^ ]*' | head -1 || echo "")

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 URLs:"
echo "   Frontend: https://honeypotscan.pages.dev"
if [ -n "$WORKER_URL" ]; then
    echo "   API: $WORKER_URL"
fi
echo ""
echo "📝 Update app/page.tsx with your Worker URL"
