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
}

/**
 * Search locations and projects via ElasticSearch
 */
export async function searchLocations(
  options: LocationSearchOptions
): Promise<LocationSearchResult[]> {
  const { query, limit = 10 } = options;

  // Minimum 2 characters
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (!ES_URL || !ES_API_KEY) {
    console.error('[LocationSearch] Missing ES_URL or ES_API_KEY');
    return [];
  }

  try {
    const esQuery = buildLocationQuery(query.trim());

    const response = await fetch(`${ES_URL}/locations/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: esQuery,
        size: limit,
        _source: [
          'n_id', 'n_name', 'n_level', 'n_slug',
          'n_parentid', 'city_name', 'district_name'
        ]
      })
    });

    if (!response.ok) {
      console.error('[LocationSearch] ES request failed:', response.status);
      return [];
    }

    const data: ESSearchResponse<LocationDocument> = await response.json();

    return data.hits.hits.map(hit => parseLocationHit(hit._source));

  } catch (error) {
    console.error('[LocationSearch] Search failed:', error);
    return [];
  }
}

interface LocationDocument {
  n_id?: string;
  n_name?: string;
  n_level?: string;
  n_slug?: string;
  n_parentid?: string;
  city_name?: string;
  district_name?: string;
}

/**
 * Build ES query for location search
 */
function buildLocationQuery(query: string) {
  return {
    bool: {
      must: [
        {
          multi_match: {
            query: query,
            fields: [
              'n_name^3',           // Location name (boost 3x)
              'n_normalizedname^2', // Normalized name (boost 2x)
              'n_slug'              // Slug
            ],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        }
      ],
      filter: [
        { term: { aactive: true } }
      ]
    }
  };
}

/**
 * Parse ES hit to LocationSearchResult
 */
function parseLocationHit(source: LocationDocument): LocationSearchResult {
  const level = parseInt(source.n_level || '0', 10);

  // Determine type based on level
  let type: LocationSearchResult['type'] = 'province';
  if (level === 1) type = 'district';
  if (level === 2) type = 'ward';

  // Build full name
  const fullNameParts: string[] = [source.n_name || ''];
  if (source.district_name && level === 2) {
    fullNameParts.push(source.district_name);
  }
  if (source.city_name && level > 0) {
    fullNameParts.push(source.city_name);
  }

  return {
    id: source.n_id || '',
    type,
    name: source.n_name || '',
    fullName: fullNameParts.join(', '),
    slug: source.n_slug || '',
    level,
    provinceId: level === 0 ? source.n_id : undefined,
    districtId: level === 1 ? source.n_id : undefined,
  };
}
