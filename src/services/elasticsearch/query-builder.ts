/**
 * ElasticSearch Query Builder
 * Builds ES queries from PropertySearchFilters
 */

import type { PropertySearchFilters, ESQuery, SortOption } from './types';

// Fields to return from ES - real_estate index
const SOURCE_FIELDS = [
  'id', 'title', 'slug', 'transaction_type', 'property_type_id',
  'property_type_name', 'price', 'price_description', 'area',
  'bedrooms', 'bathrooms', 'street_address', 'address',
  'district', 'district_name', 'city', 'city_name',
  'province_id', 'district_id', 'main_image', 'thumbnail',
  'images', 'created_on', 'created_time', 'updated_on',
  'location', 'is_verified', 'is_featured', 'source_post'
];

// Fields to return from ES - project index
const PROJECT_SOURCE_FIELDS = [
  'id', 'project_name', 'slug', 'project_code', 'project_type',
  'price', 'price_description', 'project_area',
  'street_address', 'address', 'district', 'district_name',
  'city', 'city_name', 'city_id', 'district_id', 'ward_id',
  'main_image', 'gallery_images', 'master_plan_images',
  'created_on', 'created_time', 'updated_on',
  'location', 'is_verified', 'is_featured', 'developer_name', 'developer_logo'
];

/**
 * Build ElasticSearch query from filters
 */
export function buildPropertyQuery(filters: PropertySearchFilters): ESQuery {
  const {
    transactionType,
    propertyTypes = [],
    provinceIds = [],
    districtIds = [],
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    bedrooms,
    bathrooms,
    radius,
    centerLat,
    centerLon,
    keyword,
    sort = 'newest',
    page = 1,
    pageSize = 24
  } = filters;

  // Check if querying project index (transaction_type=3)
  const isProjectQuery = transactionType === 3;

  // Must conditions (required)
  const must: unknown[] = [];

  // Transaction type filter - only for real_estate index, not project index
  if (!isProjectQuery) {
    must.push({ term: { transaction_type: transactionType } });
  }

  // Property types filter
  if (propertyTypes.length > 0) {
    must.push({
      terms: { property_type_id: propertyTypes }
    });
  }

  // Location filters - districts take priority over provinces
  if (districtIds.length > 0) {
    must.push({
      terms: { district_id: districtIds }
    });
  } else if (provinceIds.length > 0) {
    must.push({
      terms: { province_id: provinceIds }
    });
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceRange: Record<string, number> = {};
    if (minPrice !== undefined && minPrice > 0) {
      priceRange.gte = minPrice;
    }
    if (maxPrice !== undefined && maxPrice > 0 && maxPrice < 1_000_000_000_000) {
      priceRange.lte = maxPrice;
    }
    if (Object.keys(priceRange).length > 0) {
      must.push({ range: { price: priceRange } });
    }
  }

  // Area range
  if (minArea !== undefined || maxArea !== undefined) {
    const areaRange: Record<string, number> = {};
    if (minArea !== undefined && minArea > 0) {
      areaRange.gte = minArea;
    }
    if (maxArea !== undefined && maxArea > 0 && maxArea < 1_000_000) {
      areaRange.lte = maxArea;
    }
    if (Object.keys(areaRange).length > 0) {
      must.push({ range: { area: areaRange } });
    }
  }

  // Bedrooms
  if (bedrooms !== undefined && bedrooms > 0) {
    must.push({ term: { bedrooms } });
  }

  // Bathrooms
  if (bathrooms !== undefined && bathrooms > 0) {
    must.push({ term: { bathrooms } });
  }

  // Keyword search (Vietnamese text)
  if (keyword && keyword.trim()) {
    must.push({
      multi_match: {
        query: keyword.trim(),
        fields: ['title^2', 'address', 'street_address', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO'
      }
    });
  }

  // Radius search (geo_distance)
  if (radius && centerLat && centerLon) {
    must.push({
      geo_distance: {
        distance: `${radius}km`,
        location: {
          lat: centerLat,
          lon: centerLon
        }
      }
    });
  }

  // Build sort configuration
  const sortConfig = buildSort(sort);

  // Build final query
  const finalQuery = {
    query: {
      bool: {
        must,
        filter: [
          // Only active properties
          { term: { aactive: true } }
        ]
      }
    },
    from: (page - 1) * pageSize,
    size: pageSize,
    sort: sortConfig,
    _source: isProjectQuery ? PROJECT_SOURCE_FIELDS : SOURCE_FIELDS,
    // Track accurate total hits (ES 7.x+ caps at 10k by default)
    track_total_hits: true
  };

  // console.log('[ES Query Builder] Final ES query:', JSON.stringify(finalQuery, null, 2));

  return finalQuery;
}

/**
 * Build sort configuration based on sort option
 */
function buildSort(sort: SortOption): unknown[] {
  switch (sort) {
    case 'oldest':
      return [{ created_on: 'asc' }];
    case 'price_asc':
      return [{ price: 'asc' }, { created_on: 'desc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { created_on: 'desc' }];
    case 'area_asc':
      return [{ area: 'asc' }, { created_on: 'desc' }];
    case 'area_desc':
      return [{ area: 'desc' }, { created_on: 'desc' }];
    case 'newest':
    default:
      return [{ created_on: 'desc' }];
  }
}
