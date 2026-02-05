/**
 * Elasticsearch Project Service
 *
 * Handles project-specific searches in Elasticsearch
 * Searches the "project" index
 */

import { ElasticsearchBaseService } from "./base.service";
import { ES_INDICES } from "./constants";

export interface ProjectSearchResult {
  id: string;
  data: any;
}

export class ElasticsearchProjectService extends ElasticsearchBaseService {
  /**
   * Search projects index
   * @param searchQuery Optional search query string
   * @param limit Number of results to return
   * @returns Array of project search results
   */
  async searchProjects(searchQuery?: string, limit: number = 10): Promise<ProjectSearchResult[]> {
    const query = searchQuery
      ? this.buildMultiMatchQuery(searchQuery, ["project_name^3", "developer_name^2", "description"])
      : this.buildMatchAllQuery();

    const result = await this.search(ES_INDICES.PROJECTS, query, {
      size: limit,
      sort: [{ created_on: "desc" }],
    });

    return result.hits.map((hit) => ({
      id: hit._id,
      data: hit._source,
    }));
  }
}

// Singleton instance
export const elasticsearchProjectService = new ElasticsearchProjectService();
