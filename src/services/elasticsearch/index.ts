/**
 * Elasticsearch Services
 *
 * Barrel export for all Elasticsearch services
 * Usage:
 *
 * ```typescript
 * import {
 *   elasticsearchPropertyService,
 *   elasticsearchProjectService,
 *   elasticsearchLocationService,
 *   elasticsearchSeoService,
 *   ES_INDICES,
 * } from '@/services/elasticsearch';
 *
 * // Search properties
 * const properties = await elasticsearchPropertyService.searchProperties('sale', 10);
 *
 * // Search projects
 * const projects = await elasticsearchProjectService.searchProjects('Vinhomes', 5);
 *
 * // Search locations
 * const locations = await elasticsearchLocationService.searchLocations('Hà Nội', 10);
 *
 * // Combined search
 * const results = await elasticsearchLocationService.searchLocationsAndProjects('Quận 7');
 *
 * // SEO metadata
 * const seoData = await elasticsearchSeoService.getSeoMetadata('/ban-nha-ha-noi');
 * ```
 */

// Export constants
export { ES_INDICES, UPLOADS_BASE_URL } from "./constants";
export type { ESSource, ESHit, ESSearchResponse } from "./constants";

// Export base service (for extension if needed)
export { ElasticsearchBaseService } from "./base.service";
export type { SearchOptions, SearchResult } from "./base.service";

// Export property service
export { ElasticsearchPropertyService, elasticsearchPropertyService } from "./property.service";

// Export project service
export {
  ElasticsearchProjectService,
  elasticsearchProjectService,
  type ProjectSearchResult,
} from "./project.service";

// Export location service
export {
  ElasticsearchLocationService,
  elasticsearchLocationService,
  type LocationSearchResult,
} from "./location.service";

// Export SEO service
export { ElasticsearchSeoService, elasticsearchSeoService } from "./seo.service";
