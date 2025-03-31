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
   * Uses multiple checks to identify product pages based on common elements
   */
  async identify(page: Page, pageType: PageType): Promise<boolean> {
    try {
      // Use the specified identifier if available
      if (pageType.identifier) {
        const count = await page.locator(pageType.identifier).count();
        if (count > 0) return true;
      }

      // Multiple checks to identify product pages
      const checks = [
        // Check for product name heading with ProductDetails_productName class
        page
          .locator('h1[class*="ProductDetails_productName"]')
          .count()
          .then((count) => count > 0),

        // Check for Add to Cart button
        page
          .locator('button[title="Add to Cart"]')
          .count()
          .then((count) => count > 0),

        // Check for product gallery
        page
          .locator('div.product-gallery, div[class*="ProductGallery"]')
          .count()
          .then((count) => count > 0),
      ];

      // If at least 2 checks pass, consider it a product page
      const results = await Promise.all(checks);
      const passedChecks = results.filter((result) => result).length;

      return passedChecks >= 2;
    } catch (error) {
      console.error(
        `Error identifying product detail page: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Process a product detail page
   * Sets product count to 1 if Add to Cart button exists (in stock), otherwise 0
   */
  async process(
    page: Page,
    url: string,
    pageType: PageType,
  ): Promise<Partial<PageResult>> {
    try {
      // Ensure content is fully loaded
      await autoScroll(page);

      // Try to find product name for logging purposes
      let productName = 'Unknown Product';
      try {
        const productNameElement = await page.locator('h1[class*="ProductDetails_productName"]').first();
        if (productNameElement) {
          productName = (await productNameElement.textContent()) || productName;
        }
      } catch (e) {
        // Silently fail if we can't get the product name
      }

      // Check if Add to Cart button exists (indicating product is in stock)
      let inStock = false;

      // Use provided selector if available, otherwise use default
      const selector = pageType.countSelector || 'button[title="Add to Cart"]';

      try {
        // Check for the Add to Cart button
        inStock = (await page.locator(selector).count()) > 0;

        // Log the result for debugging
        console.log(
          `Product: ${productName}, Add to Cart button found: ${inStock ? 'Yes' : 'No'}`,
        );
      } catch (buttonError) {
        console.error(
          `Error checking Add to Cart button: ${buttonError instanceof Error ? buttonError.message : 'unknown error'}`,
        );
        inStock = false;
      }

      // Set product count to 1 if in stock, otherwise 0
      const productCount = inStock ? 1 : 0;

      return {
        pageType: this.type,
        productCount,
        status: PageResultStatus.SUCCESS,
      };
    } catch (error) {
      console.error(
        `Error processing product detail page: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
      return {
        pageType: this.type,
        productCount: 0,
        status: PageResultStatus.ERROR,
        errorMessage: `Failed to process product detail page: ${error instanceof Error ? error.message : 'unknown error'}`,
      };
    }
  }
}
