/**
 * Common exclusion patterns for links to filter out non-content elements.
 * These selectors will be excluded when extracting links from pages.
 */
export const commonExclusions = [
  'nav', // Exclude navigation
  'header', // Exclude header
  'footer', // Exclude footer
  '.cookie-banner', // Exclude cookie banner
  '.newsletter-popup', // Exclude newsletter popup
  'a[href*="/cart"]', // Exclude cart links
  'a[href*="/sign-in"]', // Exclude sign-in links
  'a[href*="/login"]', // Exclude login links
  'a[href*="/checkout"]', // Exclude checkout links
  'a[href*="/wishlist"]', // Exclude wishlist links
  'a[href*="/account"]', // Exclude account links
  '.social-media', // Exclude social media links
  '.site-footer', // Exclude site footer
  '.site-header', // Exclude site header
  '.mega-menu', // Exclude mega menus
]; 