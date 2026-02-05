# Phase 2: Create Elasticsearch Client Service

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Depends on:** [Phase 1](./phase-01-setup-ssr-mode-and-environment-variables.md)
- **Types:** [property.ts](../../src/types/property.ts)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | pending |
| Review | pending |

Create a TypeScript service to fetch property listings from Elasticsearch with proper type mapping.

## Key Insights

- ES uses REST API with API key authentication via `Authorization: ApiKey {base64_key}` header
- Index: `real_estate` - need to discover actual document structure
- Must map ES `_source` fields to existing `Property` interface
- Handle pagination, errors gracefully

## Requirements

### Functional
- Fetch properties by transaction type (sale/rent)
- Limit results (default 4 for homepage)
- Sort by createdAt descending (newest first)
- Map ES response to `Property[]` type

### Non-functional
- Timeout: 5 seconds
- Error handling with fallback
- Type-safe response mapping

## Architecture

```
src/services/elasticsearch.ts
├── ElasticsearchService (class)
│   ├── constructor() - init URL, API key
│   ├── searchProperties(type: 'sale'|'rent', limit: number) → Property[]
│   └── mapToProperty(hit: ESHit) → Property
└── Types
    └── ESSearchResponse, ESHit, ESSource
```

## Related Code Files

**To Create:**
- `src/services/elasticsearch.ts` - Main ES service

**Reference:**
- `src/types/property.ts` - Property interface
- `src/data/mock-properties.ts` - Fallback data

## Implementation Steps

1. Create `src/services/elasticsearch.ts`:

```typescript
import type { Property, TransactionType } from '@/types/property';
import { mockPropertiesForSale, mockPropertiesForRent } from '@/data/mock-properties';

// ES response types
interface ESSource {
  // Map these fields based on actual ES document structure
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  property_type?: string;
  transaction_type?: string;
  price?: number;
  price_unit?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  address?: string;
  district?: string;
  city?: string;
  description?: string;
  images?: string[];
  thumbnail?: string;
  features?: string[];
  created_at?: string;
  is_featured?: boolean;
  is_hot?: boolean;
  // Add more fields as discovered from ES
}

interface ESHit {
  _id: string;
  _source: ESSource;
}

interface ESSearchResponse {
  hits: {
    total: { value: number };
    hits: ESHit[];
  };
}

export class ElasticsearchService {
  private baseUrl: string;
  private index: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.ES_URL || 'https://elastic.tongkhobds.com';
    this.index = import.meta.env.ES_INDEX || 'real_estate';
    this.apiKey = import.meta.env.ES_API_KEY || '';
  }

  async searchProperties(
    transactionType: TransactionType,
    limit: number = 4
  ): Promise<Property[]> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.index}/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `ApiKey ${this.apiKey}`,
        },
        body: JSON.stringify({
          query: {
            bool: {
              must: [
                { term: { transaction_type: transactionType } }
              ]
            }
          },
          sort: [{ created_at: 'desc' }],
          size: limit,
        }),
      });

      if (!response.ok) {
        throw new Error(`ES error: ${response.status}`);
      }

      const data: ESSearchResponse = await response.json();
      return data.hits.hits.map((hit) => this.mapToProperty(hit));
    } catch (error) {
      console.error('[ES] Search failed:', error);
      // Fallback to mock data
      return transactionType === 'sale'
        ? mockPropertiesForSale.slice(0, limit)
        : mockPropertiesForRent.slice(0, limit);
    }
  }

  private mapToProperty(hit: ESHit): Property {
    const src = hit._source;
    return {
      id: src.id || hit._id,
      title: src.title || '',
      slug: src.slug || '',
      type: (src.property_type as Property['type']) || 'apartment',
      transactionType: (src.transaction_type as Property['transactionType']) || 'sale',
      price: src.price || 0,
      priceUnit: (src.price_unit as Property['priceUnit']) || 'billion',
      area: src.area || 0,
      bedrooms: src.bedrooms,
      bathrooms: src.bathrooms,
      address: src.address || '',
      district: src.district || '',
      city: src.city || '',
      description: src.description || '',
      images: src.images || [],
      thumbnail: src.thumbnail || '',
      features: src.features || [],
      createdAt: src.created_at || new Date().toISOString(),
      isFeatured: src.is_featured || false,
      isHot: src.is_hot || false,
    };
  }
}

// Singleton instance
export const elasticsearchService = new ElasticsearchService();
```

2. **IMPORTANT:** First discover actual ES document structure by making a test query:
   ```bash
   curl -X GET "https://elastic.tongkhobds.com/real_estate/_search?size=1" \
     -H "Authorization: ApiKey OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ=="
   ```

3. Update `ESSource` interface based on actual field names from ES

## Todo List

- [ ] Query ES to discover document structure
- [ ] Create src/services/elasticsearch.ts
- [ ] Define ES response types
- [ ] Implement searchProperties method
- [ ] Implement mapToProperty with correct field mapping
- [ ] Add error handling with fallback to mock data
- [ ] Test service in isolation

## Success Criteria

- [ ] `elasticsearchService.searchProperties('sale', 4)` returns Property[]
- [ ] `elasticsearchService.searchProperties('rent', 4)` returns Property[]
- [ ] Fallback works when ES unavailable
- [ ] All Property fields correctly mapped

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| ES field names differ from Property | High | Discover schema first, flexible mapping |
| ES timeout | Medium | 5s timeout, fallback to mock |
| Missing required fields | Medium | Provide defaults in mapToProperty |

## Security Considerations

- API key used only server-side
- Validate/sanitize ES response before use
- Don't log sensitive data

## Next Steps

After completing this phase, proceed to [Phase 3: Integrate with Homepage](./phase-03-integrate-elasticsearch-with-homepage.md)
