#!/bin/bash

echo "🧪 Testing HoneypotScan..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "   Run: cp .env.example .env.local"
    echo "   Then add your Etherscan API keys"
    exit 1
fi

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start dev server in background
echo "🚀 Starting dev server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Test the API
echo ""
echo "🧪 Testing API with USDT contract (safe)..."
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum"}' \
  | jq '.'

echo ""
echo "✅ Test complete!"
echo ""
echo "🌐 Open http://localhost:3000 in your browser"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for user to stop
wait $DEV_PID
