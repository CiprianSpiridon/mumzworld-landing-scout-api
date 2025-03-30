import { Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { PageProcessor } from './processor.interface';
import { PageType } from '../entities/scout.entity';
import { PageResult } from '../../sessions/entities/page-result.entity';
import { PageResultStatus } from '../../sessions/entities/page-result.entity';
import { autoScroll } from '../../common/utils/auto-scroll';
import { ConfigService } from '../../common/config/config.service';

@Injectable()
export class CollectionProcessor implements PageProcessor {
  type = 'collection';

  constructor(private readonly configService: ConfigService) {}

  async identify(page: Page, pageType: PageType): Promise<boolean> {
    try {
      // Check if the identifier selector exists on the page
      const identifier = await page.$(pageType.identifier);
      return !!identifier;
    } catch (error) {
      // If there's an error, the page doesn't match
      return false;
    }
  }

  async process(
    page: Page,
    url: string,
    pageType: PageType,
  ): Promise<Partial<PageResult>> {
    const startTime = Date.now();
    
    try {
      // Scroll the page to make sure all lazy-loaded content is visible
      await autoScroll(page);
      
      // Extract product count using the provided selector
      const countElement = await page.$(pageType.countSelector);
      let productCount = 0;
      
      if (countElement) {
        const countText = await countElement.textContent();
        // Extract numbers from the text (e.g., "123 Products" -> 123)
        const match = countText?.match(/\d+/);
        if (match) {
          productCount = parseInt(match[0], 10);
        }
      } else {
        // Attempt to count products directly if no count element is found
        // Use fallback selectors from the page type config if available, otherwise use defaults
        const productSelector = pageType.fallbackProductSelectors || 
          this.configService.defaultProductSelectors;
          
        const productElements = await page.$$(productSelector);
        productCount = productElements.length;
      }
      
      // Calculate processing time
      const processingTimeMs = Date.now() - startTime;
      
      // Capture screenshot if configured to do so
      const screenshotPath = this.configService.areScreenshotsEnabled ? 
        `${this.configService.screenshotsDir}/${new Date().toISOString()}-${this.type}.png` : 
        undefined;
      
      // Get HTML snapshot if configured to do so
      const htmlSnapshot = this.configService.isHtmlSnapshotEnabled ? 
        await page.content() : 
        undefined;

      return {
        url,
        pageType: this.type,
        productCount,
        scanTime: new Date(),
        processingTimeMs,
        status: PageResultStatus.SUCCESS,
        screenshotPath,
        htmlSnapshot,
      };
    } catch (error) {
      // Handle errors
      return {
        url,
        pageType: this.type,
        scanTime: new Date(),
        processingTimeMs: Date.now() - startTime,
        status: PageResultStatus.ERROR,
        errorMessage: (error as Error).message,
      };
    }
  }
} 