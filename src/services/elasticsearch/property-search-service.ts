/**
 * Property Search Service
 * High-level API for searching properties via ElasticSearch
 */

import { buildPropertyQuery } from './query-builder';
import type {
  PropertySearchFilters,
  ElasticSearchResult,
  PropertyDocument,
  ESSearchResponse
} from './types';

// Environment configuration
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_INDEX = import.meta.env.ES_INDEX || process.env.ES_INDEX || 'real_estate';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';

/**
 * Search properties with filters
 */
export async function searchProperties(
  filters: PropertySearchFilters
): Promise<ElasticSearchResult<PropertyDocument>> {
  if (!ES_URL || !ES_API_KEY) {
    console.error('[PropertySearch] Missing ES_URL or ES_API_KEY');
    return { total: 0, hits: [], took: 0 };
  }

  try {
    const query = buildPropertyQuery(filters);

    const response = await fetch(`${ES_URL}/${ES_INDEX}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      console.error('[PropertySearch] ES request failed:', response.status, response.statusText);
      return { total: 0, hits: [], took: 0 };
    }

    const data: ESSearchResponse<PropertyDocument> = await response.json();

    console.log('[PropertySearch] ES response summary:', {
      totalHits: data.hits.total,
      hitsCount: data.hits.hits.length,
      took: data.took
    });

    // Extract hits
    const hits = data.hits.hits.map((hit) => ({
      ...hit._source,
      id: hit._source.id || parseInt(hit._id, 10)
    }));

    // Extract total (ES 7.x returns object, older returns number)
    const total = typeof data.hits.total === 'number'
      ? data.hits.total
      : data.hits.total?.value || 0;

    return {
      total,
      hits,
      took: data.took,
      aggregations: data.aggregations
    };

  } catch (error) {
    console.error('[PropertySearch] Search failed:', error);
    return { total: 0, hits: [], took: 0 };
  }
}

/**
 * Get single property by ID from ES
 */
export async function getPropertyById(id: number): Promise<PropertyDocument | null> {
  if (!ES_URL || !ES_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${ES_URL}/${ES_INDEX}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: { term: { id } },
        size: 1
      })
    });

    if (!response.ok) {
      return null;
    }

    const data: ESSearchResponse<PropertyDocument> = await response.json();
    const hit = data.hits.hits[0];

    if (!hit) return null;

    return {
      ...hit._source,
      id: hit._source.id || parseInt(hit._id, 10)
    };

  } catch (error) {
    console.error('[PropertySearch] Get by ID failed:', error);
    return null;
  }
}

/**
 * Get aggregations for filter counts (optional feature)
 */
export async function getFilterAggregations(
  filters: PropertySearchFilters
): Promise<Record<string, unknown>> {
  if (!ES_URL || !ES_API_KEY) {
    return {};
  }

  try {
    const baseQuery = buildPropertyQuery({ ...filters, pageSize: 0 });

    const queryWithAggs = {
      ...baseQuery,
      size: 0, // Don't need hits, just aggregations
      aggs: {
        property_types: {
          terms: { field: 'property_type_id', size: 50 }
        },
        provinces: {
          terms: { field: 'province_id', size: 100 }
        },
        districts: {
          terms: { field: 'district_id', size: 200 }
        }
      }
    };

    const response = await fetch(`${ES_URL}/${ES_INDEX}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify(queryWithAggs)
    });

    if (!response.ok) {
      return {};
    }

    const data: ESSearchResponse<PropertyDocument> = await response.json();
    return data.aggregations || {};

  } catch (error) {
    console.error('[PropertySearch] Aggregations failed:', error);
    return {};
  }
}
