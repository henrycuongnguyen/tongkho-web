/**
 * Elasticsearch Base Service
 *
 * Provides shared functionality for all Elasticsearch services
 * Handles connection, authentication, and generic search operations
 */

import type { ESSearchResponse } from "./constants";

export interface SearchOptions {
  size?: number;
  sort?: Array<Record<string, any>>;
  from?: number;
}

export interface SearchResult<T> {
  hits: Array<{ _id: string; _index: string; _source: T }>;
  total: number;
}

/**
 * Base class for Elasticsearch services
 * All specific services (property, project, etc.) extend this
 */
export abstract class ElasticsearchBaseService {
  protected baseUrl: string;
  protected apiKey: string;

  constructor() {
    // Use import.meta.env (dev) with process.env fallback (production)
    this.baseUrl = import.meta.env.ES_URL || process.env.ES_URL || "";
    this.apiKey = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || "";
  }

  /**
   * Generic search method that works with any index or multiple indices
   * @param indices Single index name or array of indices
   * @param query Elasticsearch query object
   * @param options Search options (size, sort, from)
   * @returns Raw Elasticsearch response
   */
  protected async search<T = any>(
    indices: string | string[],
    query: Record<string, any>,
    options?: SearchOptions
  ): Promise<SearchResult<T>> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("[ES] Missing ES_URL or ES_API_KEY environment variables");
    }

    const indexPath = Array.isArray(indices) ? indices.join(",") : indices;
    const response = await fetch(`${this.baseUrl}/${indexPath}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        size: options?.size || 10,
        ...(options?.sort && { sort: options.sort }),
        ...(options?.from && { from: options.from }),
      }),
    });

    if (!response.ok) {
      throw new Error(`[ES] Search failed: ${response.status} ${response.statusText}`);
    }

    const data: ESSearchResponse<T> = await response.json();
    return {
      hits: data.hits.hits.map((hit) => ({
        _id: hit._id,
        _index: hit._index || indexPath,
        _source: hit._source as T,
      })),
      total: data.hits.total.value,
    };
  }

  /**
   * Build a multi-match query for text search
   * @param queryString Search query string
   * @param fields Fields to search in
   * @returns Elasticsearch query object
   */
  protected buildMultiMatchQuery(queryString: string, fields: string[]): Record<string, any> {
    return {
      multi_match: {
        query: queryString,
        fields,
        fuzziness: "AUTO",
      },
    };
  }

  /**
   * Build a match-all query
   * @returns Elasticsearch query object
   */
  protected buildMatchAllQuery(): Record<string, any> {
    return { match_all: {} };
  }
}
