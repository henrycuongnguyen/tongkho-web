# Phase 5: Page Routes

## Overview
- **Priority**: High
- **Status**: Pending
- **Effort**: 1.5h

## Context Links
- [Existing comparison page](../../src/pages/tienich/so-sanh.astro)
- [Main layout](../../src/layouts/main-layout.astro)
- [v1 routing](../../reference/resaland_v1/controllers/tienich.py)

## Key Insights

### v1 URL Structure
- `/tienich` - Index, redirects to first utility
- `/tienich/{slug}` - Dynamic utility page
- `/tienich/so-sanh` - Property comparison (already exists)

### Page Structure
```
┌─────────────────────────────────────────────────┐
│ Header                                          │
├─────────────────────────────────────────────────┤
│ Breadcrumb: Trang chủ > Tiện ích > {name}      │
├──────────────┬──────────────────────────────────┤
│   Sidebar    │    Content Area                  │
│   (menu)     │    - Form                        │
│              │    - Result                      │
├──────────────┴──────────────────────────────────┤
│ Footer                                          │
└─────────────────────────────────────────────────┘
```

### Rendering Strategy
- **Index page**: SSG redirect to first utility
- **Dynamic pages**: SSR (fetch form config at request time)
- **Comparison**: SSG (existing, client-side only)

## Requirements

### Functional
- `/tienich` redirects to first utility
- `/tienich/{slug}` renders utility form
- `/tienich/so-sanh` continues working (unchanged)
- Breadcrumb navigation
- SEO meta tags

### Non-Functional
- Fast page load
- Mobile responsive layout
- View transitions support

## Related Code Files

### Files to Create
1. `src/pages/tienich/index.astro`
2. `src/pages/tienich/[slug].astro`

### Files Unchanged
- `src/pages/tienich/so-sanh.astro` (existing)

## Implementation Steps

### Step 1: Create index.astro (redirect)

```astro
---
/**
 * Utilities Index Page
 * Redirects to first utility (or comparison if none available)
 */
import { getUtilities } from '@/services/utility';

const utilities = await getUtilities();

// Get first non-comparison utility, fallback to comparison
const firstUtility = utilities.find(u => u.slug !== 'so-sanh') || utilities[0];
const redirectUrl = `/tienich/${firstUtility?.slug || 'so-sanh'}`;

return Astro.redirect(redirectUrl, 302);
---
```

### Step 2: Create [slug].astro (dynamic page)

```astro
---
/**
 * Dynamic Utility Page
 * /tienich/{slug}
 *
 * SSR: Fetches form config at request time
 */
import MainLayout from '@/layouts/main-layout.astro';
import UtilitySidebar from '@/components/utility/utility-sidebar.astro';
import UtilityForm from '@/components/utility/utility-form';
import UtilityResult from '@/components/utility/utility-result';
import { getUtilities, getUtilityBySlug, getFormConfig } from '@/services/utility';

// Get slug from URL
const { slug } = Astro.params;

// Redirect comparison to existing page
if (slug === 'so-sanh') {
  return Astro.redirect('/tienich/so-sanh', 302);
}

// Fetch data
const utilities = await getUtilities();
const currentUtility = await getUtilityBySlug(slug || '');

// 404 if utility not found
if (!currentUtility) {
  return Astro.redirect('/404', 302);
}

// Get form config
const formConfig = await getFormConfig(currentUtility.description);

// Page metadata
const title = `${currentUtility.name} | Tiện ích | TongkhoBDS`;
const description = formConfig?.description || `Công cụ ${currentUtility.name} - TongkhoBDS`;

// Breadcrumbs
const breadcrumbs = [
  { name: 'Trang chủ', url: '/' },
  { name: 'Tiện ích', url: '/tienich' },
  { name: currentUtility.name, url: `/tienich/${slug}` },
];
---

<MainLayout title={title} description={description}>
  <div class="container mx-auto px-4 py-6">
    <!-- Breadcrumb -->
    <nav class="text-sm text-slate-500 mb-6">
      {breadcrumbs.map((crumb, index) => (
        <>
          {index > 0 && <span class="mx-2">/</span>}
          {index === breadcrumbs.length - 1 ? (
            <span class="text-slate-700">{crumb.name}</span>
          ) : (
            <a href={crumb.url} class="hover:text-orange-500">{crumb.name}</a>
          )}
        </>
      ))}
    </nav>

    <h1 class="text-2xl font-bold text-slate-800 mb-6">{currentUtility.name}</h1>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Sidebar -->
      <aside class="lg:col-span-1">
        <UtilitySidebar utilities={utilities} currentSlug={slug || ''} />
      </aside>

      <!-- Main Content -->
      <main class="lg:col-span-3">
        {formConfig ? (
          <div id="utility-app">
            <!-- React island for interactive form -->
            <UtilityForm config={formConfig} onResult={() => {}} client:load />
            <div id="utility-result"></div>
          </div>
        ) : (
          <div class="bg-white rounded-lg shadow-sm p-6 text-center">
            <svg class="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-slate-600">Không tìm thấy form cho tiện ích này.</p>
            <a href="/tienich" class="inline-block mt-4 text-orange-500 hover:underline">
              Quay lại danh sách
            </a>
          </div>
        )}
      </main>
    </div>
  </div>
</MainLayout>

<script>
  // Handle form result callback
  // The UtilityForm component calls window.showUtilityResult(html)
  import UtilityResult from '@/components/utility/utility-result';
  import { createRoot } from 'react-dom/client';
  import { createElement } from 'react';

  let resultRoot: any = null;

  window.showUtilityResult = (html: string) => {
    const container = document.getElementById('utility-result');
    if (!container) return;

    if (!resultRoot) {
      resultRoot = createRoot(container);
    }

    resultRoot.render(createElement(UtilityResult, { html }));
  };

  // Clear result on page navigation
  document.addEventListener('astro:before-swap', () => {
    if (resultRoot) {
      resultRoot.unmount();
      resultRoot = null;
    }
  });
</script>

<style>
  /* Ensure proper spacing on mobile */
  @media (max-width: 1023px) {
    aside {
      order: 2;
    }
    main {
      order: 1;
    }
  }
</style>
```

### Step 3: Update UtilityForm to call global callback

Modify `utility-form.tsx` to use global callback:

```tsx
// In handleSubmit success case:
if (data.status === 1 && data.data?.html) {
  // Call global function to render result
  if (typeof window !== 'undefined' && (window as any).showUtilityResult) {
    (window as any).showUtilityResult(data.data.html);
  }
}
```

### Step 4: Add Astro config for SSR

Ensure `astro.config.mjs` has SSR support:

```js
export default defineConfig({
  output: 'hybrid', // or 'server' for full SSR
  // ... other config
});
```

For the utility pages, add `export const prerender = false;` to enable SSR.

## Todo List

- [ ] Create `src/pages/tienich/index.astro`
- [ ] Create `src/pages/tienich/[slug].astro`
- [ ] Update UtilityForm with global callback
- [ ] Verify existing so-sanh.astro works
- [ ] Test navigation between utilities
- [ ] Verify breadcrumbs
- [ ] Test 404 handling

## Success Criteria

- [ ] `/tienich` redirects to first utility
- [ ] `/tienich/{slug}` shows correct form
- [ ] `/tienich/so-sanh` still works
- [ ] Sidebar shows all utilities
- [ ] Active state correct in sidebar
- [ ] Breadcrumb navigation works
- [ ] 404 for invalid slugs
- [ ] Mobile layout correct

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SSR slow | Cache form configs |
| Form hydration fails | Fallback to static message |
| Navigation conflicts | Test all routes |

## Security Considerations

- Validate slug parameter
- Sanitize any user input
- Proper redirect status codes

## Next Steps

Proceed to phase-06-testing-polish.md
