# Phase 1: ElasticSearch Service Layer

## Context
[← Back to Plan](./plan.md)

Create ElasticSearch service layer for querying properties with complex filters. Study v1 API logic from `tongkho_v1/modules/real_estate_handle.py`.

## Priority
**HIGH** - Foundation for listing functionality

## Status
**Pending**

## Overview
Build TypeScript service to connect Astro SSR/SSG to ElasticSearch for property search. Replicate v1 query logic but server-side.

## Key Insights from V1

From `real_estate_handle.py`:
```python
# ElasticSearch config
self.es_url = 'https://elastic.tongkhobds.com/real_estate/_search'
self.es_headers = {
    'Authorization': 'ApiKey OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==',
    'Content-Type': 'application/json'
}

# Query structure
es_query = {
    "query": {
        "bool": {
            "must": [...],      # Required conditions
            "filter": [...],    # Filtering (no scoring)
            "should": [...],    # Optional conditions
            "must_not": [...]   # Exclusions
        }
    },
    "_source": ["id", "title", ...],  # Fields to return
    "from": 0,
    "size": 20,
    "sort": [{"created_on": "desc"}]
}
```

## Requirements

### Functional
- Query properties by transaction type (mua bán, cho thuê, dự án)
- Filter by property types (IDs: 12, 13, ...)
- Location filtering (provinces, districts with radius)
- Price range filtering (VND amounts)
- Area range filtering (m²)
- Advanced filters (bedrooms, bathrooms, radius km)
- Sorting (newest, price asc/desc, area asc/desc)
- Pagination (page size 20-30)

### Non-Functional
- Query performance: <500ms average (with Redis cache: <50ms)
- Handle Vietnamese text search
- **3-tier fallback:** Redis → ElasticSearch → PostgreSQL
- Connection pooling
- **Redis caching (5 min TTL)** ✅

## Architecture

### Service Structure

```
src/services/
└── elasticsearch/
    ├── elasticsearch-client.ts      # ES connection client
    ├── query-builder.ts             # Build ES queries
    ├── property-search-service.ts   # High-level search API
    └── types.ts                     # ES query types
```

### Data Flow

```
Astro Page → PropertySearchService → QueryBuilder → ES Client → ElasticSearch
                     ↓
              Format Results
                     ↓
            Return to Astro Page
```

## Implementation Steps

### 1. Setup ElasticSearch Client (1-2 hours)

**File:** `src/services/elasticsearch/elasticsearch-client.ts`

```typescript
import { Client } from '@elastic/elasticsearch';

// Environment configuration
const ES_NODE = process.env.ES_NODE || 'https://elastic.tongkhobds.com';
const ES_API_KEY = process.env.ES_API_KEY || '';

// Create singleton client
let esClient: Client | null = null;

export function getElasticSearchClient(): Client {
  if (!esClient) {
    esClient = new Client({
      node: ES_NODE,
      auth: {
        apiKey: ES_API_KEY
      },
      maxRetries: 3,
      requestTimeout: 30000,
      sniffOnStart: false,
    });
  }
  return esClient;
}

// Health check
export async function checkElasticSearchHealth(): Promise<boolean> {
  try {
    const client = getElasticSearchClient();
    const health = await client.cluster.health();
    return health.status === 'green' || health.status === 'yellow';
  } catch (error) {
    console.error('[ES Health Check] Failed:', error);
    return false;
  }
}
```

**Environment Variables:**
```env
# .env
ES_NODE=https://elastic.tongkhobds.com
ES_API_KEY=OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==
```

### 2. Define Types (30 mins)

**File:** `src/services/elasticsearch/types.ts`

```typescript
// Search filters from user input
export interface PropertySearchFilters {
  transactionType: number;          // 1=mua bán, 2=cho thuê, 3=dự án
  propertyTypes?: number[];         // [12, 13, 14]
  provinceIds?: number[];           // [1, 2]
  districtIds?: number[];           // [10, 11, 12]
  minPrice?: number;                // VND
  maxPrice?: number;                // VND
  minArea?: number;                 // m²
  maxArea?: number;                 // m²
  bedrooms?: number;                // 1-5+
  bathrooms?: number;               // 1-5+
  radius?: number;                  // km (5, 10, 50, 100)
  centerLat?: number;               // For radius search
  centerLon?: number;               // For radius search
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
  page?: number;                    // Pagination
  pageSize?: number;                // Items per page (default 20)
  keyword?: string;                 // Text search
}

// ES search result
export interface ElasticSearchResult<T> {
  total: number;
  hits: T[];
  took: number;                     // Query time (ms)
  aggregations?: Record<string, any>;
}

// Property document from ES
export interface PropertyDocument {
  id: number;
  title: string;
  slug: string;
  transaction_type: number;
  property_type_id: number;
  property_type_name?: string;
  price: number;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address: string;
  district_name?: string;
  city_name?: string;
  province_id?: number;
  district_id?: number;
  thumbnail?: string;
  images?: string[];
  created_on: string;
  updated_on?: string;
  location?: {
    lat: number;
    lon: number;
  };
  is_verified?: boolean;
  source_post?: string;
}
```

### 3. Build Query Builder (2-3 hours)

**File:** `src/services/elasticsearch/query-builder.ts`

```typescript
import type { PropertySearchFilters } from './types';

export class ElasticSearchQueryBuilder {

  /**
   * Build ElasticSearch query from filters
   */
  static buildPropertyQuery(filters: PropertySearchFilters) {
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
      pageSize = 20
    } = filters;

    // Must conditions (required)
    const must: any[] = [
      // Transaction type
      { term: { transaction_type: transactionType } }
    ];

    // Property types filter
    if (propertyTypes.length > 0) {
      must.push({
        terms: { property_type_id: propertyTypes }
      });
    }

    // Location filters
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
      const priceRange: any = {};
      if (minPrice !== undefined && minPrice > 0) priceRange.gte = minPrice;
      if (maxPrice !== undefined && maxPrice < 1000000000000) priceRange.lte = maxPrice;

      if (Object.keys(priceRange).length > 0) {
        must.push({ range: { price: priceRange } });
      }
    }

    // Area range
    if (minArea !== undefined || maxArea !== undefined) {
      const areaRange: any = {};
      if (minArea !== undefined && minArea > 0) areaRange.gte = minArea;
      if (maxArea !== undefined && maxArea < 1000000000000) areaRange.lte = maxArea;

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
          query: keyword,
          fields: ['title^2', 'address', 'description'],
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

    // Build sort
    const sortConfig = this.buildSort(sort);

    // Build final query
    const query = {
      query: {
        bool: {
          must,
          filter: [
            // Only active properties
            { term: { is_active: true } }
          ]
        }
      },
      from: (page - 1) * pageSize,
      size: pageSize,
      sort: sortConfig,
      _source: [
        'id', 'title', 'slug', 'transaction_type', 'property_type_id',
        'property_type_name', 'price', 'area', 'bedrooms', 'bathrooms',
        'address', 'district_name', 'city_name', 'province_id', 'district_id',
        'thumbnail', 'images', 'created_on', 'updated_on', 'location',
        'is_verified', 'source_post'
      ]
    };

    return query;
  }

  /**
   * Build sort configuration
   */
  private static buildSort(sort: string): any[] {
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
}
```

### 4. High-Level Search Service (1-2 hours)

**File:** `src/services/elasticsearch/property-search-service.ts`

```typescript
import { getElasticSearchClient } from './elasticsearch-client';
import { ElasticSearchQueryBuilder } from './query-builder';
import type {
  PropertySearchFilters,
  ElasticSearchResult,
  PropertyDocument
} from './types';

export class PropertySearchService {

  /**
   * Search properties with filters
   */
  static async searchProperties(
    filters: PropertySearchFilters
  ): Promise<ElasticSearchResult<PropertyDocument>> {
    try {
      const client = getElasticSearchClient();
      const query = ElasticSearchQueryBuilder.buildPropertyQuery(filters);

      // Execute search
      const response = await client.search({
        index: 'real_estate',
        body: query
      });

      // Extract results
      const hits = response.hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._source.id || hit._id
      })) as PropertyDocument[];

      const total = typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;

      return {
        total,
        hits,
        took: response.took
      };

    } catch (error) {
      console.error('[PropertySearchService] Search failed:', error);

      // Return empty result on error (graceful degradation)
      return {
        total: 0,
        hits: [],
        took: 0
      };
    }
  }

  /**
   * Get property by ID
   */
  static async getPropertyById(id: number): Promise<PropertyDocument | null> {
    try {
      const client = getElasticSearchClient();

      const response = await client.search({
        index: 'real_estate',
        body: {
          query: {
            term: { id }
          },
          size: 1
        }
      });

      const hit = response.hits.hits[0];
      if (!hit) return null;

      return {
        ...hit._source,
        id: hit._source.id || hit._id
      } as PropertyDocument;

    } catch (error) {
      console.error('[PropertySearchService] Get by ID failed:', error);
      return null;
    }
  }

  /**
   * Get aggregations for filter counts
   * (Optional - for showing "X results" per filter option)
   */
  static async getFilterAggregations(
    filters: PropertySearchFilters
  ): Promise<Record<string, any>> {
    try {
      const client = getElasticSearchClient();
      const baseQuery = ElasticSearchQueryBuilder.buildPropertyQuery({
        ...filters,
        pageSize: 0  // Don't need results, just aggregations
      });

      // Add aggregations
      const queryWithAggs = {
        ...baseQuery,
        aggs: {
          property_types: {
            terms: { field: 'property_type_id', size: 50 }
          },
          provinces: {
            terms: { field: 'province_id', size: 100 }
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { to: 1000000000 },
                { from: 1000000000, to: 2000000000 },
                { from: 2000000000, to: 3000000000 },
                // ... more ranges
              ]
            }
          }
        }
      };

      const response = await client.search({
        index: 'real_estate',
        body: queryWithAggs
      });

      return response.aggregations || {};

    } catch (error) {
      console.error('[PropertySearchService] Aggregations failed:', error);
      return {};
    }
  }
}
```

### 5. Usage in Astro Page (30 mins)

**File:** `src/pages/[...slug].astro`

```typescript
---
import { PropertySearchService } from '@/services/elasticsearch/property-search-service';
import type { PropertySearchFilters } from '@/services/elasticsearch/types';

// Parse URL params
const { slug } = Astro.params;
const url = new URL(Astro.request.url);

// Build filters from URL
const filters: PropertySearchFilters = {
  transactionType: 1, // Parse from slug
  propertyTypes: url.searchParams.get('property_types')?.split(',').map(Number),
  minPrice: Number(url.searchParams.get('gtn')) || undefined,
  maxPrice: Number(url.searchParams.get('gcn')) || undefined,
  minArea: Number(url.searchParams.get('dtnn')) || undefined,
  maxArea: Number(url.searchParams.get('dtcn')) || undefined,
  bedrooms: Number(url.searchParams.get('bedrooms')) || undefined,
  bathrooms: Number(url.searchParams.get('bathrooms')) || undefined,
  sort: (url.searchParams.get('sort') as any) || 'newest',
  page: Number(url.searchParams.get('page')) || 1,
  pageSize: 20
};

// Query ElasticSearch
const searchResult = await PropertySearchService.searchProperties(filters);
const { hits: properties, total, took } = searchResult;
---

<div>
  <h1>Danh sách BĐS ({total} kết quả)</h1>
  <p>Query time: {took}ms</p>

  {properties.map(property => (
    <div>{property.title}</div>
  ))}
</div>
```

## Related Code Files

**From V1 (Reference):**
- `tongkho_v1/modules/real_estate_handle.py` - ES query logic
- `tongkho_v1/controllers/api.py` - API endpoints

**To Create:**
- `src/services/elasticsearch/elasticsearch-client.ts`
- `src/services/elasticsearch/query-builder.ts`
- `src/services/elasticsearch/property-search-service.ts`
- `src/services/elasticsearch/types.ts`

## Todo List

- [ ] Install `@elastic/elasticsearch` package
- [ ] Setup environment variables (ES_NODE, ES_API_KEY)
- [ ] Create elasticsearch-client.ts with connection pooling
- [ ] Define TypeScript interfaces in types.ts
- [ ] Implement query-builder.ts with all filter logic
- [ ] Implement property-search-service.ts
- [ ] Add Vietnamese text analyzer config (if needed)
- [ ] Test with sample queries
- [ ] Add error handling and logging
- [ ] Document ES index mapping requirements
- [ ] Performance testing (aim <500ms)

## Success Criteria

- [ ] Can query properties by transaction type
- [ ] All filters working (type, location, price, area, bedrooms, bathrooms)
- [ ] Radius search working with geo_distance
- [ ] Sort options working
- [ ] Pagination working
- [ ] Query performance <500ms for typical queries
- [ ] Graceful error handling
- [ ] TypeScript types are complete

## Risk Assessment

**High Risk:**
- ElasticSearch index mapping may differ from v1 - need to verify field names
- Vietnamese text search may need custom analyzer
- Performance with complex filters + radius search

**Medium Risk:**
- Connection timeout issues
- Index sync lag with PostgreSQL

**Mitigation:**
- Verify ES index structure before implementation
- Test with production-like data volume
- Add query timeout and retry logic
- Implement fallback to PostgreSQL if ES fails

## Security Considerations

- Store ES credentials in environment variables (never commit)
- Validate all filter inputs before building queries
- Sanitize keyword search input (prevent injection)
- Rate limiting for search requests (future)

## Next Steps

After Phase 1 completion:
→ **Phase 2:** Location Data Service (provinces/districts)
→ **Phase 3:** Dynamic Route & URL Parsing
