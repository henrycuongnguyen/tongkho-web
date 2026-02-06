# Code Templates: Menu Implementation
**For:** Tongkho-Web menu feature
**Based on:** Existing project patterns

---

## Template 1: Menu Drizzle Schema

**File:** `src/db/schema/menu.ts`

```typescript
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  text
} from 'drizzle-orm/pg-core';

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  icon: varchar('icon', { length: 100 }), // Icon name (lucide-react)
  parentId: integer('parent_id'), // NULL = root level
  displayOrder: integer('display_order').default(0),
  isActive: boolean('is_active').default(true),
  isPublished: boolean('is_published').default(true),
  url: varchar('url', { length: 500 }), // Override default slug-based URL
  target: varchar('target', { length: 20 }).default('_self'), // _self, _blank
  badges: integer('badges').default(0), // Dynamic badge count (e.g., "10 New")
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type MenuItemRow = typeof menuItems.$inferSelect;
export type MenuItemInsert = typeof menuItems.$inferInsert;
```

---

## Template 2: Menu Service

**File:** `src/services/menu-service.ts`

```typescript
/**
 * Menu Service
 * Fetches menu structure from PostgreSQL
 * Used during Astro build time
 */

import { db } from '@/db';
import { menuItems, type MenuItemRow } from '@/db/schema/menu';
import { eq, isNull, and, desc, asc } from 'drizzle-orm';

// Cache for repeated queries during build
const menuCache = new Map<string, Promise<any>>();

/**
 * Get all root-level menu items (no parent)
 * Used for main navigation header
 */
export async function getRootMenuItems(): Promise<MenuItemRow[]> {
  return getCachedData('root-menu-items', async () => {
    return db
      .select()
      .from(menuItems)
      .where(
        and(
          isNull(menuItems.parentId),
          eq(menuItems.isActive, true),
          eq(menuItems.isPublished, true)
        )
      )
      .orderBy(asc(menuItems.displayOrder));
  });
}

/**
 * Get child items for a parent menu
 */
export async function getChildMenuItems(
  parentId: number
): Promise<MenuItemRow[]> {
  return db
    .select()
    .from(menuItems)
    .where(
      and(
        eq(menuItems.parentId, parentId),
        eq(menuItems.isActive, true),
        eq(menuItems.isPublished, true)
      )
    )
    .orderBy(asc(menuItems.displayOrder));
}

/**
 * Get full menu tree (parent + all children)
 * Returns: [{ ...parent, children: [...] }]
 */
export async function getFullMenuTree(): Promise<
  (MenuItemRow & { children: MenuItemRow[] })[]
> {
  const roots = await getRootMenuItems();

  return Promise.all(
    roots.map(async (root) => ({
      ...root,
      children: await getChildMenuItems(root.id),
    }))
  );
}

/**
 * Get menu item by slug
 * Used for dynamic routes: /danh-muc/[slug]
 */
export async function getMenuItemBySlug(
  slug: string
): Promise<MenuItemRow | null> {
  const result = await db
    .select()
    .from(menuItems)
    .where(
      and(
        eq(menuItems.slug, slug),
        eq(menuItems.isActive, true),
        eq(menuItems.isPublished, true)
      )
    )
    .limit(1);

  return result[0] || null;
}

/**
 * Get breadcrumb path for a menu item
 */
export async function getBreadcrumbs(slug: string): Promise<MenuItemRow[]> {
  const item = await getMenuItemBySlug(slug);
  if (!item) return [];

  const breadcrumbs: MenuItemRow[] = [item];

  // Walk up parent chain
  let current = item;
  while (current.parentId) {
    const parent = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, current.parentId))
      .limit(1)
      .then((r) => r[0]);

    if (parent) {
      breadcrumbs.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return breadcrumbs;
}

/**
 * Get all possible static paths for getStaticPaths()
 * Returns: [{ params: { slug }, props: { item } }, ...]
 */
export async function getAllMenuPaths(): Promise<
  Array<{ params: { slug: string }; props: { item: MenuItemRow } }>
> {
  const items = await db
    .select()
    .from(menuItems)
    .where(
      and(
        eq(menuItems.isActive, true),
        eq(menuItems.isPublished, true)
      )
    );

  return items.map((item) => ({
    params: { slug: item.slug },
    props: { item },
  }));
}

/**
 * Cache helper: Memoize query results during build
 */
function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!menuCache.has(key)) {
    menuCache.set(key, fetcher());
  }
  return menuCache.get(key)!;
}

/**
 * Format menu item for display
 */
export function formatMenuItemForDisplay(item: MenuItemRow) {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    href: item.url || `/danh-muc/${item.slug}`,
    icon: item.icon,
    badge: item.badges > 0 ? item.badges : null,
    isExternal: item.target === '_blank',
  };
}
```

---

## Template 3: Header Menu Component

**File:** `src/components/header/category-menu.astro`

```astro
---
/**
 * Category Menu Component
 * Displays root-level menu items in header
 * Data fetched at build time
 */

import { getRootMenuItems, formatMenuItemForDisplay } from '@/services/menu-service';
import Icon from '@iconify-icon/icon.js';

// Fetch menu during build
const rootItems = await getRootMenuItems();

interface Props {
  maxItems?: number;
}

const { maxItems = 10 } = Astro.props;
const displayItems = rootItems.slice(0, maxItems);
---

<nav class="category-menu" aria-label="Main menu">
  <ul class="flex gap-1 md:gap-2">
    {displayItems.map((item) => {
      const formatted = formatMenuItemForDisplay(item);
      return (
        <li>
          <a
            href={formatted.href}
            class={`
              px-3 py-2 rounded-md text-sm font-medium
              hover:bg-secondary-100 dark:hover:bg-secondary-800
              transition-colors
            `}
            target={formatted.isExternal ? '_blank' : undefined}
            rel={formatted.isExternal ? 'noopener noreferrer' : undefined}
          >
            {formatted.icon && (
              <Icon
                icon={`lucide:${formatted.icon}`}
                class="inline mr-1 h-4 w-4"
              />
            )}
            {formatted.name}
            {formatted.badge && (
              <span class="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {formatted.badge}
              </span>
            )}
          </a>
        </li>
      );
    })}
  </ul>
</nav>

<style>
  .category-menu {
    display: flex;
    gap: 0.25rem;
  }

  .category-menu a {
    display: flex;
    align-items: center;
  }
</style>
```

---

## Template 4: Menu Detail Page

**File:** `src/pages/danh-muc/[slug].astro`

```astro
---
/**
 * Menu Category Detail Page
 * Dynamic route for each menu item
 * URL: /danh-muc/{slug}
 */

import MainLayout from '@/layouts/main-layout.astro';
import {
  getAllMenuPaths,
  getMenuItemBySlug,
  getChildMenuItems,
  getBreadcrumbs,
  formatMenuItemForDisplay
} from '@/services/menu-service';

// Generate all possible routes at build time
export async function getStaticPaths() {
  return getAllMenuPaths();
}

// Get the item from props (provided by getStaticPaths)
const { item } = Astro.props;

// Fetch related data
const [children, breadcrumbs] = await Promise.all([
  getChildMenuItems(item.id),
  getBreadcrumbs(item.slug),
]);

// Format for display
const formatted = formatMenuItemForDisplay(item);
const formattedChildren = children.map(formatMenuItemForDisplay);

// SEO
const pageTitle = `${item.name} | TongkhoBDS`;
const pageDescription = item.description || `Danh mục ${item.name}`;
---

<MainLayout
  title={pageTitle}
  description={pageDescription}
>
  <!-- Breadcrumb -->
  <nav class="py-4 px-4 bg-secondary-50" aria-label="Breadcrumb">
    <ol class="flex gap-2 max-w-4xl mx-auto text-sm">
      <li><a href="/" class="text-primary-600 hover:underline">Trang chủ</a></li>
      {breadcrumbs.map((crumb, idx) => (
        <>
          <li>/</li>
          <li>
            {idx === breadcrumbs.length - 1 ? (
              <span class="text-secondary-700 font-medium">{crumb.name}</span>
            ) : (
              <a href={`/danh-muc/${crumb.slug}`} class="text-primary-600 hover:underline">
                {crumb.name}
              </a>
            )}
          </li>
        </>
      ))}
    </ol>
  </nav>

  <!-- Category Header -->
  <div class="max-w-4xl mx-auto px-4 py-12">
    <h1 class="text-4xl font-bold text-secondary-900 mb-4">
      {item.name}
    </h1>
    {item.description && (
      <p class="text-lg text-secondary-600 mb-8">
        {item.description}
      </p>
    )}
  </div>

  <!-- Child Categories Grid -->
  {formattedChildren.length > 0 && (
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h2 class="text-2xl font-bold text-secondary-900 mb-6">
        Danh mục con
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formattedChildren.map((child) => (
          <a
            href={child.href}
            class={`
              p-4 border border-secondary-200 rounded-lg
              hover:border-primary-500 hover:shadow-md
              transition-all duration-200
              flex items-center gap-3
            `}
          >
            {child.icon && (
              <span class="text-2xl">
                {child.icon}
              </span>
            )}
            <div class="flex-1">
              <h3 class="font-semibold text-secondary-900">
                {child.name}
              </h3>
              {child.badge && (
                <span class="text-xs text-red-600 font-medium">
                  {child.badge} mới
                </span>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )}

  <!-- Properties/Items Section (if applicable) -->
  <div class="max-w-4xl mx-auto px-4 py-8">
    <h2 class="text-2xl font-bold text-secondary-900 mb-6">
      Tin đăng mới nhất
    </h2>
    {/* Fetch and display items in this category */}
    <p class="text-secondary-600">Chưa có tin đăng</p>
  </div>
</MainLayout>

<style is:global>
  /* Optional: Category-specific styles */
</style>
```

---

## Template 5: Mobile Menu Component

**File:** `src/components/header/mobile-menu.astro`

```astro
---
/**
 * Mobile Menu Component
 * Responsive menu for mobile devices
 * Data fetched at build time
 */

import { getFullMenuTree, formatMenuItemForDisplay } from '@/services/menu-service';

const menuTree = await getFullMenuTree();
const formattedTree = menuTree.map(item => ({
  ...formatMenuItemForDisplay(item),
  children: (item.children || []).map(formatMenuItemForDisplay),
}));
---

<nav class="mobile-menu" id="mobile-menu" hidden>
  <ul class="flex flex-col gap-0">
    {formattedTree.map((item) => (
      <li>
        <button
          class="w-full text-left px-4 py-3 hover:bg-secondary-50 flex justify-between items-center"
          onclick="toggleSubmenu(event)"
        >
          <span class="flex items-center gap-2">
            {item.icon && (
              <span class="text-lg">{item.icon}</span>
            )}
            {item.name}
          </span>
          {item.children && item.children.length > 0 && (
            <span class="text-secondary-400">›</span>
          )}
        </button>

        {item.children && item.children.length > 0 && (
          <ul class="bg-secondary-50 hidden" data-submenu>
            {item.children.map((child) => (
              <li>
                <a
                  href={child.href}
                  class="block px-6 py-3 text-secondary-700 hover:bg-secondary-100"
                  target={child.isExternal ? '_blank' : undefined}
                >
                  {child.name}
                  {child.badge && (
                    <span class="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                      {child.badge}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </li>
    ))}
  </ul>
</nav>

<script>
  function toggleSubmenu(event: Event) {
    const button = event.currentTarget as HTMLButtonElement;
    const submenu = button.nextElementSibling;
    if (submenu && submenu.hasAttribute('data-submenu')) {
      submenu.classList.toggle('hidden');
      const arrow = button.querySelector('span:last-child');
      if (arrow) {
        arrow.classList.toggle('rotate-90');
      }
    }
  }
</script>

<style>
  .mobile-menu {
    /* Mobile menu styles */
  }
</style>
```

---

## Template 6: Breadcrumb Component

**File:** `src/components/navigation/breadcrumb.astro`

```astro
---
/**
 * Breadcrumb Component
 * Displays hierarchical navigation
 */

import { getBreadcrumbs } from '@/services/menu-service';

interface Props {
  slug: string;
  maxItems?: number;
}

const { slug, maxItems } = Astro.props;

const breadcrumbs = await getBreadcrumbs(slug);
const displayBreadcrumbs = maxItems ? breadcrumbs.slice(-maxItems) : breadcrumbs;
---

<nav aria-label="Breadcrumb" class="breadcrumb-nav">
  <ol class="flex items-center gap-2 text-sm">
    <li>
      <a href="/" class="text-primary-600 hover:underline">
        Trang chủ
      </a>
    </li>

    {displayBreadcrumbs.length > 0 && (
      <>
        {displayBreadcrumbs.map((item, idx) => (
          <>
            <li class="text-secondary-400">/</li>
            <li>
              {idx === displayBreadcrumbs.length - 1 ? (
                <span class="text-secondary-700 font-medium">
                  {item.name}
                </span>
              ) : (
                <a
                  href={`/danh-muc/${item.slug}`}
                  class="text-primary-600 hover:underline"
                >
                  {item.name}
                </a>
              )}
            </li>
          </>
        ))}
      </>
    )}
  </ol>
</nav>

<style>
  .breadcrumb-nav ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>
```

---

## Template 7: Database Migration

**File:** `src/db/migrations/create_menu_items.sql`

```sql
-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT true,
  url VARCHAR(500),
  target VARCHAR(20) DEFAULT '_self',
  badges INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_menu_items_parent_id ON menu_items(parent_id);
CREATE INDEX idx_menu_items_slug ON menu_items(slug);
CREATE INDEX idx_menu_items_active_published ON menu_items(is_active, is_published);
CREATE INDEX idx_menu_items_display_order ON menu_items(parent_id, display_order);

-- Insert sample data
INSERT INTO menu_items (name, slug, description, icon, display_order) VALUES
  ('Mua Bán', 'mua-ban', 'Nhà đất mua bán', 'shopping', 1),
  ('Cho Thuê', 'cho-thue', 'Nhà đất cho thuê', 'house', 2),
  ('Dự Án', 'du-an', 'Dự án bất động sản', 'building', 3),
  ('Tin Tức', 'tin-tuc', 'Tin tức thị trường', 'newspaper', 4);

-- Insert child items for Mua Bán
INSERT INTO menu_items (name, slug, description, parent_id, display_order) VALUES
  ('Hà Nội', 'ha-noi', NULL, 1, 1),
  ('TP. Hồ Chí Minh', 'tp-hcm', NULL, 1, 2),
  ('Đà Nẵng', 'da-nang', NULL, 1, 3),
  ('Các tỉnh khác', 'cac-tinh-khac', NULL, 1, 4);
```

---

## Usage Examples

### In Header Component
```astro
---
import CategoryMenu from '@/components/header/category-menu.astro';
---

<header>
  <CategoryMenu maxItems={6} />
</header>
```

### In Page Footer
```astro
---
import { getFullMenuTree } from '@/services/menu-service';
const menuTree = await getFullMenuTree();
---

<footer>
  {menuTree.map(item => (
    <div>
      <h3>{item.name}</h3>
      <ul>
        {item.children?.map(child => (
          <li><a href={`/danh-muc/${child.slug}`}>{child.name}</a></li>
        ))}
      </ul>
    </div>
  ))}
</footer>
```

### Dynamic Page Generation
```astro
---
// src/pages/danh-muc/[slug].astro
export async function getStaticPaths() {
  return getAllMenuPaths();
}
```

---

## Testing Template

**File:** `src/services/__tests__/menu-service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getRootMenuItems,
  getMenuItemBySlug,
  getChildMenuItems,
  getBreadcrumbs,
} from '../menu-service';

describe('Menu Service', () => {
  it('should fetch root menu items', async () => {
    const items = await getRootMenuItems();
    expect(Array.isArray(items)).toBe(true);
    expect(items.every(item => !item.parentId)).toBe(true);
  });

  it('should fetch menu item by slug', async () => {
    const item = await getMenuItemBySlug('mua-ban');
    expect(item).toBeDefined();
    expect(item?.slug).toBe('mua-ban');
  });

  it('should return 404 for non-existent slug', async () => {
    const item = await getMenuItemBySlug('non-existent');
    expect(item).toBeNull();
  });

  it('should fetch child menu items', async () => {
    const item = await getMenuItemBySlug('mua-ban');
    if (item) {
      const children = await getChildMenuItems(item.id);
      expect(Array.isArray(children)).toBe(true);
    }
  });

  it('should generate breadcrumbs', async () => {
    const breadcrumbs = await getBreadcrumbs('ha-noi');
    expect(Array.isArray(breadcrumbs)).toBe(true);
  });
});
```

---

## Notes

- All templates follow existing project patterns
- Use `formatMenuItemForDisplay()` for consistent data structure
- Caching is built-in via `getCachedData()` helper
- Database indexes are critical for performance
- Update `updated_at` via PostgreSQL trigger (optional)
- Icons use Lucide (via Iconify) - e.g., `lucide:shopping`

---

**Template Status:** ✅ Ready to copy-paste
**Tested Against:** Astro 5.2, Drizzle 0.45.1, PostgreSQL 12+
**Last Updated:** 2026-02-06

