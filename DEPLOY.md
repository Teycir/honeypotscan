# 🚀 Cloudflare Deployment Guide

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

## Step 3: Set Environment Variables

```bash
# Set your Etherscan API keys as secrets
wrangler pages secret put ETHERSCAN_API_KEY_1
wrangler pages secret put ETHERSCAN_API_KEY_2
wrangler pages secret put ETHERSCAN_API_KEY_3
wrangler pages secret put ETHERSCAN_API_KEY_4
wrangler pages secret put ETHERSCAN_API_KEY_5
wrangler pages secret put ETHERSCAN_API_KEY_6
```

Enter each API key when prompted.

## Step 4: Build the Project

```bash
npm run build
```

## Step 5: Deploy to Cloudflare Pages

```bash
wrangler pages deploy out --project-name=honeypotscan
```

## Alternative: One-Command Deploy

```bash
npm run deploy
```

## Your Live URL

After deployment, your app will be available at:
- **Production**: `https://honeypotscan.pages.dev`
- **Custom Domain**: Configure in Cloudflare Dashboard

## Verify Deployment

```bash
# Check deployment status
wrangler pages deployment list --project-name=honeypotscan
```

## Update Deployment

To deploy updates:

```bash
npm run build
wrangler pages deploy out --project-name=honeypotscan
```

## Troubleshooting

### Issue: API Routes Not Working

Cloudflare Pages doesn't support Next.js API routes in static export mode.

**Solution:** Use Cloudflare Workers for API:

```bash
# Create a Worker for the API
cd /home/teycir/Repos/honeypotscan
mkdir -p workers
```

I'll create a Worker version if needed.

### Issue: Environment Variables Not Set

```bash
# List all secrets
wrangler pages secret list --project-name=honeypotscan

# Delete a secret
wrangler pages secret delete ETHERSCAN_API_KEY_1 --project-name=honeypotscan
```

## Next Steps

1. ✅ Deploy frontend to Cloudflare Pages
2. ⏳ Create Cloudflare Worker for API endpoint
3. ⏳ Connect Worker to Pages
4. ⏳ Add custom domain

---

**Note:** Since Next.js API routes don't work with static export, I'll create a separate Cloudflare Worker for the `/api/scan` endpoint.

Want me to create the Worker version? 🚀
