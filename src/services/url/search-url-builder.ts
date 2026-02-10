/**
 * Client-side URL builder for search functionality
 * Direct port from v1: reference/resaland_v1/static/js/module/search-url-builder.js
 * Eliminates the need for API calls to build_search_url
 */

import type { SearchFilters, PropertyTypeSlugMap } from '@/types/search-filters';
import {
  buildSlugFromPrice,
  isAPriceOption,
  convertPriceToSlug,
} from './price-slug-converter';

/**
 * Get property type slug from ID using cached data from DOM
 * v1 reference: lines 226-237
 */
function getPropertyTypeSlug(
  propertyTypeId: string,
  slugMap?: PropertyTypeSlugMap
): string | null {
  // Use provided slug map if available
  if (slugMap && slugMap[propertyTypeId]) {
    return slugMap[propertyTypeId];
  }

  // Try to get from property type checkboxes in the filter
  if (typeof document !== 'undefined') {
    const checkbox = document.querySelector(
      `.widget-type input[value="${propertyTypeId}"]`
    ) as HTMLInputElement;
    if (checkbox) {
      const slug = checkbox.dataset.slug;
      if (slug) return slug;
    }

    // Fallback mapping for common types
    const fallbackMap = (window as any).propertyTypeSlugMap || {};
    return fallbackMap[propertyTypeId] || null;
  }

  return null;
}

/**
 * Build property type slug map from DOM elements
 * Used client-side to extract slugs from checkboxes
 */
export function buildPropertyTypeSlugMap(): PropertyTypeSlugMap {
  const map: PropertyTypeSlugMap = {};

  if (typeof document === 'undefined') return map;

  const checkboxes = document.querySelectorAll<HTMLInputElement>(
    '.widget-type input[type="checkbox"]'
  );
  checkboxes.forEach((checkbox) => {
    const typeId = checkbox.value;
    const slug = checkbox.dataset.slug;
    if (typeId && slug) {
      map[typeId] = slug;
    }
  });

  return map;
}

/**
 * Build search URL from parameters - client-side implementation
 * v1 reference: lines 109-221
 *
 * @param data - Search parameters
 * @param propertyTypeSlugMap - Optional property type slug mapping
 * @returns Complete search URL
 */
export function buildSearchUrl(
  data: SearchFilters,
  propertyTypeSlugMap?: PropertyTypeSlugMap
): string {
  const transactionType = data.transaction_type || '1';
  const selectedAddresses = data.selected_addresses || '';
  const radius = data.radius || '';
  const bathrooms = data.bathrooms || '';
  const bedrooms = data.bedrooms || '';
  let minPrice = data.min_price || '';
  let maxPrice = data.max_price || '';
  let minArea = data.min_area || '';
  let maxArea = data.max_area || '';
  const propertyTypes = String(data.property_types || '');
  const sort = data.sort || '';
  const streetName = data.street_name || '';
  const isVerified = data.is_verified || '';

  const args: string[] = [];
  const params: Record<string, string> = {};

  // Determine url_arg_1 (transaction type or property type slug)
  // v1 reference: lines 127-154
  let urlArg1 = '';

  // Check if single property type selected - use its slug
  if (propertyTypes) {
    const propertyTypeIds = propertyTypes.split(',');
    if (propertyTypeIds.length === 1) {
      const slug = getPropertyTypeSlug(propertyTypeIds[0], propertyTypeSlugMap);
      if (slug) {
        urlArg1 = slug;
      }
    }
  }

  // Fallback to transaction type
  if (!urlArg1) {
    if (transactionType === '3') {
      urlArg1 = 'du-an';
    } else if (transactionType === '2') {
      urlArg1 = 'cho-thue';
    } else {
      urlArg1 = 'mua-ban';
    }

    if (propertyTypes) {
      params.property_types = propertyTypes;
    }
  }

  args.push(urlArg1);

  // Determine url_arg_2 (location)
  // v1 reference: lines 158-168
  let urlArg2 = '';
  if (selectedAddresses) {
    const addressList = selectedAddresses.split(',');
    if (addressList.length === 1) {
      urlArg2 = addressList[0];
    } else if (addressList.length > 1) {
      urlArg2 = addressList[0];
      params.addresses = addressList.slice(1).join(',');
    }
  }

  // Add optional params
  // v1 reference: lines 170-176
  if (radius) params.radius = String(radius);
  if (bathrooms) params.bathrooms = String(bathrooms);
  if (sort && sort !== 'newest') params.sort = sort;
  if (streetName) params.street_name = streetName;
  if (bedrooms) params.bedrooms = String(bedrooms);
  if (isVerified) params.is_verified = String(isVerified);

  // Determine url_arg_3 (price)
  // v1 reference: lines 178-189
  let urlArg3 = '';
  if (isAPriceOption(transactionType, minPrice, maxPrice)) {
    urlArg3 = buildSlugFromPrice(minPrice, maxPrice);
  } else {
    if (
      minPrice !== null &&
      minPrice !== '' &&
      minPrice !== '0' &&
      parseInt(String(minPrice)) > 0
    ) {
      params.gtn = convertPriceToSlug(minPrice);
    }
    if (
      maxPrice !== null &&
      maxPrice !== '' &&
      maxPrice !== '1000000000000' &&
      parseInt(String(maxPrice)) < 1000000000000
    ) {
      params.gcn = convertPriceToSlug(maxPrice);
    }
  }

  // Area params
  // v1 reference: lines 191-197
  if (
    minArea !== null &&
    minArea !== '' &&
    minArea !== '0' &&
    parseInt(String(minArea)) > 0
  ) {
    params.dtnn = String(minArea);
  }
  if (
    maxArea !== null &&
    maxArea !== '' &&
    maxArea !== '1000000000000' &&
    parseInt(String(maxArea)) < 1000000000000
  ) {
    params.dtcn = String(maxArea);
  }

  // If price slug exists but no location, use 'toan-quoc'
  // v1 reference: lines 199-202
  if (urlArg3 && !urlArg2) {
    urlArg2 = 'toan-quoc';
  }

  if (urlArg2) args.push(urlArg2);
  if (urlArg3) args.push(urlArg3);

  // Build final URL
  // v1 reference: lines 207-220
  let url = '/' + args.join('/');

  // Add query params
  const paramString = Object.entries(params)
    .filter(([_, v]) => v !== '' && v !== null && v !== undefined)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  if (paramString) {
    url += '?' + paramString;
  }

  // Don't encode commas in addresses param
  return url.replace(/%2C/g, ',');
}

// Export for use in other modules (v1 reference: lines 240-243)
if (typeof window !== 'undefined') {
  (window as any).buildSearchUrl = buildSearchUrl;
  (window as any).buildPropertyTypeSlugMap = buildPropertyTypeSlugMap;
  (window as any).convertPriceToSlug = convertPriceToSlug;
  (window as any).isAPriceOption = isAPriceOption;
  (window as any).buildSlugFromPrice = buildSlugFromPrice;
}
