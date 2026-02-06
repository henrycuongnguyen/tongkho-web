/**
 * Menu TypeScript interfaces for database-driven navigation
 *
 * These types support the transformation from database records to NavItem structures
 * used by the header navigation components.
 */

/**
 * Navigation item interface
 */
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

/**
 * Property type from database (for menu generation)
 * Maps to property_type table
 */
export interface MenuPropertyType {
  id: number;
  title: string;
  parentId: number | null;
  transactionType: number; // 1=sale, 2=rent, 3=project
  vietnamese: string | null;
  slug: string | null;
  aactive: boolean;
}

/**
 * News folder from database (for menu generation)
 * Maps to folder table
 */
export interface MenuFolder {
  id: number;
  parent: number | null;
  name: string | null;
  label: string | null;
  publish: string | null; // 'T' = published
  displayOrder: number | null;
  subFolders?: MenuFolder[]; // Hierarchical sub-folders
}

/**
 * Complete menu structure returned by buildMenuStructure()
 */
export interface MenuStructure {
  mainNav: NavItem[];
  propertyTypes: {
    sale: MenuPropertyType[];
    rent: MenuPropertyType[];
    project: MenuPropertyType[];
  };
  newsFolders: MenuFolder[];
  generatedAt: Date;
}

/**
 * Cache entry for in-memory menu caching during build
 */
export interface MenuCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Menu service options
 */
export interface MenuServiceOptions {
  cacheTTL?: number; // Cache TTL in milliseconds (default 3600000 = 1 hour)
  newsRootFolderId?: number; // Root folder ID for news (default 11)
}
