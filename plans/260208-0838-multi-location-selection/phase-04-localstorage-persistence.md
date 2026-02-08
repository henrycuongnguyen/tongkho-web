---
title: "Phase 4: LocalStorage Persistence"
status: pending
priority: P2
effort: 1h
---

# Phase 4: LocalStorage Persistence

## Context Links

- [V1 search-bar-storage.min.js](d:\tongkho-web\reference\resaland_v1\static\js\module\search-bar-storage.min.js)
- [V1 search.js storage functions](d:\tongkho-web\reference\resaland_v1\static\js\module\search.js)

## Overview

Persist selected locations in localStorage using per-tab isolation (same pattern as v1). Restore selection on page load.

## Key Insights

V1 Pattern (from `search-bar-storage.min.js:1-18`):
```javascript
const PREFIX = 'selected-addresses';
let tabId = sessionStorage.getItem('tab-instance-id');
if (!tabId) {
    tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem('tab-instance-id', tabId);
}
window.ADDRESS_STORAGE_KEY = `${PREFIX}-${tabId}`;
```

Benefits:
- Each browser tab has isolated selection state
- Closing tab clears sessionStorage -> key becomes orphan
- User can have different searches in different tabs

## Requirements

### Functional
- Generate unique tab ID on first visit
- Store selected locations: `[{slug, name, fullName, type, nId}, ...]`
- Restore on page load
- Clear when navigating away from listing pages

### Non-Functional
- Use sessionStorage for tab ID (clears on tab close)
- Use localStorage for addresses (persists across navigations)
- Max 10KB storage per key

## Architecture

```
sessionStorage                localStorage
+---------------------+       +--------------------------------+
| tab-instance-id:    |       | selected-addresses-abc123:     |
| abc123              |  -->  | [{slug, name, type, nId}, ...] |
+---------------------+       +--------------------------------+
```

## Related Code Files

### Modify
- `src/components/listing/location-autocomplete.astro`
  - Add storage functions
  - Restore on component mount
  - Sync on selection change

### No Changes Needed
- API endpoints
- URL parser

## Implementation Steps

### Step 1: Add storage utility module

```typescript
// src/utils/location-storage.ts (new file - inline in component for now)

const PREFIX = 'selected-addresses';

function getTabId(): string {
  let tabId = sessionStorage.getItem('tab-instance-id');
  if (!tabId) {
    tabId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem('tab-instance-id', tabId);
  }
  return tabId;
}

function getStorageKey(): string {
  return `${PREFIX}-${getTabId()}`;
}

interface StoredLocation {
  slug: string;
  name: string;
  fullName: string;
  type: string;
  nId: string;
}

function getStoredLocations(): StoredLocation[] {
  try {
    const data = localStorage.getItem(getStorageKey());
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredLocations(locations: StoredLocation[]): void {
  localStorage.setItem(getStorageKey(), JSON.stringify(locations.slice(0, 10)));
}

function clearStoredLocations(): void {
  localStorage.removeItem(getStorageKey());
}
```

### Step 2: Restore on page load

```javascript
// In location-autocomplete.astro <script>

document.addEventListener('DOMContentLoaded', () => {
  // Restore from localStorage
  const stored = getStoredLocations();
  if (stored.length > 0) {
    selectedLocations.push(...stored);
    renderChips();
    updateSearchButton();
  }
});

// Also restore on Astro View Transitions
document.addEventListener('astro:page-load', () => {
  const stored = getStoredLocations();
  if (stored.length > 0) {
    selectedLocations.length = 0; // Clear first
    selectedLocations.push(...stored);
    renderChips();
    updateSearchButton();
  }
});
```

### Step 3: Sync on selection change

```javascript
// Update existing add/remove handlers

function addLocation(location) {
  if (selectedLocations.some(l => l.slug === location.slug)) return;
  if (selectedLocations.length >= 10) return;

  selectedLocations.push(location);
  setStoredLocations(selectedLocations); // Persist
  renderChips();
  updateSearchButton();
}

function removeLocation(slug) {
  const index = selectedLocations.findIndex(l => l.slug === slug);
  if (index > -1) {
    selectedLocations.splice(index, 1);
    setStoredLocations(selectedLocations); // Persist
    renderChips();
    updateSearchButton();
  }
}
```

### Step 4: Clear on navigation away

```javascript
// Clear when navigating to non-listing pages (e.g., homepage, news)
// This prevents stale selections from persisting

document.addEventListener('astro:before-swap', (e) => {
  const newUrl = e.to?.url;
  if (!newUrl) return;

  // Keep selection for listing pages
  if (newUrl.pathname.match(/^\/(mua-ban|cho-thue|du-an)/)) return;

  // Clear for other pages
  clearStoredLocations();
});
```

### Step 5: Handle URL-based initial selection

```javascript
// On page load, check if URL has location -> initialize from URL
function initFromUrl() {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // Check for path location (arg2)
  if (pathParts.length >= 2 && !['mua-ban', 'cho-thue', 'du-an'].includes(pathParts[1])) {
    // TODO: Would need location data from SSR or API call
    // For MVP, just use localStorage restoration
  }

  // Check for addresses param
  const addresses = url.searchParams.get('addresses');
  if (addresses) {
    // TODO: Same as above - need location data
  }
}
```

## Todo List

- [ ] Add getTabId() with sessionStorage
- [ ] Add getStoredLocations() from localStorage
- [ ] Add setStoredLocations() to localStorage
- [ ] Restore selections on page load
- [ ] Restore on Astro View Transition
- [ ] Persist on add/remove
- [ ] Clear when navigating away from listing
- [ ] Handle storage quota exceeded gracefully
- [ ] Test multi-tab isolation
- [ ] Test persistence across navigations

## Success Criteria

- [ ] Tab A and Tab B have independent selections
- [ ] Selection persists after page refresh (same tab)
- [ ] Selection clears when navigating to homepage
- [ ] Max 10 locations persisted
- [ ] No localStorage errors on quota exceeded

## Security Considerations

- Validate stored data structure on parse
- Limit stored data size (max 10 locations)
- Don't store sensitive data

## Next Steps

Phase 5 will integrate all components and test end-to-end flow.
