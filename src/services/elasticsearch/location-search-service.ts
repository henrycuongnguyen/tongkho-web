/**
 * Location Search Service
 * Search locations (provinces, districts, wards) and projects via ElasticSearch
 */

import type { LocationSearchResult, ESSearchResponse } from './types';

// Environment configuration
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';

export interface LocationSearchOptions {
  query: string;
  limit?: number;
  cityId?: string;
}

/**
 * Search locations and projects via ElasticSearch
 */
export async function searchLocations(
  options: LocationSearchOptions
): Promise<LocationSearchResult[]> {
  const { query, limit = 10, cityId } = options;

  // Minimum 2 characters
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (!ES_URL || !ES_API_KEY) {
    console.error('[LocationSearch] Missing ES_URL or ES_API_KEY');
    return [];
  }

  try {
    const esQuery = buildLocationQuery(query.trim(), cityId);

    // Search both locations and project indexes (matching v1)
    const response = await fetch(`${ES_URL}/locations,project/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: esQuery,
        size: limit,
        _source: [
          // Location fields
          'n_id', 'n_name', 'n_level', 'n_slug', 'n_slug_v1',
          'n_parentid', 'n_normalizedname', 'n_address',
          'city_id', 'city_name',
          'district_id', 'district_name',
          'ward_id', 'ward_name',
          // Project fields
          'id', 'project_name', 'slug', 'street_address',
          'city', 'district', 'ward'
        ]
      })
    });

    if (!response.ok) {
      console.error('[LocationSearch] ES request failed:', response.status);
      return [];
    }

    const data: ESSearchResponse<LocationDocument> = await response.json();

    // Parse hits with index info to distinguish locations from projects
    return data.hits.hits.map(hit => parseHit(hit._source, hit._index || ''));

  } catch (error) {
    console.error('[LocationSearch] Search failed:', error);
    return [];
  }
}

interface LocationDocument {
  // Location fields
  n_id?: string;
  n_name?: string;
  n_level?: string;
  n_slug?: string;
  n_slug_v1?: string;
  n_parentid?: string;
  n_normalizedname?: string;
  n_address?: string;
  city_id?: string;
  city_name?: string;
  district_id?: string;
  district_name?: string;
  ward_id?: string;
  ward_name?: string;
  // Project fields (from project index)
  id?: number;
  project_name?: string;
  slug?: string;
  street_address?: string;
  city?: string;      // Project uses 'city' not 'city_name'
  district?: string;  // Project uses 'district' not 'district_name'
  ward?: string;      // Project uses 'ward' not 'ward_name'
}

/**
 * Build ES query for location search
 * Follows v1 logic: use city_id filter (not n_parentid) and multi_match with folded/phrase fields
 */
function buildLocationQuery(query: string, cityId?: string) {
  const filters: any[] = [
    { term: { aactive: true } }
  ];

  // Filter by city_id (province) - same as v1
  // This ensures all results (districts, wards) belong to the selected province
  if (cityId) {
    filters.push({ term: { city_id: cityId } });
  }

  // Match v1 query structure: should with minimum_should_match
  // Search both location names and project names
  return {
    bool: {
      should: [
        {
          multi_match: {
            query: query,
            fields: [
              'n_name.folded',
              'n_name.phrase',
              'project_name.folded',
              'project_name.phrase'
            ],
            type: 'cross_fields',
            operator: 'and'
          }
        },
        {
          multi_match: {
            query: query,
            fields: [
              'n_name.folded',
              'n_name.phrase',
              'project_name.folded',
              'project_name.phrase'
            ],
            type: 'phrase_prefix'
          }
        }
      ],
      minimum_should_match: 1,
      filter: filters
    }
  };
}

/**
 * Parse ES hit based on index type (location or project)
 */
function parseHit(source: LocationDocument, indexName: string): LocationSearchResult {
  // Check if hit is from project index
  if (indexName.includes('project')) {
    return parseProjectHit(source);
  }
  return parseLocationHit(source);
}

/**
 * Parse project hit to LocationSearchResult
 * Project display: project_name + address (ward, district, city)
 */
function parseProjectHit(source: LocationDocument): LocationSearchResult {
  const projectName = source.project_name || source.n_name || '';

  // Build address from project fields (v1 uses city/district/ward, not city_name/district_name/ward_name)
  const addressParts: string[] = [];
  if (source.street_address) addressParts.push(source.street_address);
  if (source.ward || source.ward_name) addressParts.push(source.ward || source.ward_name || '');
  if (source.district || source.district_name) addressParts.push(source.district || source.district_name || '');
  if (source.city || source.city_name) addressParts.push(source.city || source.city_name || '');

  const address = addressParts.filter(p => p && p.trim()).join(', ');
  const fullName = address ? `${projectName}, ${address}` : projectName;

  return {
    id: String(source.id || source.n_id || ''),
    type: 'project',
    name: projectName,
    fullName,
    slug: source.slug || source.n_slug || '',
    level: undefined,
    provinceId: source.city_id,
    districtId: source.district_id,
  };
}

/**
 * Parse location hit to LocationSearchResult
 * Follows v1 format for different location levels
 */
function parseLocationHit(source: LocationDocument): LocationSearchResult {
  const levelStr = source.n_level || '0';

  // Determine type based on level (support both string and integer formats)
  let type: LocationSearchResult['type'] = 'province';
  let level = 0;

  if (levelStr === 'QuanHuyen' || levelStr === '1') {
    type = 'district';
    level = 1;
  } else if (levelStr === 'PhuongXa' || levelStr === '2') {
    type = 'ward';
    level = 2;
  } else if (levelStr === 'Street' || levelStr === '3') {
    // Street level - special format matching v1
    type = 'street';
    level = 3;
  } else if (levelStr === 'TinhThanh' || levelStr === '0') {
    type = 'province';
    level = 0;
  } else {
    // Fallback to integer parsing for backward compatibility
    level = parseInt(levelStr, 10);
    if (level === 1) type = 'district';
    else if (level === 2) type = 'ward';
    else if (level === 3) type = 'street';
  }

  // Build full name based on level (matching v1 format)
  let fullName: string;

  if (level === 3) {
    // Street: n_name + ward_name + district_name + city_name (v1 format)
    const parts = [source.n_name || ''];
    if (source.ward_name) parts.push(source.ward_name);
    if (source.district_name) parts.push(source.district_name);
    if (source.city_name) parts.push(source.city_name);
    fullName = parts.join(', ');
  } else if (level === 2) {
    // Ward: n_name + district_name + city_name
    const parts = [source.n_name || ''];
    if (source.district_name) parts.push(source.district_name);
    if (source.city_name) parts.push(source.city_name);
    fullName = parts.join(', ');
  } else if (level === 1) {
    // District: n_name + city_name
    const parts = [source.n_name || ''];
    if (source.city_name) parts.push(source.city_name);
    fullName = parts.join(', ');
  } else {
    // Province: just n_name
    fullName = source.n_name || '';
  }

  // Use n_slug_v1 if available (matches v1 URL structure), fallback to n_slug
  const slug = source.n_slug_v1 || source.n_slug || '';

  return {
    id: source.n_id || '',
    type,
    name: source.n_name || '',
    fullName,
    slug,
    level,
    provinceId: level === 0 ? source.n_id : source.city_id,
    districtId: level === 1 ? source.n_id : source.district_id,
  };
}
