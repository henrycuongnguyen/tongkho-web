---
title: "Phase 3: Autocomplete Multi-Select with Chips UI"
status: pending
priority: P1
effort: 2h
---

# Phase 3: Autocomplete Multi-Select with Chips UI

## Context Links

- [location-autocomplete.astro](d:\tongkho-web\src\components\listing\location-autocomplete.astro)
- [api/location/search.ts](d:\tongkho-web\src\pages\api\location\search.ts)
- [V1 search.js address handling](d:\tongkho-web\reference\resaland_v1\static\js\module\search.js)

## Overview

Transform the existing single-select autocomplete into a multi-select component with removable chips displaying selected locations.

## Key Insights

V1 UI Pattern (from `search-bar-storage.min.js:46-49`):
```javascript
if (addresses.length === 1) {
    selectedDistrictsContainer.innerHTML = '<p class="selected-district">' + addresses[0].title + '</p>';
} else {
    selectedDistrictsContainer.innerHTML = '<p class="selected-district">Da chon ' + addresses.length + ' dia diem</p>';
}
```

V1 Data Structure:
```javascript
addresses = [{slug: 'ha-noi', title: 'Ha Noi', type: 'province', nId: 'VN-HN'}, ...]
```

## Requirements

### Functional
- Click autocomplete result -> add to selected list (don't navigate)
- Display selected locations as chips with X button
- Click X -> remove from selection
- Click "Tim kiem" button -> navigate with all locations
- Show "Da chon X dia diem" summary when > 1

### Non-Functional
- HTMX for dropdown (existing)
- Vanilla JS for chip management (minimal JS)
- Store in localStorage for persistence (Phase 4)
- Max 10 locations

## Architecture

```
+-----------------------------------+
| [Input: Search location...     ] |
| +-------------------------------+ |
| | Chips: [Ha Noi X] [Cau Giay X]| |
| +-------------------------------+ |
| +-------------------------------+ |
| | Dropdown Results              | |
| | > Hoan Kiem                   | |
| | > Ba Dinh                     | |
| +-------------------------------+ |
| [        Tim kiem            ]   |
+-----------------------------------+
```

## Related Code Files

### Modify
- `src/components/listing/location-autocomplete.astro`
  - Add chips container
  - Change result click from navigation to selection
  - Add "Tim kiem" button
  - Add chip removal logic

- `src/pages/api/location/search.ts`
  - Return `data-*` attributes for JS (nId, slug, name, type)
  - Change `<a href>` to `<button>` or `<div role="button">`

### Create
- None (inline in component)

## Implementation Steps

### Step 1: Update API to return button elements

```typescript
// In api/location/search.ts
const html = results.map(r => {
  const href = r.type === 'project' ? `/du-an/${r.slug}` : `${baseUrl}/${r.slug}`;
  const icon = TYPE_ICONS[r.type] || '';

  // Return button instead of link for multi-select mode
  return `
    <button type="button"
       class="location-result-item flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-0"
       data-slug="${escapeHtml(r.slug)}"
       data-name="${escapeHtml(r.name)}"
       data-full-name="${escapeHtml(r.fullName)}"
       data-type="${escapeHtml(r.type)}"
       data-nid="${escapeHtml(r.id)}"
       data-href="${escapeHtml(href)}">
      <span class="text-lg">${icon}</span>
      <div class="flex-1 min-w-0">
        <div class="font-medium text-slate-800 truncate">${escapeHtml(r.name)}</div>
        <div class="text-sm text-slate-500 truncate">${escapeHtml(r.fullName)}</div>
      </div>
    </button>`;
}).join('');
```

### Step 2: Add chips container to component

```astro
<div class="location-autocomplete relative" data-location-autocomplete data-base-url={baseUrl}>
  <!-- Chips Container -->
  <div class="location-chips flex flex-wrap gap-1 mb-2 empty:hidden" data-location-chips></div>

  <!-- Input -->
  <input type="text" ... />

  <!-- Results Dropdown -->
  <div id="location-results" ...></div>

  <!-- Search Button (new) -->
  <button
    type="button"
    class="w-full mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors hidden"
    data-location-search-btn
  >
    Tim kiem
  </button>
</div>
```

### Step 3: Add chip HTML template

```javascript
function createChipHtml(location) {
  return `
    <span class="location-chip inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
          data-slug="${location.slug}">
      <span>${location.name}</span>
      <button type="button" class="chip-remove hover:text-primary-900" data-remove-slug="${location.slug}">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </span>
  `;
}
```

### Step 4: JavaScript for multi-select logic

```javascript
// Selection state
const selectedLocations = []; // Will be synced with localStorage in Phase 4

// Result item click -> add to selection
document.addEventListener('click', (e) => {
  const resultItem = e.target.closest('.location-result-item');
  if (!resultItem) return;

  const location = {
    slug: resultItem.dataset.slug,
    name: resultItem.dataset.name,
    fullName: resultItem.dataset.fullName,
    type: resultItem.dataset.type,
    nId: resultItem.dataset.nid
  };

  // Check if already selected
  if (selectedLocations.some(l => l.slug === location.slug)) return;

  // Limit to 10
  if (selectedLocations.length >= 10) {
    alert('Toi da 10 dia diem');
    return;
  }

  // Add to selection
  selectedLocations.push(location);
  renderChips();
  updateSearchButton();

  // Clear dropdown
  document.getElementById('location-results').innerHTML = '';
});

// Chip X button -> remove from selection
document.addEventListener('click', (e) => {
  const removeBtn = e.target.closest('.chip-remove');
  if (!removeBtn) return;

  const slug = removeBtn.dataset.removeSlug;
  const index = selectedLocations.findIndex(l => l.slug === slug);
  if (index > -1) {
    selectedLocations.splice(index, 1);
    renderChips();
    updateSearchButton();
  }
});

// Search button -> navigate with all locations
searchBtn.addEventListener('click', () => {
  if (selectedLocations.length === 0) return;

  const slugs = selectedLocations.map(l => l.slug);
  const firstSlug = slugs[0];
  const restSlugs = slugs.slice(1);

  let url = `${baseUrl}/${firstSlug}`;
  if (restSlugs.length > 0) {
    url += `?addresses=${restSlugs.join(',')}`;
  }

  window.location.href = url;
});

function renderChips() {
  const container = document.querySelector('[data-location-chips]');
  container.innerHTML = selectedLocations.map(createChipHtml).join('');
}

function updateSearchButton() {
  const btn = document.querySelector('[data-location-search-btn]');
  btn.classList.toggle('hidden', selectedLocations.length === 0);

  if (selectedLocations.length === 1) {
    btn.textContent = `Tim kiem tai ${selectedLocations[0].name}`;
  } else if (selectedLocations.length > 1) {
    btn.textContent = `Tim kiem tai ${selectedLocations.length} dia diem`;
  }
}
```

## Todo List

- [ ] Update API to return button elements with data attributes
- [ ] Add chips container above input
- [ ] Add "Tim kiem" button below dropdown
- [ ] Implement result item click -> add to selection
- [ ] Implement chip X button -> remove
- [ ] Implement search button -> navigate with URL
- [ ] Show/hide search button based on selection count
- [ ] Limit to 10 locations with user feedback
- [ ] Style chips with Tailwind
- [ ] Test click interactions
- [ ] Verify URL generation matches v1 pattern

## Success Criteria

- [ ] Click result adds to chips (no navigation)
- [ ] X button removes chip
- [ ] Search button visible when > 0 selected
- [ ] Search navigates to correct URL with addresses param
- [ ] Max 10 locations enforced
- [ ] UI matches design (chips, button styling)

## Security Considerations

- Escape all user data in chip HTML
- Validate slugs before URL navigation
- Limit selection to 10 locations

## Next Steps

Phase 4 will add localStorage persistence for selected locations.
