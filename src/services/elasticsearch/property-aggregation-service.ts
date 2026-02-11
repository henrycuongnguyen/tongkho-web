/**
 * Elasticsearch Property Aggregation Service
 * Handles aggregations for sidebar blocks, counts, and analytics
 */

export interface AggregationFilters {
  transaction_type?: number;
  property_types?: number | number[];
  city_id?: string;
  district_id?: string;
  ward_id?: string;
}

export interface AggregationBucket {
  key: string | number;
  doc_count: number;
}

export interface AggregationResponse {
  buckets: AggregationBucket[];
  total: number;
}

export class PropertyAggregationService {
  private baseUrl: string;
  private index: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.ES_URL || process.env.ES_URL || "";
    this.index = import.meta.env.ES_INDEX || process.env.ES_INDEX || "real_estate";
    this.apiKey = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || "";
  }

  /**
   * Build base query filters for Elasticsearch
   */
  private buildBaseQuery(filters: AggregationFilters): any {
    const must: any[] = [];

    if (filters.transaction_type !== undefined) {
      must.push({ term: { transaction_type: filters.transaction_type } });
    }

    if (filters.property_types !== undefined) {
      if (Array.isArray(filters.property_types)) {
        must.push({ terms: { property_type_id: filters.property_types } });
      } else {
        must.push({ term: { property_type_id: filters.property_types } });
      }
    }

    if (filters.city_id) {
      must.push({ term: { "city_id": filters.city_id } });
    }

    if (filters.district_id) {
      must.push({ term: { "district_id": filters.district_id } });
    }

    if (filters.ward_id) {
      must.push({ term: { "ward_id.keyword": filters.ward_id } });
    }

    return {
      bool: {
        must: must.length > 0 ? must : [{ match_all: {} }]
      }
    };
  }

  /**
   * Aggregate by city (provinces)
   * Returns count of properties per city
   */
  async aggregateByCity(filters: AggregationFilters): Promise<AggregationResponse> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("[ES] Missing ES_URL or ES_API_KEY environment variables");
    }

    const query = this.buildBaseQuery(filters);

    const response = await fetch(`${this.baseUrl}/${this.index}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        size: 0,
        aggs: {
          by_city: {
            terms: {
              field: "city_id",
              size: 200,
              order: { _count: "desc" }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`[ES] Aggregation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const buckets = data.aggregations?.by_city?.buckets || [];

    return {
      buckets,
      total: buckets.length
    };
  }

  /**
   * Aggregate by district
   * Returns count of properties per district in a city
   */
  async aggregateByDistrict(filters: AggregationFilters): Promise<AggregationResponse> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("[ES] Missing ES_URL or ES_API_KEY environment variables");
    }

    const query = this.buildBaseQuery(filters);

    const response = await fetch(`${this.baseUrl}/${this.index}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        size: 0,
        aggs: {
          by_district: {
            terms: {
              field: "district_id",
              size: 500,
              order: { _count: "desc" }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`[ES] Aggregation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const buckets = data.aggregations?.by_district?.buckets || [];

    return {
      buckets,
      total: buckets.length
    };
  }

  /**
   * Aggregate by ward
   * Returns count of properties per ward in a district
   */
  async aggregateByWard(filters: AggregationFilters): Promise<AggregationResponse> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("[ES] Missing ES_URL or ES_API_KEY environment variables");
    }

    const query = this.buildBaseQuery(filters);

    const response = await fetch(`${this.baseUrl}/${this.index}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        size: 0,
        aggs: {
          by_ward: {
            terms: {
              field: "ward_id.keyword",
              size: 1000,
              order: { _count: "desc" }
            }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`[ES] Aggregation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const buckets = data.aggregations?.by_ward?.buckets || [];

    return {
      buckets,
      total: buckets.length
    };
  }

  /**
   * Get total count of properties matching filters
   */
  async getTotalCount(filters: AggregationFilters): Promise<number> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("[ES] Missing ES_URL or ES_API_KEY environment variables");
    }

    const query = this.buildBaseQuery(filters);

    const response = await fetch(`${this.baseUrl}/${this.index}/_count`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${this.apiKey}`,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`[ES] Count failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.count || 0;
  }
}

// Singleton instance
export const propertyAggregationService = new PropertyAggregationService();
