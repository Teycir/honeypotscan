export const config = {
  api: {
    local: 'http://localhost:8787',
    production: 'https://honeypotscan-api.teycircoder4.workers.dev',
  },
  cache: {
    ttl: {
      oneDay: 86400,
      oneWeek: 604800,
    },
    hitRate: 0.95,
  },
  scan: {
    confidence: {
      honeypot: 95,
      safe: 100,
    },
    minPatterns: 2,
  },
} as const;
