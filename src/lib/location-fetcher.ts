/**
 * Location Fetcher Module
 * Client-side fetch + cache logic for static JSON location data.
 *
 * Features:
 * - In-memory cache to avoid re-fetching
 * - Version toggle (new/old addresses) via localStorage
 * - Error handling with fallback to empty arrays
 * - Preloading for provinces on page load
 */

import type { LocationItem, DistrictItem, WardItem, AddressVersion } from './location-types';

const BASE_URL = '/data';
const STORAGE_KEY = 'tongkho_use_new_addresses';

// Valid ID pattern (alphanumeric, underscores, hyphens only)
const VALID_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * Validate location ID to prevent path traversal attacks
 */
function isValidId(id: string): boolean {
  return VALID_ID_PATTERN.test(id) && id.length > 0 && id.length <= 50;
}

// In-memory cache
const cache = new Map<string, LocationItem[] | DistrictItem[] | WardItem[]>();

/**
 * Get current address version preference
 * Default: 'old' (legacy addresses)
 * When checkbox checked (true): 'new' (modern addresses)
 */
export function getVersion(): AddressVersion {
  if (typeof localStorage === 'undefined') return 'old';
  return localStorage.getItem(STORAGE_KEY) == 'true' ? 'new' : 'old';
}

/**
 * Set address version preference
 * Stores 'true' when new address mode, otherwise 'false'
 */
export function setVersion(version: AddressVersion): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, version === 'new' ? 'true' : 'false');
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get provinces for current or specified version
 */
export async function getProvinces(version?: AddressVersion): Promise<LocationItem[]> {
  const v = version ?? getVersion();
  const key = `provinces-${v}`;

  if (cache.has(key)) {
    return cache.get(key) as LocationItem[];
  }

  try {
    const res = await fetch(`${BASE_URL}/provinces-${v}.json`);
    if (!res.ok) return [];

    const data: LocationItem[] = await res.json();
    cache.set(key, data);
    return data;
  } catch (error) {
    console.warn(`[LocationFetcher] Failed to fetch provinces (${v}):`, error);
    return [];
  }
}

/**
 * Get districts for a province
 */
export async function getDistricts(
  provinceNId: string,
  version?: AddressVersion
): Promise<DistrictItem[]> {
  // Validate input to prevent path traversal
  if (!isValidId(provinceNId)) {
    console.warn(`[LocationFetcher] Invalid province ID: ${provinceNId}`);
    return [];
  }

  const v = version ?? getVersion();
  const key = `districts-${v}-${provinceNId}`;

  if (cache.has(key)) {
    return cache.get(key) as DistrictItem[];
  }

  try {
    const res = await fetch(`${BASE_URL}/districts/${v}/${provinceNId}.json`);
    if (!res.ok) return []; // 404 = no districts for this province

    const data: DistrictItem[] = await res.json();
    cache.set(key, data);
    return data;
  } catch (error) {
    console.warn(`[LocationFetcher] Failed to fetch districts for ${provinceNId}:`, error);
    return [];
  }
}

/**
 * Get wards for a district
 */
export async function getWards(
  districtNId: string,
  version?: AddressVersion
): Promise<WardItem[]> {
  // Validate input to prevent path traversal
  if (!isValidId(districtNId)) {
    console.warn(`[LocationFetcher] Invalid district ID: ${districtNId}`);
    return [];
  }

  const v = version ?? getVersion();
  const key = `wards-${v}-${districtNId}`;

  if (cache.has(key)) {
    return cache.get(key) as WardItem[];
  }

  try {
    const res = await fetch(`${BASE_URL}/wards/${v}/${districtNId}.json`);
    if (!res.ok) return []; // 404 = no wards for this district

    const data: WardItem[] = await res.json();
    cache.set(key, data);
    return data;
  } catch (error) {
    console.warn(`[LocationFetcher] Failed to fetch wards for ${districtNId}:`, error);
    return [];
  }
}

/**
 * Preload provinces for both versions (call on page load)
 */
export async function preloadProvinces(): Promise<void> {
  await Promise.all([
    getProvinces('new'),
    getProvinces('old'),
  ]);
}

/**
 * Get a province by nId from cached data
 */
export async function getProvinceByNId(
  nId: string,
  version?: AddressVersion
): Promise<LocationItem | undefined> {
  const provinces = await getProvinces(version);
  return provinces.find(p => p.nId === nId);
}

/**
 * Get a district by nId from cached data (requires province context)
 */
export async function getDistrictByNId(
  provinceNId: string,
  districtNId: string,
  version?: AddressVersion
): Promise<DistrictItem | undefined> {
  const districts = await getDistricts(provinceNId, version);
  return districts.find(d => d.nId === districtNId);
}
