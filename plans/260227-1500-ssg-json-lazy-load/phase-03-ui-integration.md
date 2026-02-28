# Phase 03: UI Component Integration

```yaml
status: completed
priority: high
effort: 3h
blockedBy: [phase-02]
```

## Overview

Integrate client fetcher with existing Astro components. Replace HTMX API calls with client-side fetch + render.

## Scope

**In scope:** `horizontal-search-bar.astro` only
**Out of scope:** Sidebar components (future phase)

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/listing/horizontal-search-bar.astro` | Client fetch districts (line 193 has `hx-swap`) |
| Add inline `<script>` | Fetch + render logic |

## Current Flow (HTMX)

```
Toggle checkbox → hx-get="/api/location/provinces" → Server render HTML → HTMX swap
```

## New Flow (Client Fetch)

```
Toggle checkbox → JS fetch("/data/provinces-{version}.json") → JS render HTML → DOM update
```

## Implementation

### Horizontal Search Bar Script (horizontal-search-bar.astro)

```html
<script>
  import { getDistricts, getVersion } from '@/lib/location-fetcher';

  const searchBar = document.querySelector('[data-search-bar]');
  const districtContainer = document.querySelector('[data-district-list-container]');
  const loadingEl = document.querySelector('[data-district-loading]');

  // Listen for province selection
  document.addEventListener('province-selected', async (e) => {
    const { provinceNId } = e.detail;
    if (!provinceNId) return;

    // Show loading
    loadingEl?.classList.remove('hidden');

    const version = getVersion();
    const districts = await getDistricts(provinceNId, version);

    // Hide loading
    loadingEl?.classList.add('hidden');

    // Render districts grid (matching existing HTML structure)
    districtContainer.innerHTML = `
      <div class="grid grid-cols-4 gap-2">
        ${districts.map(d => `
          <label class="flex items-center gap-2 py-2 px-2 rounded hover:bg-secondary-50 cursor-pointer">
            <input type="checkbox" value="${d.slug}" data-nid="${d.nId}"
              class="w-4 h-4 rounded border-secondary-300 text-primary-600">
            <span class="text-sm text-secondary-700">${d.name}</span>
          </label>
        `).join('')}
      </div>
    `;
  });
</script>
```

**Note:** `horizontal-search-bar.astro` line 193 có `hx-swap="innerHTML"` cần remove.

### 3. Version Toggle Handler

```typescript
// In location-selector.astro
function handleVersionToggle(newVersion: AddressVersion) {
  setVersion(newVersion);
  // Clear current selection
  selectedProvinces = [];
  selectedDistricts = [];
  // Re-render with new version
  renderProvinces();
  districtDropdown.innerHTML = ''; // Clear districts
}
```

## Remove HTMX Dependencies

Current HTMX attributes to remove:
```html
<!-- Remove these -->
hx-get="/api/location/provinces"
hx-target="#province-list"
hx-trigger="change"
hx-swap="innerHTML"
```

## Keep Server-Side Rendering For

- Initial page load (SEO) - provinces pre-rendered in HTML
- Listing page results (SSR) - keep existing flow

## Hybrid Approach

```
┌─────────────────────────────────────────┐
│ Initial Load (SSR)                      │
│ - Pre-render province buttons in HTML   │
│ - No JS needed for first paint          │
├─────────────────────────────────────────┤
│ After Interaction (Client)              │
│ - Toggle version → fetch JSON           │
│ - Select province → fetch districts     │
│ - Select district → fetch wards         │
└─────────────────────────────────────────┘
```

## TODO

- [x] Add client script to `horizontal-search-bar.astro`
- [x] Remove HTMX attribute (line 193: `hx-swap="innerHTML"`)
- [x] Test province selection → district loading
- [x] Test version toggle behavior
- [x] Verify existing event dispatching works

## Future (Out of Scope)

- [ ] `province-selector-modal.astro` - Province toggle
- [ ] `location-selector.astro` - District cascade
