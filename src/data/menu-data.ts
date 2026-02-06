/**
 * Menu Data Module
 *
 * Provides menu data for Astro SSG builds by fetching from database
 * at build time. Includes fallback menu for error scenarios.
 *
 * Usage in Astro components:
 * ```astro
 * import { getMainNavItems } from '@/data/menu-data';
 * const menuItems = await getMainNavItems();
 * ```
 */

import { buildMainNav } from '@/services/menu-service';
import type { NavItem } from '@/types/menu';

/**
 * Fallback menu used when database is unavailable
 *
 * Provides a minimal working menu structure to ensure the site
 * builds successfully even if the database connection fails.
 */
const FALLBACK_MENU: NavItem[] = [
  { label: 'Trang chủ', href: '/' },
  {
    label: 'Mua bán',
    href: '/mua-ban',
    children: [],
  },
  {
    label: 'Cho thuê',
    href: '/cho-thue',
    children: [],
  },
  {
    label: 'Dự án',
    href: '/du-an',
    children: [],
  },
  {
    label: 'Tin tức',
    href: '/tin-tuc',
    children: [],
  },
  { label: 'Liên hệ', href: '/lien-he' },
  { label: 'Mạng lưới', href: '/mang-luoi' },
  { label: 'Tiện ích', href: '/tien-ich' },
];

/**
 * Fetch main navigation menu items
 *
 * Fetches menu data from database during build time using the menu service.
 * If database fetch fails, returns fallback menu to ensure build succeeds.
 *
 * This function is called during Astro's build process and the result is
 * baked into static HTML. No runtime database queries are made.
 *
 * @returns Promise resolving to array of navigation items
 */
export async function getMainNavItems(): Promise<NavItem[]> {
  try {
    const menuItems = await buildMainNav();

    return menuItems;
  } catch (error) {
    // Sanitize error to avoid exposing database credentials in stack traces
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error';
    console.error('[Menu Data] Failed to fetch menu from database:', errorMessage);
    console.warn('[Menu Data] Using fallback menu instead');

    return FALLBACK_MENU;
  }
}
