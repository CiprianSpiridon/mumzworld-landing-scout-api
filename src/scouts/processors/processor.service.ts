import { Injectable } from '@nestjs/common';
import { Page } from 'playwright';
import { PageProcessor } from './processor.interface';
import { PageType } from '../entities/scout.entity';
import { PageResult } from '../../sessions/entities/page-result.entity';
import { CategoryProcessor } from './category.processor';
import { CollectionProcessor } from './collection.processor';
import { ProductDetailsProcessor } from './product-details.processor';

/**
 * Service that manages all page type processors and delegates to the appropriate one
 */
@Injectable()
export class ProcessorService {
  private processors: Map<string, PageProcessor> = new Map();

  constructor(
    private categoryProcessor: CategoryProcessor,
    private collectionProcessor: CollectionProcessor,
    private productDetailsProcessor: ProductDetailsProcessor,
  ) {
    this.registerProcessors();
  }

  /**
   * Register all available processors
   */
  private registerProcessors(): void {
    this.processors.set(this.categoryProcessor.type, this.categoryProcessor);
    this.processors.set(
      this.collectionProcessor.type,
      this.collectionProcessor,
    );
    this.processors.set(
      this.productDetailsProcessor.type,
      this.productDetailsProcessor,
    );
  }

  /**
   * Get all registered processor types
   */
  getProcessorTypes(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Identify the page type by trying all registered processors
   *
   * @param page Playwright Page object
   * @param pageTypes Array of page type configurations
   * @returns The matched page type or null if no match
   */
  async identifyPageType(
    page: Page,
    pageTypes: PageType[],
  ): Promise<PageType | null> {
    for (const pageType of pageTypes) {
      const processor = this.processors.get(pageType.type);

      if (processor && (await processor.identify(page, pageType))) {
        return pageType;
      }
    }

    return null;
  }

  /**
   * Process a page using the appropriate processor for its type
   *
   * @param page Playwright Page object
   * @param url URL of the page
   * @param pageType Page type configuration
   * @returns Page processing result
   */
  async processPage(
    page: Page,
    url: string,
    pageType: PageType,
  ): Promise<Partial<PageResult>> {
    const processor = this.processors.get(pageType.type);

    if (!processor) {
      throw new Error(`No processor found for page type: ${pageType.type}`);
    }

    return processor.process(page, url, pageType);
  }
}
