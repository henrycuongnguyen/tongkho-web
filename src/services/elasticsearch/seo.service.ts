/**
 * Elasticsearch SEO Service
 *
 * Handles SEO metadata searches in Elasticsearch
 * Searches the "seo_meta_data" index
 */

import { ElasticsearchBaseService } from "./base.service";
import { ES_INDICES } from "./constants";

export class ElasticsearchSeoService extends ElasticsearchBaseService {
  /**
   * Get SEO metadata for a specific page path
   * @param path URL path to find metadata for (e.g., "/ban-nha-ha-noi")
   * @returns SEO metadata object or null if not found
   */
  async getSeoMetadata(path: string): Promise<any | null> {
    const query = {
      term: { "path.keyword": path },
    };

    const result = await this.search(ES_INDICES.SEO_META, query, {
      size: 1,
    });

    return result.hits.length > 0 ? result.hits[0]._source : null;
  }
}

// Singleton instance
export const elasticsearchSeoService = new ElasticsearchSeoService();
