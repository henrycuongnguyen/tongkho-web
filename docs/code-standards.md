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
- **DRY & Composition** - Check existing components before creating new ones (e.g., `ShareButtons` for all share needs)
- **Vietnamese localization** - Use `formatPrice()`, `formatDate()`, `generateSlug()` utilities
- **Responsive design** - Mobile-first with Tailwind breakpoints
- **Database** - Drizzle ORM, typed queries, explicit column selection
- **Styling** - Tailwind-first, custom CSS only when necessary
- **Navigation Safety** - Always check current URL before navigating to prevent infinite reload loops
- **Event Propagation** - Use `onclick="event.stopPropagation()"` to prevent parent link navigation in interactive components (share buttons, compare, favorites)

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
| Shared UI (like ShareButtons) | 300 |

### Reusable UI Components

**ShareButtons (components/ui/share-buttons.astro)**
- Use for all share functionality across cards, articles, detail pages
- Props: `url`, `title`, `variant` (inline/popup), `size` (sm/md/lg), `showLabel`
- Integration: Wrap with `onclick="event.stopPropagation()"` in cards to prevent link navigation
- Platforms: Facebook, Zalo, Twitter/X, Copy Link (clipboard)

### Client-Side Script Patterns

**Compare Manager (scripts/compare-manager.ts)**
- Singleton pattern for localStorage-based state management
- Exports `CompareManager` with methods: `init()`, `add()`, `remove()`, `toggle()`, `getItems()`, `clear()`
- Use `.btn-compare` CSS class for button binding
- Data attributes required: `data-estate-id`, `data-transaction-type`, `data-url`, `data-image`, `data-title`
- XSS Prevention: Sanitize all data attributes via `sanitize()` utility before use
- Event Delegation: Single listener on `document.body` to handle HTMX dynamic content swaps
- Toast Notifications: Use `showToast(message, type)` for user feedback (Vietnamese messages)
- Validation: Enforce max 2 items & same transaction type requirement

**Pattern for Client-Side Scripts:**
```typescript
// Singleton pattern with IIFE (Immediately Invoked Function Expression)
const ManagerName = (() => {
  // Private variables & helper functions
  const init = () => {
    // Setup: event listeners, DOM queries, initialization
    if ((document.body as any).__listenerAttached) return; // Prevent duplicates
    document.body.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      // Handle delegation logic
    });
    (document.body as any).__listenerAttached = true;
  };

  // Public API
  return { init, methodA, methodB };
})();

// Global export for accessibility
if (typeof window !== 'undefined') {
  (window as any).ManagerName = ManagerName;
}
export default ManagerName;
```

**Integration in Astro Layouts:**
1. Import script in `base-layout.astro`
2. Initialize on `DOMContentLoaded` event
3. Re-initialize after HTMX swaps: `document.body.addEventListener('htmx:afterSwap', () => ManagerName.init())`
4. Define CSS classes & data attributes in `global.css` for styling

### Database-First Service Pattern (Utilities)

**Services:** `services/utility/utility-service.ts`

**Pattern:**
```typescript
// Query database first, fallback to defaults
export async function getUtilities(): Promise<Utility[]> {
  try {
    const folderId = await getFolderIdByName('tien-ich-tong-kho');
    if (!folderId) return getDefaultUtilities();

    const rows = await db.select(...).from(news).where(...);
    const utilities = rows.map(mapToUtility);

    // Insert default at index 0 (v1 behavior)
    utilities.unshift(DEFAULT_UTILITY);
    return utilities;
  } catch (error) {
    console.error('Failed to fetch:', error);
    return getDefaultUtilities();  // Graceful fallback
  }
}
```

**Key Principles:**
- Always include fallback defaults for service disruption
- Log errors for debugging but don't expose to client
- Use type-safe mapping functions
- Handle soft-delete pattern: filter `aactive = true`

### Form Configuration Pattern (Hardcoded)

**Files:** `services/utility/form-configs.ts`

**Pattern:**
```typescript
// Static configuration (no DB storage for static forms)
export const FORM_CONFIGS: Record<string, UtilityFormConfig> = {
  CalculatorType: {
    type: 'CalculatorType',
    title: 'Vietnamese Title',
    fields: [
      {
        name: 'fieldName',
        label: 'Vietnamese Label',
        type: 'text' | 'number' | 'select',
        required: true,
        options: [{ value: 'v1', label: 'Label 1' }]
      }
    ]
  }
};

// Export helper functions
export function getFormConfig(type: string) { ... }
export function hasFormConfig(type: string) { ... }
```

**Use When:**
- Form structure is static and rarely changes
- No per-user customization needed
- Configuration is small enough to hardcode

### API Proxy Pattern (Credential Protection)

**File:** `pages/api/utility/calculate.ts`

**Pattern:**
```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Validate input
    const body = await request.json();
    if (!body.type || !body.ownerBirthYear) {
      return error400('Missing required fields');
    }

    // 2. Range validation
    if (body.ownerBirthYear < 1900 || body.ownerBirthYear > 2100) {
      return error400('Invalid birth year');
    }

    // 3. Forward to external API (credentials in server code only)
    const response = await fetch(EXTERNAL_API_URL, {
      headers: { 'x-api-key': SECRET_API_KEY }  // Never exposed to client
    });

    // 4. Return response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return error500('Server error');  // Generic message
  }
};
```

**Key Principles:**
- Validate all inputs before forwarding
- Keep API credentials in server code only
- Return generic error messages (no stack traces)
- Use proper HTTP status codes

### React Component Pattern (Client-Side Logic)

**Files:** `components/utility/utility-form.tsx`, `utility-result.tsx`

**Pattern:**
```typescript
// Client-side validation & submission
export default function UtilityForm({ config }: Props) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Client-side validation
    const newErrors = validateForm(formData, config);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 2. Submit to API proxy
    setLoading(true);
    try {
      const response = await fetch('/api/utility/calculate', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      // 3. Display result
      if (data.status === 1) {
        setResult(data.data.html);
      } else {
        setErrors({ submit: data.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with real-time validation */}
      {/* Loading spinner during submission */}
      {/* Result display with print button */}
    </form>
  );
}
```

**Key Principles:**
- Client-side validation for UX (real-time feedback)
- Server-side validation for security (always double-check)
- Loading states during async operations
- Error display for user feedback (Vietnamese messages)
- Type-safe form data handling

---

## Document Version

- **Version:** 2.4
- **Last Updated:** 2026-03-05
- **Structure:** Modular (split into 3 files for maintainability)
- **Latest Change:** Added utilities patterns - database-first services, hardcoded form configs, API proxy, React form validation
