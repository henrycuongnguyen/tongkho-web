/**
 * Listing URL Parser
 * Parse v1-compatible URLs: /mua-ban/ha-noi/gia-tu-1-ty-den-2-ty?property_types=12,13
 */

import type { PropertySearchFilters, SortOption } from '@/services/elasticsearch/types';

// Transaction type slug mapping
const TRANSACTION_SLUGS: Record<string, number> = {
  'mua-ban': 1,
  'cho-thue': 2,
  'du-an': 3
};

// Reverse mapping for URL building
const TRANSACTION_TYPE_TO_SLUG: Record<number, string> = {
  1: 'mua-ban',
  2: 'cho-thue',
  3: 'du-an'
};

/**
 * Parse listing URL segments and query params to filters
 */
export function parseListingUrl(
  slugParts: string[],
  searchParams: URLSearchParams
): PropertySearchFilters {
  const filters: PropertySearchFilters = {
    transactionType: 1,  // Default: mua-ban
    page: Number(searchParams.get('page')) || 1,
    pageSize: 20,
    sort: (searchParams.get('sort') as SortOption) || 'newest'
  };

  // Parse slug parts
  if (slugParts.length > 0) {
    const arg1 = slugParts[0];

    // Check if transaction type
    if (TRANSACTION_SLUGS[arg1]) {
      filters.transactionType = TRANSACTION_SLUGS[arg1];
    }
    // Otherwise it might be a property type slug - handled later
  }

  // Parse location (arg2) - SINGLE location only (v1 format)
  // Note: Multi-location selection via 'addresses' param is NOT supported
  const locationSlug = slugParts.length > 1 ? slugParts[1] : null;

  // Store single location for resolution in page component
  if (locationSlug && locationSlug !== 'toan-quoc') {
    // @ts-expect-error - temporary storage for batch resolution
    filters._locationSlugs = [locationSlug]; // Single location only
  }

  // Parse price slug (arg3)
  if (slugParts.length > 2) {
    const priceSlug = slugParts[2];
    const priceRange = parsePriceSlug(priceSlug);
    if (priceRange) {
      filters.minPrice = priceRange.min;
      filters.maxPrice = priceRange.max;
    }
  }

  // Parse query params
  const propertyTypes = searchParams.get('property_types');
  if (propertyTypes) {
    filters.propertyTypes = propertyTypes.split(',').map(Number).filter(n => !isNaN(n));
  }

  // Price query params (override slug)
  const gtn = searchParams.get('gtn');
  if (gtn) {
    filters.minPrice = convertPriceSlugToNumber(gtn);
  }

  const gcn = searchParams.get('gcn');
  if (gcn) {
    filters.maxPrice = convertPriceSlugToNumber(gcn);
  }

  // Area params
  const dtnn = searchParams.get('dtnn');
  if (dtnn) {
    filters.minArea = Number(dtnn);
  }

  const dtcn = searchParams.get('dtcn');
  if (dtcn) {
    filters.maxArea = Number(dtcn);
  }

  // Room params
  const bedrooms = searchParams.get('bedrooms');
  if (bedrooms) {
    filters.bedrooms = Number(bedrooms);
  }

  const bathrooms = searchParams.get('bathrooms');
  if (bathrooms) {
    filters.bathrooms = Number(bathrooms);
  }

  // Radius search
  const radius = searchParams.get('radius');
  if (radius) {
    filters.radius = Number(radius);
  }

  // Province/district IDs (direct) - Use string nIds for ES compatibility
  const provinceIds = searchParams.get('province_ids');
  if (provinceIds) {
    filters.provinceIds = provinceIds.split(',').filter(id => id.trim().length > 0);
  }

  const districtIds = searchParams.get('district_ids');
  if (districtIds) {
    filters.districtIds = districtIds.split(',').filter(id => id.trim().length > 0);
  }

  // Keyword search
  const keyword = searchParams.get('q') || searchParams.get('keyword');
  if (keyword) {
    filters.keyword = keyword;
  }

  return filters;
}

/**
 * Parse price slug like "gia-tu-1-ty-den-2-ty"
 */
function parsePriceSlug(slug: string): { min: number; max: number } | null {
  // "gia-thuong-luong" → negotiable
  if (slug === 'gia-thuong-luong') {
    return { min: 0, max: 0 };
  }

  // "gia-duoi-1-ty" → below 1 billion
  const belowMatch = slug.match(/^gia-duoi-(.+)$/);
  if (belowMatch) {
    return { min: 0, max: convertPriceSlugToNumber(belowMatch[1]) };
  }

  // "gia-tren-5-ty" → above 5 billion
  const aboveMatch = slug.match(/^gia-tren-(.+)$/);
  if (aboveMatch) {
    return { min: convertPriceSlugToNumber(aboveMatch[1]), max: 1_000_000_000_000 };
  }

  // "gia-tu-1-ty-den-2-ty" → range
  const rangeMatch = slug.match(/^gia-tu-(.+)-den-(.+)$/);
  if (rangeMatch) {
    return {
      min: convertPriceSlugToNumber(rangeMatch[1]),
      max: convertPriceSlugToNumber(rangeMatch[2])
    };
  }

  return null;
}

/**
 * Convert price slug to number
 * "1.5-ty" → 1500000000
 * "500-trieu" → 500000000
 */
function convertPriceSlugToNumber(slug: string): number {
  // Handle "1-ty", "1.5-ty", "500-trieu"
  if (slug.endsWith('-ty')) {
    const value = parseFloat(slug.replace('-ty', '').replace(',', '.'));
    return value * 1_000_000_000; // billion
  }
  if (slug.endsWith('-trieu')) {
    const value = parseFloat(slug.replace('-trieu', '').replace(',', '.'));
    return value * 1_000_000; // million
  }
  // Try direct number
  const direct = parseFloat(slug);
  if (!isNaN(direct)) {
    return direct;
  }
  return 0;
}

/**
 * Build listing URL from filters (reverse of parser)
 * Supports multi-location with addresses query param (v1 compatible)
 */
export function buildListingUrl(
  filters: PropertySearchFilters,
  options?: { locationSlugs?: string[] }
): string {
  const parts: string[] = [];

  // Arg1: Transaction type
  const transactionSlug = TRANSACTION_TYPE_TO_SLUG[filters.transactionType] || 'mua-ban';
  parts.push(transactionSlug);

  // Arg2: First location slug (if multi-location, use first one)
  const locationSlugs = options?.locationSlugs || [];
  const firstLocation = locationSlugs.length > 0 ? locationSlugs[0] : 'toan-quoc';
  parts.push(firstLocation);

  // Arg3: Price slug (optional)
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const priceSlug = buildPriceSlug(filters.minPrice, filters.maxPrice);
    if (priceSlug) {
      parts.push(priceSlug);
    }
  }

  // Build base URL
  let url = '/' + parts.join('/');

  // Add query params
  const params = new URLSearchParams();

  // Multi-location: Add addresses param for additional locations (v1 compatible)
  if (locationSlugs.length > 1) {
    const additionalLocations = locationSlugs.slice(1).join(',');
    params.set('addresses', additionalLocations);
  }

  if (filters.propertyTypes?.length) {
    params.set('property_types', filters.propertyTypes.join(','));
  }

  if (filters.minArea) {
    params.set('dtnn', String(filters.minArea));
  }

  if (filters.maxArea) {
    params.set('dtcn', String(filters.maxArea));
  }

  if (filters.bedrooms) {
    params.set('bedrooms', String(filters.bedrooms));
  }

  if (filters.bathrooms) {
    params.set('bathrooms', String(filters.bathrooms));
  }

  if (filters.radius) {
    params.set('radius', String(filters.radius));
  }

  if (filters.provinceIds?.length) {
    params.set('province_ids', filters.provinceIds.join(','));
  }

  if (filters.districtIds?.length) {
    params.set('district_ids', filters.districtIds.join(','));
  }

  if (filters.keyword) {
    params.set('q', filters.keyword);
  }

  if (filters.sort && filters.sort !== 'newest') {
    params.set('sort', filters.sort);
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page));
  }

  const queryString = params.toString();
  if (queryString) {
    url += '?' + queryString;
  }

  return url;
}

/**
 * Build price slug from min/max values
 */
function buildPriceSlug(min?: number, max?: number): string {
  if (min === 0 && max === 0) {
    return 'gia-thuong-luong';
  }

  if (!min && max) {
    return `gia-duoi-${convertNumberToPriceSlug(max)}`;
  }

  if (min && (!max || max >= 1_000_000_000_000)) {
    return `gia-tren-${convertNumberToPriceSlug(min)}`;
  }

  if (min && max && min < max) {
    return `gia-tu-${convertNumberToPriceSlug(min)}-den-${convertNumberToPriceSlug(max)}`;
  }

  return '';
}

/**
 * Convert number to price slug
 */
function convertNumberToPriceSlug(amount: number): string {
  if (amount >= 1_000_000_000) {
    const ty = amount / 1_000_000_000;
    // Format: "1-ty", "1.5-ty"
    const formatted = ty % 1 === 0 ? ty.toString() : ty.toFixed(1);
    return `${formatted}-ty`;
  }
  const trieu = amount / 1_000_000;
  return `${trieu.toFixed(0)}-trieu`;
}

/**
 * Get page title based on filters
 */
export function getPageTitle(filters: PropertySearchFilters): string {
  const typeNames: Record<number, string> = {
    1: 'Mua Bán',
    2: 'Cho Thuê',
    3: 'Dự Án'
  };
  const base = typeNames[filters.transactionType] || 'Bất Động Sản';
  return `${base} - Tongkho BĐS`;
}

/**
 * Get page description based on filters
 */
export function getPageDescription(filters: PropertySearchFilters, total: number): string {
  const typeNames: Record<number, string> = {
    1: 'mua bán nhà đất',
    2: 'cho thuê nhà đất',
    3: 'dự án bất động sản'
  };
  const type = typeNames[filters.transactionType] || 'bất động sản';
  return `Tìm thấy ${total.toLocaleString('vi-VN')} kết quả ${type}. Cập nhật mới nhất trên Tongkho BĐS.`;
}

/**
 * Export v1-compatible URL builder functions
 * Direct port from reference/resaland_v1/static/js/module/search-url-builder.js
 */
export { buildSearchUrl, buildPropertyTypeSlugMap } from '@/services/url/search-url-builder';
export { convertPriceToSlug, buildSlugFromPrice, isAPriceOption } from '@/services/url/price-slug-converter';
