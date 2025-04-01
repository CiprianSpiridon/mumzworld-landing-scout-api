import { Page } from 'playwright';

/**
 * Auto-scrolls a page to ensure all dynamic content is loaded.
 * This is useful for pages that lazy-load content as the user scrolls.
 * Optimized version with reduced wait times and better early termination.
 * 
 * @param page Playwright Page object
 * @param scrollStep Pixels to scroll each step
 * @param scrollDelay Milliseconds to wait between scroll steps
 * @param maxScrolls Maximum number of scroll steps to perform
 * @param finalTimeout Milliseconds to wait after scrolling is complete
 */
export async function autoScroll(
  page: Page,
  scrollStep = 100,
  scrollDelay = 50,
  maxScrolls = 30,
  finalTimeout = 500,
): Promise<void> {
  await page.evaluate(
    async ([step, delay, max]) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        let scrolls = 0;
        let lastScrollHeight = 0;
        let unchangedScrolls = 0;
        
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, step);
          totalHeight += step;
          scrolls += 1;
          
          if (scrollHeight === lastScrollHeight) {
            unchangedScrolls++;
            if (unchangedScrolls >= 3) {
              clearInterval(timer);
              resolve();
              return;
            }
          } else {
            unchangedScrolls = 0;
            lastScrollHeight = scrollHeight;
          }

          if (totalHeight >= scrollHeight || scrolls >= max) {
            clearInterval(timer);
            resolve();
          }
        }, delay);
      });
    },
    [scrollStep, scrollDelay, maxScrolls],
  );

  await page.waitForTimeout(finalTimeout);
} 