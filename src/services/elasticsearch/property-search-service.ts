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
const ES_PROJECT_INDEX = import.meta.env.ES_PROJECT_INDEX || process.env.ES_PROJECT_INDEX || 'project';
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
    // Use project index for transaction_type=3 (projects)
    const indexName = filters.transactionType === 3 ? ES_PROJECT_INDEX : ES_INDEX;
    const query = buildPropertyQuery(filters);

    const response = await fetch(`${ES_URL}/${indexName}/_search`, {
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

    // Extract hits - normalize project fields if querying project index
    const isProjectQuery = filters.transactionType === 3;
    const hits = data.hits.hits.map((hit) => {
      const source = hit._source as any;

      if (isProjectQuery) {
        // Map project index fields to PropertyDocument interface
        return {
          id: source.id || parseInt(hit._id, 10),
          title: source.project_name || source.title || '',
          slug: source.slug || '',
          transaction_type: 3,
          property_type_id: source.property_type_id || source.project_type || 0,
          property_type_name: source.property_type_name,
          price: source.price || 0,
          price_description: source.price_description,
          area: source.project_area || source.area || 0,
          street_address: source.street_address,
          address: source.address,
          district: source.district,
          district_name: source.district_name,
          city: source.city,
          city_name: source.city_name,
          province_id: source.city_id,
          district_id: source.district_id,
          main_image: source.main_image,
          thumbnail: source.thumbnail || source.main_image,
          created_on: source.created_on || source.created_time || '',
          is_verified: source.is_verified,
          is_featured: source.is_featured,
        } as PropertyDocument;
      }

      return {
        ...source,
        id: source.id || parseInt(hit._id, 10)
      };
    });

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
