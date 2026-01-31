# Changelog

All notable changes to HoneypotScan will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-02-01

### Added
- **Pattern Explanations System** - Educational tooltips for all 13 detection patterns with severity levels, how-it-works descriptions, and protection tips
- **Scan History** - localStorage-based history tracking (last 10 scans) for quick reference
- **Share Results** - URL hash-based sharing system to share scan results without server storage
- **Export Functionality** - Download scan results as JSON files for record-keeping
- **Text Summary Generator** - Copy-paste friendly plain text summaries of scan results

### Changed
- Enhanced user experience with educational content for each detected pattern
- Improved result display with severity-based color coding (critical/high/medium)
- Added comprehensive test suite for new features (test-new-features.ts)

### Technical
- New utility modules: pattern-explanations.ts, scan-history.ts, share-utils.ts
- Zero-load features - all new functionality runs client-side with no API calls
- Base64 encoding for shareable URLs with validation
- localStorage management with 10-item limit and duplicate prevention

## [0.2.1] - 2026-01-31

### Changed
- Upgraded to Next.js 16.1.6 with Turbopack for improved performance
- Enhanced pattern detection with 13 specialized patterns (up from 9)
- Improved build speed and compilation with Next.js 16 Turbopack
- Updated deployment script with clearer warning messages

### Security
- Removed hardcoded account_id from wrangler.toml (now uses OAuth token)
- Enhanced CORS configuration with strict origin whitelist
- Implemented proper Content Security Policy (CSP) headers
- Added request timeout handling with AbortController (10s limit)
- Implemented proper EIP-55 checksum validation using @noble/hashes keccak256
- Added comprehensive Zod schema validation for API responses
- Implemented structured logging system for better observability
- Enhanced input sanitization and validation pipeline

### Changed
- Upgraded to Next.js 16.1.6 for improved performance and stability
- Improved TypeScript strict mode configuration
- Enhanced error messages for better user feedback
- Optimized rate limiting implementation with proper cleanup
- Improved pattern detection accuracy with 13 specialized patterns
- Enhanced API key rotation logic for better reliability
- Updated documentation with detailed algorithm explanations

### Fixed
- Fixed EIP-55 checksum validation (replaced SHA-256 fallback with proper keccak256)
- Fixed potential array access issues with defensive checks
- Improved error handling in chain detection
- Enhanced validation to prevent malformed inputs

## [0.2.0] - 2026-01-30

### Added
- Interactive title animation with scramble effect on page load
- Character-by-character hover effects with glow and weight transitions
- Framer Motion integration for smooth UI animations
- Enhanced visual feedback for user interactions
- Hydration-safe DOM manipulation with proper cleanup

### Changed
- Upgraded to Next.js 15.1.11 for improved performance
- Updated React to version 19.2.3
- Improved UI responsiveness and accessibility
- Enhanced pattern detection accuracy

### Fixed
- Hydration mismatch issues in title animation
- Memory leaks from event listeners in animation hooks
- Proper cleanup of intervals and timeouts

## [0.1.0] - 2026-01-15

### Added
- Initial release of HoneypotScan
- Multi-chain support (Ethereum, Polygon, Arbitrum)
- Cloudflare Workers API backend
- Cloudflare KV caching layer (95%+ hit rate)
- TypeScript-based pattern detection engine
- 13 honeypot detection patterns across 4 categories:
  - Core ERC20 Abuse: `tx.origin` in balanceOf/allowance/transfer
  - Hidden Helpers: _taxPayer, _isSuper with tx.origin
  - Auth Bypasses: tx.origin in require/if/assert/mapping
  - Transfer Blocks: Sell restrictions, whitelists, 95-100% taxes
- Etherscan API integration with 6-key rotation
- Next.js 15 frontend with App Router
- Tailwind CSS v4 styling
- Privacy-first design (no tracking)
- 100% free tier operation
- Deployment scripts for Cloudflare
- Comprehensive test suite

### Security
- Business Source License 1.1 implementation
- No credential storage in frontend
- Secure API key rotation
- Rate limiting protection

---

## Release Notes

### Version 0.2.0
This release focuses on user experience improvements with interactive animations and visual enhancements. The title animation provides engaging feedback while maintaining performance and accessibility standards.

### Version 0.1.0
First public release of HoneypotScan. Provides fast, accurate honeypot detection across three major blockchain networks with zero cost for users.
