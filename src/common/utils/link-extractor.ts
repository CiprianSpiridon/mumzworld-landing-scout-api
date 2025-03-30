import { Page } from 'playwright';
import { commonExclusions } from '../constants/exclusions';

/**
 * Extracts links from a page, filtering out those matched by exclusion patterns.
 * 
 * @param page Playwright Page object
 * @param baseUrl Base URL for resolving relative paths
 * @param additionalExclusions Additional selectors to exclude
 * @returns Array of extracted link URLs
 */
export async function extractLinks(
  page: Page,
  baseUrl: string,
  additionalExclusions: string[] = [],
): Promise<string[]> {
  // Combine common and additional exclusions
  const exclusions = [...commonExclusions, ...additionalExclusions];
  
  // Create a selector that excludes all patterns
  const excludeSelector = exclusions.map(selector => `:not(${selector})`).join('');
  
  // Extract all links, excluding those matching the exclusion patterns
  const links = await page.evaluate(
    ([excludeSelector, baseUrl]) => {
      const linkElements = document.querySelectorAll(`${excludeSelector} a[href]`);
      
      return Array.from(linkElements)
        .map(link => {
          const href = link.getAttribute('href');
          if (!href) return null;
          
          // Skip non-HTTP links, fragments, and javascript: links
          if (
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            href === '#' ||
            href.startsWith('#')
          ) {
            return null;
          }
          
          // Resolve relative URLs
          try {
            return new URL(href, baseUrl).href;
          } catch (error) {
            return null;
          }
        })
        .filter(url => url !== null)
        // Remove duplicates
        .filter((url, index, self) => self.indexOf(url) === index);
    },
    [excludeSelector, baseUrl],
  );
  
  return links as string[];
} 