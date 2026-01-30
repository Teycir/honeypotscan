#!/bin/bash

# Purge Cloudflare Pages cache
echo "🔄 Purging Cloudflare cache..."

# Method 1: Purge everything via Cloudflare API (requires API token)
# curl -X POST "https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache" \
#   -H "Authorization: Bearer YOUR_API_TOKEN" \
#   -H "Content-Type: application/json" \
#   --data '{"purge_everything":true}'

# Method 2: Add cache-busting query param to force new deployment
echo "✅ To force cache refresh:"
echo "1. Go to Cloudflare Pages dashboard"
echo "2. Click 'Deployments' tab"
echo "3. Find latest deployment and click 'Retry deployment'"
echo ""
echo "OR use cache-busting URL:"
echo "https://honeypotscan.pages.dev/?v=$(date +%s)"
echo ""
echo "OR wait for cache to expire (7 days max)"
