# Phase 02: Client Fetcher Module

```yaml
status: completed
priority: high
effort: 2h
blockedBy: [phase-01]
```

## Overview

Create client-side TypeScript module for fetching and caching location JSON data.

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/location-fetcher.ts` | Fetch + cache logic |
| `src/lib/location-types.ts` | Client-side types (subset) |

## Implementation

### 1. Types (`src/lib/location-types.ts`)

```typescript
// Simplified client-side types (no DB fields)
export interface LocationItem {
  nId: string;
  name: string;
  slug: string;
  propertyCount?: number;
  displayOrder?: number;
}

export type AddressVersion = 'new' | 'old';
```

### 2. Fetcher (`src/lib/location-fetcher.ts`)

```typescript
const BASE_URL = '/data';
const cache = new Map<string, LocationItem[]>();

export async function getProvinces(version: AddressVersion): Promise<LocationItem[]> {
  const key = `provinces-${version}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`${BASE_URL}/provinces-${version}.json`);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

export async function getDistricts(provinceNId: string, version: AddressVersion): Promise<LocationItem[]> {
  const key = `districts-${version}-${provinceNId}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`${BASE_URL}/districts/${version}/${provinceNId}.json`);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

export async function getWards(districtNId: string, version: AddressVersion): Promise<LocationItem[]> {
  const key = `wards-${version}-${districtNId}`;
  if (cache.has(key)) return cache.get(key)!;

  const res = await fetch(`${BASE_URL}/wards/${version}/${districtNId}.json`);
  const data = await res.json();
  cache.set(key, data);
  return data;
}

export function clearCache(): void {
  cache.clear();
}

export function getVersion(): AddressVersion {
  return localStorage.getItem('tongkho_use_new_addresses') === 'true' ? 'new' : 'old';
}

export function setVersion(version: AddressVersion): void {
  localStorage.setItem('tongkho_use_new_addresses', version === 'new' ? 'true' : 'false');
}
```

## Features

1. **In-memory cache:** Avoid re-fetching same data
2. **Version toggle:** `getVersion()` / `setVersion()`
3. **Error handling:** 404 returns empty array
4. **Preloading:** Optional `preloadProvinces()` on page load

## Error Handling

```typescript
export async function getDistricts(provinceNId: string, version: AddressVersion): Promise<LocationItem[]> {
  try {
    const res = await fetch(`${BASE_URL}/districts/${version}/${provinceNId}.json`);
    if (!res.ok) return []; // 404 = no districts
    return await res.json();
  } catch {
    console.warn(`Failed to fetch districts for ${provinceNId}`);
    return [];
  }
}
```

## TODO

- [x] Create `src/lib/location-types.ts`
- [x] Create `src/lib/location-fetcher.ts`
- [x] Add error handling with fallback
- [x] Test with generated JSON files
- [x] Verify cache behavior
