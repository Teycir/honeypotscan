<p align="center">
  <img src="public/icon-192.png" alt="HoneypotScan Logo" width="128" height="128">
</p>

<h1 align="center">🛡️ HoneypotScan</h1>

<p align="center">
  <strong>Check if a token is a scam before you buy</strong>
</p>

<p align="center">
  Free, fast, and accurate honeypot detection for Ethereum, Polygon, and Arbitrum smart contracts.
</p>

<p align="center">
  <a href="https://github.com/Teycir/honeypotscan"><img src="https://img.shields.io/badge/version-0.2.0-blue.svg" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-BSL%201.1-green.svg" alt="License"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black.svg" alt="Next.js"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue.svg" alt="React"></a>
</p>

---

## 🍯 What Are Honeypot Tokens?

**We hunt honeypots.** A honeypot token is a malicious smart contract designed to steal your money. It lets you buy tokens freely, but when you try to sell—your transaction fails. Your funds are trapped forever.

### How Honeypots Work

Scammers embed hidden logic in the token's smart contract code:
- **Sell blockers** - Only whitelisted addresses (the scammer) can sell
- **Hidden taxes** - 95-100% sell tax drains your tokens
- **tx.origin tricks** - Contract checks if you're the original buyer and blocks resale
- **Dynamic blacklists** - Your address gets blacklisted after buying

### The Risks

- 💸 **Total loss of funds** - Once trapped, there's no way out
- 🎭 **Fake legitimacy** - Honeypots often mimic real projects with copied websites and social media
- ⚡ **Speed** - Scammers launch, pump, and abandon tokens within hours
- 📈 **Rising threat** - Thousands of new honeypot tokens are deployed daily

### ⚠️ Important: This Is NOT a Full Security Audit

HoneypotScan is **specialized for honeypot detection only**. We do not scan for:
- Reentrancy vulnerabilities
- Flash loan exploits
- Ownership/admin risks
- Liquidity rug pulls
- Other smart contract vulnerabilities

For comprehensive security audits, consult professional auditors. HoneypotScan answers one question: **"Can I sell this token after I buy it?"**

## ✨ Features

- 🚀 **Instant Results** - Scan in 2 seconds
- 🌐 **Multi-chain** - Ethereum, Polygon, Arbitrum
- 💾 **Smart Caching** - 95%+ cache hit rate
- 🔒 **Privacy First** - No tracking, no data collection
- 💰 **100% Free** - No limits, no API keys needed
- 🎯 **High Accuracy** - Pattern-based detection with confidence scoring
- 📱 **Mobile Friendly** - Responsive design works on any device

## 🎯 Use Cases

- **Traders** - Verify tokens before buying on DEXs like Uniswap or SushiSwap
- **Investors** - Due diligence on new token launches and presales
- **Developers** - Audit smart contracts for common honeypot patterns
- **Communities** - Protect group members from scam tokens
- **Researchers** - Analyze honeypot trends across different chains

## 🏗️ Architecture

```
Next.js 16 (App Router)
    ↓
Cloudflare Workers API
    ↓
Cloudflare KV (Cache)
    ↓
TypeScript Pattern Detector
    ↓
Etherscan API (6 keys with rotation)
    ↓
Ethereum, Polygon, and Arbitrum
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

- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Framer Motion
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

## ❓ FAQ

<details>
<summary><strong>What is a honeypot token?</strong></summary>

A honeypot is a scam token designed to let you buy but prevent you from selling. Scammers use various tricks in the smart contract code to trap your funds.
</details>

<details>
<summary><strong>How accurate is HoneypotScan?</strong></summary>

HoneypotScan uses pattern-based detection requiring 2+ suspicious patterns for high confidence results. While highly accurate, no scanner is 100% foolproof—always DYOR.
</details>

<details>
<summary><strong>Which blockchains are supported?</strong></summary>

Currently: Ethereum, Polygon, and Arbitrum. More chains coming soon.
</details>

<details>
<summary><strong>Is there a rate limit?</strong></summary>

No rate limits for normal use. The smart caching system handles high traffic efficiently.
</details>

<details>
<summary><strong>Can honeypots still slip through?</strong></summary>

Yes, sophisticated scammers may use novel techniques. HoneypotScan is a tool to help, not a guarantee. Always verify with multiple sources.
</details>

## 🌐 Other Projects

Check out these other privacy-focused tools:

| Project | Description |
|---------|-------------|
| [TimeSeal.online](https://timeseal.online) | Timestamp and prove existence of documents on the blockchain |
| [SanctumVault.online](https://sanctumvault.online) | Secure encrypted file storage and sharing |
| [Ghost-Chat](https://ghost-chat.pages.dev) | Anonymous encrypted messaging |

## ⚠️ Disclaimer

This tool is provided for informational purposes only. Always do your own research (DYOR) before investing in any cryptocurrency or token. HoneypotScan is not financial advice.

## 👤 Author

**Teycir Ben Soltane**
- Website: [teycirbensoltane.tn](https://teycirbensoltane.tn)
- GitHub: [@Teycir](https://github.com/Teycir)

---

## 💼 Hire Me

Need a custom blockchain tool, security scanner, or web application? I'm available for freelance projects.

**Services I offer:**
- Smart contract analysis tools
- DeFi dashboards and trading interfaces
- Privacy-focused web applications
- Cloudflare Workers & edge computing solutions
- Full-stack Next.js development

<p align="center">
  <a href="https://teycirbensoltane.tn"><strong>🚀 Let's Work Together → teycirbensoltane.tn</strong></a>
</p>

---

<p align="center">
  <strong>Built with ❤️ using Next.js and Cloudflare</strong>
</p>
