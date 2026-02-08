# Code Standards & Conventions

Guide to maintaining code quality, consistency, and best practices across the Tongkho-Web codebase.

## Contents

- [TypeScript & General Standards](./code-standards-typescript.md) - Type definitions, naming conventions, imports, error handling
- [Component Patterns](./code-standards-components.md) - Astro/React patterns, documentation, reusability guidelines
- [Database & Services](./code-standards-database.md) - Drizzle ORM, schemas, service layer architecture, caching

## Quick Reference

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Constants | SCREAMING_SNAKE_CASE | `MAX_PROPERTY_IMAGES` |
| Variables | camelCase | `propertyCount`, `isAvailable` |
| Functions | camelCase | `formatPrice()`, `generateSlug()` |
| Types/Interfaces | PascalCase | `Property`, `SearchFilters` |
| Enums | PascalCase | `PropertyStatus` |
| Files (component) | kebab-case | `property-card.astro` |
| Files (util/data) | kebab-case | `mock-properties.ts` |
| CSS Classes | kebab-case | `.property-card`, `.btn-primary` |

### Key Principles

- **TypeScript strict mode required** - No implicit `any`, all parameters typed
- **Astro/React components** - Descriptive names, one per file, under 150 LOC
- **DRY & Composition** - Check existing components before creating new ones
- **Vietnamese localization** - Use `formatPrice()`, `formatDate()`, `generateSlug()` utilities
- **Responsive design** - Mobile-first with Tailwind breakpoints
- **Database** - Drizzle ORM, typed queries, explicit column selection
- **Styling** - Tailwind-first, custom CSS only when necessary
- **Navigation Safety** - Always check current URL before navigating to prevent infinite reload loops

### Client-Side Navigation Pattern

**ALWAYS** check if target URL differs from current URL before navigating. This prevents infinite reload loops in filters, dropdowns, and reset buttons.

```javascript
// ✅ CORRECT - Check before navigating
const currentUrl = window.location.pathname + window.location.search;
const targetUrl = '/mua-ban'; // or buildUrl(filters)

if (currentUrl !== targetUrl) {
  window.location.href = targetUrl;  // Navigate only if different
} else {
  // Already on target URL - handle UI state locally
  updateUIState();  // Reset button states, clear form inputs, etc.
}
```

```javascript
// ❌ WRONG - Infinite reload if already on target URL
window.location.href = baseUrl;  // Always navigates, even if already there
```

**Applied In:**
- `src/components/listing/listing-filter.astro` - Clear filters button
- `src/components/listing/sidebar/location-selector.astro` - Province reset
- `src/pages/[...slug].astro` - Sort dropdown option selection

### File Size Limits

| File Type | Max LOC |
|---|---|
| Component | 150 |
| Utility function | 50 |
| Data file | 300 |
| Page layout | 100 |
| Type definitions | 100 |

---

## Document Version

- **Version:** 2.1
- **Last Updated:** 2026-02-08
- **Structure:** Modular (split into 3 files for maintainability)
- **Latest Change:** Added client-side navigation safety pattern to prevent infinite reload loops
