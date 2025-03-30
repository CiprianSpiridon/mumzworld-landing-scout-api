import { Page } from 'playwright';

/**
 * Auto-scrolls a page to ensure all dynamic content is loaded.
 * This is useful for pages that lazy-load content as the user scrolls.
 * 
 * @param page Playwright Page object
 * @param scrollStep Pixels to scroll each step
 * @param scrollDelay Milliseconds to wait between scroll steps
 * @param maxScrolls Maximum number of scroll steps to perform
 */
export async function autoScroll(
  page: Page,
  scrollStep = 100,
  scrollDelay = 100,
  maxScrolls = 50,
): Promise<void> {
  await page.evaluate(
    async ([step, delay, max]) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        let scrolls = 0;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, step);
          totalHeight += step;
          scrolls += 1;

          if (totalHeight >= scrollHeight || scrolls >= max) {
            clearInterval(timer);
            resolve();
          }
        }, delay);
      });
    },
    [scrollStep, scrollDelay, maxScrolls],
  );

  // Wait a bit after scrolling to allow any remaining dynamic content to load
  await page.waitForTimeout(500);
} 