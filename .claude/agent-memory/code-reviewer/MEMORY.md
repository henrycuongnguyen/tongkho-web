# Code Reviewer Agent Memory

## Pagination URL Patterns (Astro SSR/SSG)

### Path-based vs Query-param Pagination
- **SSG Pages** (e.g., /tin-tuc/trang/[page].astro): Use path-based `/trang/{page}` pagination
- **SSR Pages** (e.g., /chuyenmuc/[folder].astro): Use query param `?page={page}` pagination
- **Reason**: SSG pre-generates paths; SSR reads searchParams dynamically
- **Critical**: Pagination component MUST match route's expected URL pattern

### Common Mistake: Pagination Component Mismatch
```typescript
// ❌ WRONG for SSR pages
function getPageUrl(page: number): string {
  return `${baseUrl}/trang/${page}`; // Path-based
}

// ✅ CORRECT for SSR pages
function getPageUrl(page: number): string {
  return `${baseUrl}?page=${page}`; // Query param
}
```

### Edge Cases - Pagination Input Validation
- **Always validate page param**: `parseInt()` can return NaN, negative, or huge numbers
- **Pattern**: `let page = parseInt(param || '1', 10); if (isNaN(page) || page < 1) page = 1;`
- **Beyond totalPages**: Redirect to last valid page or show 404
- **Defense**: Even if users rarely abuse, bots and crawlers will

## Service Layer Patterns (News/Folder)

### v1 Compatibility Checklist
- **Sort Order**: Always verify `display_order ASC, id DESC` for news queries (v1: `api_customer.py:5709`)
- **Folder Lookup**: Use `folder.name` slug → `folder.id` → filter news (v1: `cms.get_folder`)
- **Pagination**: Separate count query + data query with offset/limit (v1: `cms.get_content` + `cms.get_count`)
- **Active Filter**: Always include `aactive = true` for soft-delete pattern

### Type Safety - Database Field Constraints
- **char(1) fields**: Define as literal union types (`'T' | 'F' | null`), NOT `string | null`
- **Example**: `folder.publish` should be `'T' | 'F' | null` to match DB constraint
- **Pattern**: Check schema definition → match exact constraint in TypeScript type

### Code Quality Anti-Patterns
- **Duplicate WHERE Clauses**: Extract to helper function when count + data queries share same filters
- **Magic Numbers**: Extract to named constants (e.g., `DEFAULT_VIEW_COUNT_MIN = 500`)
- **Sort Order Duplication**: Extract to const array when same orderBy used in 3+ places

### Edge Cases - Pagination & User Input
- **Always validate pagination params**: `page` and `itemsPerPage` should be bounded (min: 1, max: 100)
- **Defense-in-depth**: Even if Astro pages control params, service should validate (prevents accidental DoS)
- **Pattern**: `Math.max(1, Math.min(MAX, Math.floor(input)))` for safe clamping

## ElasticSearch Query Patterns

### status_id Filtering
- **v1 uses string type**: `{"term": {"status_id": "3"}}` (lines 442, 490 in real_estate_handle.py)
- **v2 CHANGED to integer**: `{"term": {"status_id": 3}}` per user clarification
- **Critical**: User confirmed ES index stores status_id as INTEGER, not string
- **Pattern**: Use `should` with `minimum_should_match: 1` to include missing status_id fields

### Project vs Real Estate Index
- **transaction_type=3**: Uses `project` index, NOT `real_estate` index
- **Key pattern**: Wrap real_estate-only filters in `if (!isProjectQuery)` guard
- **v1-compatible filters apply ONLY to real_estate**: is_featured, created_time, status_id
- **Project index**: Different field mappings, no source_post field

## tongkho-web Project Context

### File Organization
- **ES Services**: `src/services/elasticsearch/`
- **v1 Reference**: `reference/tongkho_v1/modules/real_estate_handle.py`
- **Test Pattern**: Co-located `.test.ts` files with implementation

### Code Quality Standards
- 100% test pass rate required before review approval
- TypeScript compilation must succeed (build command)
- v1 parity verification mandatory for ES query changes

## React/Astro Component Patterns

### Recursive Component Implementation
- **Astro Recursion**: Use `<Astro.self />` for server-side recursive rendering
- **React Recursion**: Extract separate component function, pass depth param
- **MAX_DEPTH Safeguard**: Always add depth limit (typically 10) to prevent stack overflow
- **Early Return Pattern**: `if (depth >= MAX_DEPTH) return null;` before rendering logic

### Accessibility Requirements
- **aria-expanded**: Must toggle dynamically for accordions (mobile), can be static for hover menus (desktop)
- **aria-haspopup**: Required when element has children menu
- **aria-hidden**: Mark decorative SVG icons to prevent screen reader clutter
- **aria-level**: Recommended for nested menus to indicate hierarchy depth
- **Semantic HTML**: Use `<nav>`, `<button>` (for togglable), `<a>` (for links) appropriately

### State Management Patterns
- **Set-based Expansion**: Use `Set<string>` for O(1) lookup instead of array includes
- **Path-based Keys**: Hierarchical paths (e.g., "News.BĐS.Thị Trường") for nested expansion tracking
- **Immutable Updates**: Always create new Set (`new Set(prev)`) instead of mutating

### Performance Best Practices
- **CSS Transitions**: Prefer GPU-accelerated properties (transform, opacity) over layout properties
- **maxHeight Transitions**: Acceptable but less performant than pure transform; monitor on low-end devices
- **Conditional Rendering**: Use `&&` checks to prevent unnecessary DOM nodes
- **Magic Numbers**: Extract constants (e.g., `ITEM_HEIGHT_PX = 48`) for maintainability

## XSS Protection (Astro `set:html`)

### Critical Security Pattern
- **NEVER trust `set:html` without sanitization** - XSS vulnerability if content from DB/API
- **Always use DOMPurify**: `npm install isomorphic-dompurify` for server-side sanitization
- **Pattern**: Sanitize in service layer BEFORE returning to page component

### Common Mistake: URL Replacement Only
```typescript
// ❌ WRONG - only fixes URLs, no XSS protection
function fixLocalhostUrls(content: string): string {
  return content.replace(/http:\/\/localhost\//g, 'https://domain.com/');
}
```

### Correct Implementation
```typescript
// ✅ CORRECT - sanitize first, then replace URLs
import DOMPurify from 'isomorphic-dompurify';

function fixLocalhostUrls(content: string): string {
  if (!content) return "";
  const urlFixed = content.replace(/http:\/\/localhost\//g, 'https://domain.com/');
  return DOMPurify.sanitize(urlFixed, {
    ALLOWED_TAGS: ['p', 'h2', 'h3', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'br'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}
```

### Edge Cases to Test
- `<script>alert('XSS')</script>` - Should be stripped
- `<img src=x onerror="alert('XSS')">` - Event handlers removed
- `<div style="position:fixed;...">` - Inline styles allowed if in ALLOWED_ATTR
- Whitespace-only content: Use `.trim()` before truthy check

## Content Validation Patterns

### Whitespace Edge Case
```typescript
// ❌ WRONG - whitespace passes truthy check
{article.content ? <div set:html={article.content} /> : <Empty />}

// ✅ CORRECT - trim before check
{article.content?.trim() ? <div set:html={article.content} /> : <Empty />}
```

### Empty State Handling
- **Always provide fallback UI** for empty arrays/content
- **Pattern**: Show user-friendly message, not just blank space
- **Related articles example**: "Chưa có bài viết liên quan" instead of empty `<ul>`

## Code Quality - DRY Violations

### URL Pattern Duplication
- **Anti-pattern**: URL patterns like `/chuyenmuc/${slug}` duplicated across files
- **Fix**: Extract to `src/constants/news-routes.ts` or similar
- **Pattern**: `export const NEWS_ROUTES = { folder: (slug) => \`/chuyenmuc/${slug}\` } as const;`
- **Benefit**: Single source of truth for URL structure changes

### Category Label Duplication
- **Anti-pattern**: Same `categoryLabels` mapping in 2+ files (page + sidebar)
- **Fix**: Extract to `src/constants/news-categories.ts`
- **Export as const**: Use `as const` for type narrowing
- **Import pattern**: `import { CATEGORY_LABELS } from '@/constants/news-categories'`

## Database Query Patterns

### N+1 Query Anti-Pattern
- **Problem**: `Promise.all` with individual queries per item in loop
- **Example**: Fetch parent folders, then loop each to fetch subfolders
- **Impact**: 1 + N queries instead of 2 queries
- **Solution**: Fetch all child records in single query with `inArray(parent_id, parentIds)`
```typescript
// ✅ CORRECT - 2 queries total
const parentIds = parents.map(p => p.id);
const allChildren = await db.select().from(table).where(inArray(table.parent, parentIds));
const childrenByParent = allChildren.reduce((acc, child) => {
  if (!acc[child.parent]) acc[child.parent] = [];
  acc[child.parent].push(child);
  return acc;
}, {});
```

## Data Validation Edge Cases

### Null/Empty String URL Construction
- **Risk**: Database nullable fields used directly in URLs
- **Example**: `href={\`/chuyenmuc/${subFolder.name}\`}` where `name` is `string | null`
- **Result**: `/chuyenmuc/null` or `/chuyenmuc/` → 404 errors
- **Fix**: Validate before rendering
```astro
{items.map((item) => {
  if (!item.name || item.name.trim() === '') return null;
  return <a href={`/path/${item.name}`}>...</a>
})}
```

### Optional Array Rendering
- **Pattern**: Filter arrays before map to ensure non-empty
```astro
const itemsWithChildren = items.filter(item => item.children && item.children.length > 0);
{itemsWithChildren.map(item => (
  <div>{item.children.map(...)}</div>
))}
```
- **Empty state**: Decide if UI should show "no items" message or hide section entirely
