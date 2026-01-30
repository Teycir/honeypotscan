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
Next.js 14 (App Router)
    ↓
Cloudflare Workers API
    ↓
D1 Database (Cache)
    ↓
Rust Scanner (from SCPF)
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

- ✅ `tx.origin` abuse in ERC20 functions
- ✅ Hidden fee functions
- ✅ Transfer restrictions
- ✅ Sell blocking logic
- ✅ Whitelist-only transfers
- ✅ Hidden sell taxes (95-100%)

## 🔧 Environment Variables

```env
# Etherscan API Keys (6 keys for rotation)
ETHERSCAN_API_KEY_1=your-key-1
ETHERSCAN_API_KEY_2=your-key-2
ETHERSCAN_API_KEY_3=your-key-3
ETHERSCAN_API_KEY_4=your-key-4
ETHERSCAN_API_KEY_5=your-key-5
ETHERSCAN_API_KEY_6=your-key-6
```

## 📈 Scaling

**Free Tier Capacity:**
- 100k requests/day (Cloudflare Workers)
- 5M database reads/day (D1)
- 2.6M API calls/day (Etherscan)
- **With 95% cache hit: 52M scans/day**

**Cost: $0/month** 🎉

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQLite)
- **Cache**: Cloudflare KV
- **Scanner**: Rust (from SmartContractPatternFinder)

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
