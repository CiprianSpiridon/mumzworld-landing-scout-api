import { Page } from 'playwright';
import { commonExclusions } from '../constants/exclusions';

/**
 * Extracts links from a page, filtering out those matched by exclusion patterns.
 * 
 * @param page Playwright Page object
 * @param additionalExclusions Additional patterns to exclude
 * @returns Array of extracted link URLs
 */
export async function extractLinks(
  page: Page,
  additionalExclusions: string[] = [],
): Promise<string[]> {
  // Get all links from the page
  const allLinks = await page.evaluate(() => {
    const linkElements = Array.from(document.querySelectorAll('a[href]'));
    return linkElements
      .map((link: Element) => {
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
        
        // Use full URL from the element
        return (link as HTMLAnchorElement).href;
      })
      .filter((url): url is string => url !== null);
  });

  // Combine common and additional exclusions
  const exclusionPatterns = [...commonExclusions, ...additionalExclusions];
  
  // Filter out links that match the exclusion patterns
  const filteredLinks = allLinks.filter((url: string) => {
    // Check if URL should be excluded
    for (const pattern of exclusionPatterns) {
      // Skip CSS selector patterns (they don't apply to URLs)
      if (
        pattern.startsWith('.') || 
        pattern === 'nav' || 
        pattern === 'header' || 
        pattern === 'footer'
      ) {
        continue;
      }
      
      // Handle regex-like patterns with $ for end of string
      if (pattern.endsWith('$')) {
        const basePattern = pattern.slice(0, -1);
        // Check if URL ends with the pattern exactly
        const urlPath = new URL(url).pathname;
        if (urlPath === basePattern) {
          return false; // Exclude this URL
        }
      } 
      // Regular string pattern matching
      else if (url.includes(pattern)) {
        return false; // Exclude this URL
      }
    }
    return true; // Include this URL
  });
  
  // Remove duplicates
  const uniqueLinks = [...new Set(filteredLinks)];
  
  return uniqueLinks;
} 