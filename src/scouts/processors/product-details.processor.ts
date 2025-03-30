import { Page } from 'playwright';
import { Injectable } from '@nestjs/common';
import { PageProcessor } from './processor.interface';
import { PageType } from '../entities/scout.entity';
import { PageResult } from '../../sessions/entities/page-result.entity';
import { PageResultStatus } from '../../sessions/entities/page-result.entity';
import { autoScroll } from '../../common/utils/auto-scroll';
import { ConfigService } from '../../common/config/config.service';

@Injectable()
export class ProductDetailsProcessor implements PageProcessor {
  type = 'product-details';

  constructor(private readonly configService: ConfigService) {}

  /**
   * Identifies if a page is a product detail page
   * Checks for product name element with the partial class "ProductDetails_productName"
   */
  async identify(page: Page, pageType: PageType): Promise<boolean> {
    try {
      // Use the specified identifier if available, otherwise use default logic
      if (pageType.identifier) {
        return await page.locator(pageType.identifier).count().then(count => count > 0);
      }
      
      // Default to looking for product name with specific class
      const productNameExists = await page.locator('h1[class*="ProductDetails_productName"]').count() > 0;
      return productNameExists;
    } catch (error) {
      console.error(`Error identifying product detail page: ${error.message}`);
      return false;
    }
  }

  /**
   * Process a product detail page
   * Sets product count to 1 if in stock (Add to Cart button exists), otherwise 0
   */
  async process(page: Page, url: string, pageType: PageType): Promise<Partial<PageResult>> {
    try {
      // Ensure content is fully loaded
      await autoScroll(page);
      
      // Locate product name element
      const productNameElement = await page.locator('h1[class*="ProductDetails_productName"]').first();
      const productName = await productNameElement.textContent() || 'Unknown Product';
      
      // Check if Add to Cart button exists (indicating product is in stock)
      let inStock = false;
      if (pageType.countSelector) {
        // Use provided selector if available
        inStock = await page.locator(pageType.countSelector).count() > 0;
      } else {
        // Default to looking for Add to Cart button
        inStock = await page.locator('button[title="Add to Cart"]').count() > 0;
      }
      
      // Set product count to 1 if in stock, otherwise 0
      const productCount = inStock ? 1 : 0;
      
      return {
        pageType: this.type,
        productCount,
        status: PageResultStatus.SUCCESS,
      };
    } catch (error) {
      console.error(`Error processing product detail page: ${error.message}`);
      return {
        pageType: this.type,
        productCount: 0,
        status: PageResultStatus.ERROR,
        errorMessage: `Failed to process product detail page: ${error.message}`,
      };
    }
  }
} 