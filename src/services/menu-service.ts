/**
 * Menu Service
 * Provides database-driven navigation menu generation for SSG builds
 *
 * Features:
 * - Fetches property types by transaction type (buy/sell/rent/project)
 * - Fetches news folders with parent-child hierarchy
 * - In-memory caching during build (1-hour TTL)
 * - Type-safe transformations to NavItem interface
 * - Graceful error handling with fallback menus
 */

import { db } from "@/db";
import { propertyType, folder } from "@/db/schema/menu";
import { eq, and, isNull } from "drizzle-orm";
import type {
  MenuPropertyType,
  MenuFolder,
  MenuStructure,
  MenuCacheEntry,
  MenuServiceOptions,
  NavItem,
} from "@/types/menu";

// Constants
const DEFAULT_CACHE_TTL = 3600000; // 1 hour in milliseconds (matching V1 pattern)
const NEWS_ROOT_FOLDER_ID = 11; // Root folder for news (per V1 reference)

// In-memory cache for build-time caching
const cache = new Map<string, MenuCacheEntry<unknown>>();

/**
 * Get cached value or compute if expired
 */
function getCached<T>(
  key: string,
  compute: () => Promise<T>,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<T> {
  const cached = cache.get(key) as MenuCacheEntry<T> | undefined;

  // Check if cache is valid
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return Promise.resolve(cached.data);
  }

  // Cache miss or expired - compute new value
  return compute().then((data) => {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    return data;
  });
}

/**
 * Clear all menu caches
 * Useful for testing or manual cache invalidation
 */
export function clearMenuCache(): void {
  cache.clear();
}

/**
 * Fetch property types by transaction type
 *
 * Smart fetching strategy:
 * 1. First try to fetch root items (parentId IS NULL)
 * 2. If no root items found, fetch all items for that transaction type
 *
 * This handles different data structures:
 * - Transaction types with hierarchical data (e.g., Dự án) → shows only roots
 * - Transaction types with flat data (e.g., Mua bán, Cho thuê) → shows all items
 *
 * @param transactionType - 1 = Mua bán (sale), 2 = Cho thuê (rent), 3 = Dự án (project)
 * @returns Array of active property types for the transaction type
 */
export async function fetchPropertyTypesByTransaction(
  transactionType: number
): Promise<MenuPropertyType[]> {
  try {
    // Step 1: Try to get root items (parentId IS NULL)
    const rootItems = await db
      .select({
        id: propertyType.id,
        title: propertyType.title,
        parentId: propertyType.parentId,
        transactionType: propertyType.transactionType,
        vietnamese: propertyType.vietnamese,
        slug: propertyType.slug,
        aactive: propertyType.aactive,
      })
      .from(propertyType)
      .where(
        and(
          eq(propertyType.aactive, true),
          eq(propertyType.transactionType, transactionType),
          isNull(propertyType.parentId) // Only root items
        )
      );

    // Step 2: If root items exist, use them. Otherwise, get all items.
    const result =
      rootItems.length > 0
        ? rootItems
        : await db
            .select({
              id: propertyType.id,
              title: propertyType.title,
              parentId: propertyType.parentId,
              transactionType: propertyType.transactionType,
              vietnamese: propertyType.vietnamese,
              slug: propertyType.slug,
              aactive: propertyType.aactive,
            })
            .from(propertyType)
            .where(
              and(
                eq(propertyType.aactive, true),
                eq(propertyType.transactionType, transactionType)
              )
            );

    return result.map((row) => ({
      id: row.id,
      title: row.title || "",
      parentId: row.parentId,
      transactionType: row.transactionType || 0,
      vietnamese: row.vietnamese,
      slug: row.slug,
      aactive: row.aactive || false,
    }));
  } catch (error) {
    console.error(
      `[MenuService] Error fetching property types for transaction ${transactionType}:`,
      error
    );
    return []; // Graceful fallback
  }
}

/**
 * Fetch sub-folders for a parent folder
 *
 * @param parentId - Parent folder ID
 * @returns Array of published sub-folders sorted by display_order
 */
export async function fetchSubFolders(parentId: number): Promise<MenuFolder[]> {
  try {
    const result = await db
      .select({
        id: folder.id,
        parent: folder.parent,
        name: folder.name,
        label: folder.label,
        publish: folder.publish,
        displayOrder: folder.displayOrder,
      })
      .from(folder)
      .where(
        and(
          eq(folder.publish, "T"), // Published folders only
          eq(folder.parent, parentId) // Sub-folders of this parent
        )
      )
      .orderBy(folder.displayOrder);

    return result.map((row) => ({
      id: row.id,
      parent: row.parent,
      name: row.name,
      label: row.label,
      publish: row.publish,
      displayOrder: row.displayOrder,
    }));
  } catch (error) {
    console.error(`[MenuService] Error fetching sub-folders for parent ${parentId}:`, error);
    return []; // Graceful fallback
  }
}

/**
 * Fetch all published news folders with hierarchy
 *
 * @returns Array of published news folders with sub-folders, sorted by display_order
 */
export async function fetchNewsFolders(): Promise<MenuFolder[]> {
  try {
    // Fetch parent folders (direct children of news root)
    const parentFolders = await db
      .select({
        id: folder.id,
        parent: folder.parent,
        name: folder.name,
        label: folder.label,
        publish: folder.publish,
        displayOrder: folder.displayOrder,
      })
      .from(folder)
      .where(
        and(
          eq(folder.publish, "T"), // Published folders only
          eq(folder.parent, NEWS_ROOT_FOLDER_ID) // Only direct children of news root
        )
      )
      .orderBy(folder.displayOrder);

    // For each parent folder, fetch sub-folders
    const foldersWithSubs: MenuFolder[] = await Promise.all(
      parentFolders.map(async (parentFolder) => {
        const subFolders = await fetchSubFolders(parentFolder.id);
        return {
          id: parentFolder.id,
          parent: parentFolder.parent,
          name: parentFolder.name,
          label: parentFolder.label,
          publish: parentFolder.publish,
          displayOrder: parentFolder.displayOrder,
          subFolders: subFolders.length > 0 ? subFolders : undefined,
        };
      })
    );

    return foldersWithSubs;
  } catch (error) {
    console.error("[MenuService] Error fetching news folders:", error);
    return []; // Graceful fallback
  }
}

/**
 * Build complete menu structure from database
 *
 * This is the main entry point for menu generation.
 * Fetches all menu data and caches it for 1 hour.
 *
 * @param options - Service options (cacheTTL, newsRootFolderId)
 * @returns Complete menu structure with property types and news folders
 */
export async function buildMenuStructure(
  options: MenuServiceOptions = {}
): Promise<MenuStructure> {
  const { cacheTTL = DEFAULT_CACHE_TTL } = options;

  return getCached(
    "menu_structure",
    async () => {
      // Fetch all menu data in parallel
      const [saleTypes, rentTypes, projectTypes, newsFolders] =
        await Promise.all([
          fetchPropertyTypesByTransaction(1), // Mua bán
          fetchPropertyTypesByTransaction(2), // Cho thuê
          fetchPropertyTypesByTransaction(3), // Dự án
          fetchNewsFolders(),
        ]);

      const structure: MenuStructure = {
        mainNav: [], // Will be built by buildMainNav()
        propertyTypes: {
          sale: saleTypes,
          rent: rentTypes,
          project: projectTypes,
        },
        newsFolders,
        generatedAt: new Date(),
      };

      return structure;
    },
    cacheTTL
  );
}

/**
 * Transform property type to NavItem
 */
function propertyTypeToNavItem(pt: MenuPropertyType, basePath: string): NavItem {
  // Generate href from slug, fallback to slugified title
  const slug = pt.slug || pt.title.toLowerCase().replace(/\s+/g, "-");
  const href = `${basePath}/${slug}`;

  return {
    label: pt.vietnamese || pt.title,
    href,
  };
}

/**
 * Transform news folder to NavItem with nested children
 */
function folderToNavItem(folder: MenuFolder): NavItem {
  // Use folder name for URL slug
  const slug = folder.name || folder.label?.toLowerCase().replace(/\s+/g, "-") || "";
  // Use /tin-tuc/danh-muc/ prefix to avoid conflicts with article URLs
  const href = `/tin-tuc/danh-muc/${slug}`;

  const navItem: NavItem = {
    label: folder.label || folder.name || "",
    href,
  };

  // Recursively transform sub-folders if they exist
  if (folder.subFolders && folder.subFolders.length > 0) {
    navItem.children = folder.subFolders.map(folderToNavItem);
  }

  return navItem;
}

/**
 * Build main navigation menu (NavItem[]) from menu structure
 *
 * This transforms the database menu structure into the NavItem[] format
 * expected by the header components.
 *
 * @returns Array of NavItem for main navigation
 */
export async function buildMainNav(): Promise<NavItem[]> {
  const structure = await buildMenuStructure();

  // Build navigation items with children
  const nav: NavItem[] = [
    { label: "Trang chủ", href: "/" },

    // Mua bán
    {
      label: "Mua bán",
      href: "/mua-ban",
      children: structure.propertyTypes.sale.map((pt) =>
        propertyTypeToNavItem(pt, "/mua-ban")
      ),
    },

    // Cho thuê
    {
      label: "Cho thuê",
      href: "/cho-thue",
      children: structure.propertyTypes.rent.map((pt) =>
        propertyTypeToNavItem(pt, "/cho-thue")
      ),
    },

    // Dự án
    {
      label: "Dự án",
      href: "/du-an",
      children: structure.propertyTypes.project.map((pt) =>
        propertyTypeToNavItem(pt, "/du-an")
      ),
    },

    // Tin tức
    {
      label: "Tin tức",
      href: "/tin-tuc",
      children: structure.newsFolders.map(folderToNavItem),
    },

    // Static menu items
    { label: "Liên hệ", href: "/lien-he" },
    { label: "Mạng lưới", href: "/mang-luoi" },
    { label: "Tiện ích", href: "/tien-ich" },
  ];

  return nav;
}

/**
 * Get fallback menu (static menu if database fails)
 *
 * This provides a minimal working menu structure if database is unavailable.
 * Should only be used as a last resort during build failures.
 */
export function getFallbackMenu(): NavItem[] {
  console.warn(
    "[MenuService] Using fallback menu - database unavailable during build"
  );

  return [
    { label: "Trang chủ", href: "/" },
    { label: "Mua bán", href: "/mua-ban" },
    { label: "Cho thuê", href: "/cho-thue" },
    { label: "Dự án", href: "/du-an" },
    { label: "Tin tức", href: "/tin-tuc" },
    { label: "Liên hệ", href: "/lien-he" },
    { label: "Mạng lưới", href: "/mang-luoi" },
    { label: "Tiện ích", href: "/tien-ich" },
  ];
}
