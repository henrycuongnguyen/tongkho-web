/**
 * Elasticsearch Location Service
 *
 * Handles location-specific searches in Elasticsearch
 * Searches the "locations" index
 */

import { ElasticsearchBaseService } from "./base.service";
import { ES_INDICES } from "./constants";

export interface LocationSearchResult {
  id: string;
  data: any;
}

export class ElasticsearchLocationService extends ElasticsearchBaseService {
  /**
   * Search locations index
   * @param searchQuery Optional search query string
   * @param limit Number of results to return
   * @returns Array of location search results
   */
  async searchLocations(searchQuery?: string, limit: number = 10): Promise<LocationSearchResult[]> {
    const query = searchQuery
      ? this.buildMultiMatchQuery(searchQuery, ["name^3", "city^2", "district"])
      : this.buildMatchAllQuery();

    const result = await this.search(ES_INDICES.LOCATIONS, query, {
      size: limit,
    });

    return result.hits.map((hit) => ({
      id: hit._id,
      data: hit._source,
    }));
  }

  /**
   * Combined search across locations and projects
   * @param searchQuery Optional search query string
   * @param limit Number of results to return
   * @returns Combined search results with index information
   */
  async searchLocationsAndProjects(
    searchQuery?: string,
    limit: number = 10
  ): Promise<Array<{ id: string; index: string; data: any }>> {
    const query = searchQuery
      ? this.buildMultiMatchQuery(searchQuery, ["title^3", "name^3", "description^2", "location"])
      : this.buildMatchAllQuery();

    const result = await this.search([ES_INDICES.LOCATIONS, ES_INDICES.PROJECTS], query, {
      size: limit,
    });

    return result.hits.map((hit) => ({
      id: hit._id,
      index: hit._index,
      data: hit._source,
    }));
  }
}

// Singleton instance
export const elasticsearchLocationService = new ElasticsearchLocationService();
