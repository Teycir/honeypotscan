# 🛡️ HoneypotScan

**Check if a token is a scam before you buy**

Free, fast, and accurate honeypot detection for Ethereum, Polygon, and Arbitrum smart contracts.

[![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)](https://github.com/Teycir/honeypotscan)
[![License](https://img.shields.io/badge/license-BSL%201.1-green.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)

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

### Local Development

```bash
# Clone the repository
git clone https://github.com/Teycir/honeypotscan.git
cd honeypotscan

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
# Open http://localhost:3000

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

### API Usage

```bash
# Scan a token contract
curl "https://your-worker.workers.dev/api/scan?address=0x...&chain=ethereum"

# Response format
{
  "isHoneypot": true,
  "confidence": "high",
  "patterns": ["tx.origin abuse", "hidden fees"],
  "riskScore": 85,
  "cached": false
}
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

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4, Framer Motion
- **Backend**: Cloudflare Workers
- **Cache**: Cloudflare KV
- **Scanner**: TypeScript (custom pattern detection)
- **APIs**: Etherscan, Polygonscan, Arbiscan
- **Deployment**: Cloudflare Pages + Workers

## 🧪 Testing

```bash
# Run contract scanner tests
npm run test:scan

# Test specific contract
tsx test/scan-contracts.ts 0x...

# Debug pattern detection
tsx test/debug-pattern.ts
```

## 📚 Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Deployment Guide](docs/DEPLOY.md)
- [Project Summary](docs/PROJECT_SUMMARY.md)
- [Changelog](CHANGELOG.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

Business Source License 1.1 - see [LICENSE](LICENSE) file

**Additional Use Grant**: Non-production use is free. Production use requires a commercial license.

**Change Date**: 2030-01-30 (converts to MIT License)

## ⚠️ Disclaimer

This tool is provided for informational purposes only. Always do your own research (DYOR) before investing in any cryptocurrency or token. HoneypotScan is not financial advice.

## 👤 Author

**Teycir Ben Soltane**
- Website: [teycirbensoltane.tn](https://teycirbensoltane.tn)
- GitHub: [@Teycir](https://github.com/Teycir)

---

**Built with ❤️ using Next.js and Cloudflare**
