# 🚀 Simple Deployment Steps

## Quick Deploy (5 minutes)

### 1. Install Wrangler
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
cd /home/teycir/Repos/honeypotscan
wrangler login
```

### 3. Create KV Namespace (for caching)
```bash
wrangler kv:namespace create CACHE
```

Copy the ID and update `worker/wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "paste-your-kv-id-here"
```

### 4. Deploy API Worker
```bash
cd worker
wrangler secret put ETHERSCAN_API_KEY_1
# Enter your first API key

wrangler secret put ETHERSCAN_API_KEY_2
# Enter your second API key
# ... repeat for all 6 keys

wrangler deploy
```

Note your Worker URL: `https://honeypotscan-api.YOUR-SUBDOMAIN.workers.dev`

### 5. Update Frontend API URL
Edit `app/page.tsx` line 23:
```typescript
const res = await fetch('https://honeypotscan-api.YOUR-SUBDOMAIN.workers.dev', {
```

### 6. Deploy Frontend
```bash
cd /home/teycir/Repos/honeypotscan
npm run build
wrangler pages deploy out --project-name=honeypotscan
```

## ✅ Done!

Your app is live at: `https://honeypotscan.pages.dev`

## Test It

```bash
curl -X POST https://honeypotscan-api.YOUR-SUBDOMAIN.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","chain":"ethereum"}'
```

## Troubleshooting

**Issue: Worker not found**
- Make sure you deployed the worker: `cd worker && wrangler deploy`

**Issue: API keys not working**
- Check secrets: `cd worker && wrangler secret list`
- Re-add: `wrangler secret put ETHERSCAN_API_KEY_1`

**Issue: CORS errors**
- Worker already has CORS headers configured
- Check browser console for actual error

## Update Deployment

```bash
# Update API
cd worker && wrangler deploy

# Update Frontend
cd /home/teycir/Repos/honeypotscan
npm run build
wrangler pages deploy out --project-name=honeypotscan
```

---

**Cost: $0/month** (Free tier handles 100k requests/day) 🎉
