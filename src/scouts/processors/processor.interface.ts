import { Page } from 'playwright';
import { PageType } from '../entities/scout.entity';
import { PageResult } from '../../sessions/entities/page-result.entity';

/**
 * Interface for page processors that know how to handle specific page types
 */
export interface PageProcessor {
  /**
   * The type of page this processor handles
   */
  type: string;
  
  /**
   * Identifies if a page matches this processor's type
   * 
   * @param page Playwright Page object
   * @param pageType PageType configuration with identification selectors
   * @returns true if the page matches this processor
   */
  identify(page: Page, pageType: PageType): Promise<boolean>;
  
  /**
   * Processes a page to extract product counts
   * 
   * @param page Playwright Page object
   * @param url URL of the page being processed
   * @param pageType PageType configuration with product count selectors
   * @returns PageResult with product count and processing information
   */
  process(page: Page, url: string, pageType: PageType): Promise<Partial<PageResult>>;
} 