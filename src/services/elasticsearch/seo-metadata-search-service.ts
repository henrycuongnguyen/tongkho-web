/**
 * SEO Metadata Search Service
 * Query seo_meta_data index via ElasticSearch
 */

import type { SeoMetadataResult } from '../seo/types';

// Environment configuration
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';
const SEO_INDEX = 'seo_meta_data';

export interface SeoMetadataSearchOptions {
  slug: string;
}

/**
 * Search SEO metadata by slug from ElasticSearch
 * Returns null if not found or error occurs
 */
export async function searchSeoMetadata(
  options: SeoMetadataSearchOptions
): Promise<SeoMetadataResult | null> {
  const { slug } = options;

  // Validate slug
  if (!slug || slug.trim().length === 0) {
    console.error('[SeoMetadataSearch] Empty slug provided');
    return null;
  }

  // Sanitize slug (prevent injection attacks)
  const sanitizedSlug = sanitizeSlug(slug.trim());
  if (!sanitizedSlug) {
    console.error('[SeoMetadataSearch] Invalid slug format:', slug);
    return null;
  }

  // Validate environment
  if (!ES_URL || !ES_API_KEY) {
    console.error('[SeoMetadataSearch] Missing ES_URL or ES_API_KEY');
    return null;
  }

  try {
    const esQuery = buildSeoQuery(sanitizedSlug);

    const response = await fetch(`${ES_URL}/${SEO_INDEX}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: esQuery,
        size: 1,
        _source: [
          'id', 'slug', 'page_type',
          'title', 'title_web', 'meta_description', 'meta_keywords',
          'og_title', 'og_description', 'og_image',
          'twitter_title', 'twitter_description', 'twitter_image',
          'canonical_url', 'schema_type', 'schema_json', 'breadcrumb_json',
          'content_above', 'content_below',
          'is_active', 'is_default', 'cached_html',
          'social_tags'
        ]
      })
    });

    if (!response.ok) {
      console.error('[SeoMetadataSearch] ES request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const hits = data?.hits?.hits || [];

    if (hits.length === 0) {
      return null;
    }

    // Parse first hit
    return parseSeoHit(hits[0]._source);

  } catch (error) {
    console.error('[SeoMetadataSearch] Search failed:', error);
    return null;
  }
}

/**
 * Sanitize slug to prevent ES injection attacks
 * Only allow valid URL path characters
 */
function sanitizeSlug(slug: string): string | null {
  // Allow: letters, numbers, hyphens, underscores, forward slashes
  const sanitized = slug.replace(/[^a-z0-9\-_/]/gi, '');

  // Must start with forward slash and not be empty after sanitization
  if (!sanitized.startsWith('/') || sanitized.length < 2) {
    return null;
  }

  return sanitized;
}

/**
 * Build ElasticSearch query for SEO metadata
 * Matches v1 logic: exact slug match + is_active filter
 */
function buildSeoQuery(slug: string) {
  return {
    bool: {
      must: [
        { term: { slug } },
        { term: { is_active: true } }
      ]
    }
  };
}

/**
 * Parse ElasticSearch hit into typed result
 */
function parseSeoHit(source: any): SeoMetadataResult {
  return {
    id: source.id,
    slug: source.slug || '',
    pageType: source.page_type,
    title: source.title,
    titleWeb: source.title_web,
    metaDescription: source.meta_description,
    metaKeywords: source.meta_keywords,
    ogTitle: source.og_title,
    ogDescription: source.og_description,
    ogImage: source.og_image,
    twitterTitle: source.twitter_title,
    twitterDescription: source.twitter_description,
    twitterImage: source.twitter_image,
    canonicalUrl: source.canonical_url,
    schemaType: source.schema_type,
    schemaJson: source.schema_json,
    breadcrumbJson: source.breadcrumb_json,
    contentAbove: source.content_above,
    contentBelow: source.content_below,
    isActive: source.is_active,
    isDefault: source.is_default,
    cachedHtml: source.cached_html,
    socialTags: source.social_tags
  };
}
