/**
 * Common exclusion patterns for links to filter out non-content elements.
 * These patterns will match against URLs to exclude from crawling.
 */
export const commonExclusions = [
  // Navigation and structural elements
  'nav',
  'header',
  'footer',
  '.cookie-banner',
  '.newsletter-popup',
  '.social-media',
  '.site-footer',
  '.site-header',
  '.mega-menu',

  // URL patterns to exclude
  '/cart',
  '/en/cart',
  '/ar/cart',
  '/sa-en/cart',
  '/sa-ar/cart',
  '/sign-in',
  '/en/sign-in',
  '/ar/sign-in',
  '/login',
  '/en/login',
  '/ar/login',
  '/checkout',
  '/en/checkout',
  '/ar/checkout',
  '/wishlist',
  '/en/wishlist',
  '/ar/wishlist',
  '/account',
  '/en/account',
  '/ar/account',
  '/terms',
  '/about',
  '/faq',
  '/help',
  '/contact',
  '/privacy',
];
