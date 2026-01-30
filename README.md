# 🛡️ HoneypotScan

**Check if a token is a scam before you buy**

Free, fast, and accurate honeypot detection for Ethereum, Polygon, and Arbitrum smart contracts.

## ✨ Features

- 🚀 **Instant Results** - Scan in 2 seconds
- 🌐 **Multi-chain** - Ethereum, Polygon, Arbitrum
- 💾 **Smart Caching** - 95%+ cache hit rate
- 🔒 **Privacy First** - No tracking, no data collection
- 💰 **100% Free** - No limits, no API keys needed

## 🏗️ Architecture

```
Next.js 15 (App Router)
    ↓
Cloudflare Workers API
    ↓
Cloudflare KV (Cache)
    ↓
TypeScript Pattern Detector
    ↓
Etherscan API (6 keys with rotation)
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

## 📊 Detection Patterns

- ✅ `tx.origin` abuse in balanceOf/allowance/transfer
- ✅ Hidden fee functions (_taxPayer with tx.origin)
- ✅ _isSuper helper with tx.origin
- ✅ tx.origin in authentication (require/if/assert)
- ✅ Sell blocking logic (_isSuper recipient check)
- ✅ Asymmetric transfer restrictions
- ✅ Whitelist-only transfers
- ✅ Hidden sell taxes (95-100%)
- ✅ Requires 2+ patterns for detection (high confidence)

## 🔧 Environment Variables

```env
# Etherscan API Keys (6 keys for rotation)
ETHERSCAN_API_KEY_1=your-key-1
ETHERSCAN_API_KEY_2=your-key-2
ETHERSCAN_API_KEY_3=your-key-3
ETHERSCAN_API_KEY_4=your-key-4
ETHERSCAN_API_KEY_5=your-key-5
ETHERSCAN_API_KEY_6=your-key-6

# Cloudflare (for deployment)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
```

## 📈 Scaling

**Free Tier Capacity:**
- 100k requests/day (Cloudflare Workers)
- 100k reads/day (Cloudflare KV)
- 2.6M API calls/day (Etherscan)
- **With 95% cache hit: 2M scans/day**

**Cost: $0/month** 🎉

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: Cloudflare Workers
- **Cache**: Cloudflare KV
- **Scanner**: TypeScript (custom pattern detection)

## 📝 License

Business Source License 1.1 - see [LICENSE](LICENSE) file

**Additional Use Grant**: Non-production use is free. Production use requires a commercial license.

**Change Date**: 2030-01-30 (converts to MIT License)

## 👤 Author

**Teycir Ben Soltane**
- Website: [teycirbensoltane.tn](https://teycirbensoltane.tn)
- GitHub: [@Teycir](https://github.com/Teycir)

---

**Built with ❤️ using Next.js and Cloudflare**
