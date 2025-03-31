import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { Browser, BrowserContext, Page, chromium } from 'playwright';
import { ConfigService } from '../common/config/config.service';

@Injectable()
export class BrowserService implements OnModuleDestroy {
  private browser: Browser | null = null;
  private readonly logger = new Logger(BrowserService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize the browser instance
   */
  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      this.logger.log('Initializing browser...');
      this.browser = await chromium.launch({
        headless: this.configService.playwrightConfig.headless,
      });
      this.logger.log('Browser initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize browser: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Create a new browser context with the configured user agent
   */
  async createContext(): Promise<BrowserContext> {
    if (!this.browser) {
      await this.initialize();
    }

    // Check if browser is still null after initialization (shouldn't happen, but TypeScript wants it)
    if (!this.browser) {
      throw new Error('Failed to initialize browser');
    }

    return this.browser.newContext({
      userAgent: this.configService.userAgent,
      viewport: { width: 1920, height: 1080 },
      acceptDownloads: false,
      bypassCSP: true,
      ignoreHTTPSErrors: true,
    });
  }

  /**
   * Create a new page with a new context
   */
  async createPage(): Promise<{ page: Page; context: BrowserContext }> {
    const context = await this.createContext();
    const page = await context.newPage();
    
    // Set default timeout for navigation and actions
    page.setDefaultTimeout(this.configService.playwrightConfig.timeout);
    
    return { page, context };
  }

  /**
   * Close a browser context and its pages
   */
  async closeContext(context: BrowserContext): Promise<void> {
    try {
      await context.close();
    } catch (error) {
      this.logger.warn(`Error closing browser context: ${(error as Error).message}`);
    }
  }

  /**
   * Close a page and its context
   */
  async closePage(page: Page, context: BrowserContext): Promise<void> {
    try {
      await page.close();
      await this.closeContext(context);
    } catch (error) {
      this.logger.warn(`Error closing page: ${(error as Error).message}`);
    }
  }

  /**
   * Clean up resources when the module is destroyed
   */
  async onModuleDestroy(): Promise<void> {
    if (this.browser) {
      try {
        this.logger.log('Closing browser...');
        await this.browser.close();
        this.browser = null;
        this.logger.log('Browser closed successfully');
      } catch (error) {
        this.logger.error(`Error closing browser: ${(error as Error).message}`);
      }
    }
  }
} 