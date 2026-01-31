#!/bin/bash

# HoneypotScan v0.3.1 Release Script
# This script helps prepare and create a GitHub release

set -e

VERSION="0.3.1"
TAG="v${VERSION}"
RELEASE_DATE="2026-02-02"

echo "🚀 Preparing HoneypotScan ${TAG} Release"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the project root."
    exit 1
fi

# Check if version matches
PACKAGE_VERSION=$(node -p "require('./package.json').version")
if [ "$PACKAGE_VERSION" != "$VERSION" ]; then
    echo "❌ Error: package.json version ($PACKAGE_VERSION) doesn't match release version ($VERSION)"
    exit 1
fi

echo "✅ Version check passed: ${VERSION}"
echo ""

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    echo ""
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📝 Release Information:"
echo "----------------------"
echo "Version: ${VERSION}"
echo "Tag: ${TAG}"
echo "Date: ${RELEASE_DATE}"
echo ""

# Create git tag
echo "🏷️  Creating git tag..."
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️  Tag ${TAG} already exists"
    read -p "Delete and recreate? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$TAG"
        echo "✅ Deleted existing tag"
    else
        echo "❌ Aborted"
        exit 1
    fi
fi

git tag -a "$TAG" -m "Release ${TAG}"
echo "✅ Created tag: ${TAG}"
echo ""

# Show release notes
echo "📋 Release Notes Preview:"
echo "========================"
cat << 'EOF'

# 🚀 HoneypotScan v0.3.1

## 📚 Documentation & SEO Enhancement Release

This release focuses on improving project documentation, GitHub discoverability, and providing comprehensive educational resources.

### ✨ What's New

**Enhanced Documentation:**
- Comprehensive README with security architecture and detection algorithm details
- GitHub SEO optimization guide for maximum visibility
- Detailed explanations of all 13 honeypot patterns with code examples
- FAQ section with accuracy statistics (98% sensitivity, 97% specificity)
- Complete security feature documentation

**Improved Discoverability:**
- 20 optimized GitHub topics for better search ranking
- SEO keyword research and implementation
- Social media integration templates
- Enhanced Open Graph tags for sharing

**Performance Metrics:**
- Transparent accuracy documentation
- Real-world testing results
- Pattern detection statistics

### 🎯 Key Features

- ⚡ **2-second scans** - Ethereum, Polygon, Arbitrum
- 🎯 **13 specialized patterns** - 95% confidence threshold
- 🔒 **100% privacy-focused** - No tracking or data collection
- 💰 **Completely free** - No API keys, no limits
- 📱 **Mobile-friendly** - Responsive design
- 🔗 **Share results** - URL-based sharing
- 💾 **Export data** - JSON download
- 📚 **Educational tooltips** - Learn about each pattern

### 📦 Installation

```bash
git clone https://github.com/Teycir/honeypotscan.git
cd honeypotscan
npm install
npm run dev
```

### 🔐 Security

- EIP-55 checksum validation
- CSP headers & CORS whitelist
- Rate limiting (30 req/min)
- API key rotation (6 keys)
- Zero data collection

### 📈 Capacity

- 2M scans/day with 95% cache hit rate
- **Cost: $0/month** 🎉

### 🛠️ Tech Stack

Next.js 16.1.6 • React 19.2.3 • Tailwind CSS v4 • Cloudflare Workers • TypeScript

---

**Full Changelog**: https://github.com/Teycir/honeypotscan/blob/main/CHANGELOG.md

EOF

echo ""
echo "========================"
echo ""

# Instructions for GitHub release
echo "📤 Next Steps:"
echo "-------------"
echo ""
echo "1. Push the tag to GitHub:"
echo "   git push origin ${TAG}"
echo ""
echo "2. Create GitHub Release:"
echo "   - Go to: https://github.com/Teycir/honeypotscan/releases/new"
echo "   - Choose tag: ${TAG}"
echo "   - Release title: HoneypotScan v${VERSION}"
echo "   - Copy the release notes above"
echo "   - Check 'Set as the latest release'"
echo "   - Click 'Publish release'"
echo ""
echo "3. Update GitHub Repository Settings:"
echo "   - Add topics: honeypot-detector ethereum polygon arbitrum smart-contract-security"
echo "   - Update description: Free honeypot token scanner for Ethereum, Polygon & Arbitrum"
echo "   - Set website: https://honeypotscan.com"
echo ""
echo "4. Optional - Announce on social media:"
echo "   - Twitter/X with hashtags: #HoneypotScanner #CryptoSecurity #DeFiSecurity"
echo "   - Reddit: r/CryptoCurrency, r/ethereum, r/defi"
echo "   - Dev.to / Hashnode blog post"
echo ""

read -p "Push tag to GitHub now? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin "$TAG"
    echo "✅ Tag pushed to GitHub"
    echo ""
    echo "🎉 Release ${TAG} is ready!"
    echo "   Visit: https://github.com/Teycir/honeypotscan/releases/new?tag=${TAG}"
else
    echo "⏸️  Tag created locally but not pushed"
    echo "   Run: git push origin ${TAG}"
fi

echo ""
echo "✨ Done!"
