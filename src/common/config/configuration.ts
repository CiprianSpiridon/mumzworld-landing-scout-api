export default () => ({
  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  appName: process.env.APP_NAME || 'landingscout',

  // Database
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    username: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'root',
    database: process.env.DATABASE_NAME || 'landingscout',
  },

  // Scheduler
  scheduler: {
    enabled: process.env.SCHEDULER_ENABLED === 'true',
    checkInterval: parseInt(
      process.env.SCHEDULER_CHECK_INTERVAL || '60000',
      10,
    ),
  },

  // Playwright
  playwright: {
    headless: process.env.PLAYWRIGHT_HEADLESS === 'true',
    timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10),
    userAgent:
      process.env.PLAYWRIGHT_USER_AGENT ||
      'LandingScout/1.0 (+https://github.com/CiprianSpiridon/mumzworld-landing-scout-api)',
  },

  // Selectors
  selectors: {
    // Default selectors to use when fallbacks aren't specified in page type configs
    defaultProductSelectors:
      process.env.DEFAULT_PRODUCT_SELECTORS ||
      '.product-item, .product-card, [data-product-id], .collection-item, .product',
  },

  // Capture
  capture: {
    screenshotsEnabled: process.env.SCREENSHOTS_ENABLED === 'true',
    screenshotsDir: process.env.SCREENSHOTS_DIR || './screenshots',
    htmlSnapshotEnabled: process.env.HTML_SNAPSHOT_ENABLED === 'true',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || './logs',
  },
}); 