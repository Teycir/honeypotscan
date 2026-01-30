#!/bin/bash
set -e

echo "🚀 Promoting Latest Deployment to Production"
echo "============================================="

# Get latest deployment
LATEST_DEPLOYMENT=$(bash -c "source ~/.nvm/nvm.sh && npx wrangler pages deployment list --project-name=honeypotscan 2>/dev/null | grep -m1 'https://' | awk '{print \$1}'")

if [ -z "$LATEST_DEPLOYMENT" ]; then
    echo "❌ Could not find latest deployment"
    echo "Go to: https://dash.cloudflare.com/pages"
    echo "Navigate to: honeypotscan → Deployments"
    echo "Click: 'Promote to production' on latest deployment"
    exit 1
fi

echo "📦 Latest deployment: $LATEST_DEPLOYMENT"
echo ""
echo "To promote to production:"
echo "1. Go to: https://dash.cloudflare.com/pages"
echo "2. Click: honeypotscan"
echo "3. Click: Deployments tab"
echo "4. Find deployment: $LATEST_DEPLOYMENT"
echo "5. Click: '...' menu → 'Promote to production'"
echo ""
echo "Or use Cloudflare API (requires API token)"
