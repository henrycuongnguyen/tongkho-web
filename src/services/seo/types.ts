/**
 * SEO Metadata Type Definitions
 */

/**
 * Raw SEO metadata result from database or ElasticSearch
 * Maps directly to seo_meta_data table schema
 */
export interface SeoMetadataResult {
  id?: number;
  slug: string;
  pageType?: string | null;
  title?: string | null;
  titleWeb?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  canonicalUrl?: string | null;
  schemaType?: string | null;
  schemaJson?: string | null;
  breadcrumbJson?: string | null;
  contentAbove?: string | null;
  contentBelow?: string | null;
  isActive?: boolean | null;
  isDefault?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  orderby?: number | null;
  cachedHtml?: string | null;
  socialTags?: string | null;
}

/**
 * Formatted SEO metadata for application use
 * All fields guaranteed to be non-null (empty string if missing)
 */
export interface SeoMetadata {
  /** Page title (H1) - Use titleWeb if available, otherwise title */
  title: string;

  /** Web-specific title (for display, not meta tag) */
  titleWeb?: string;

  /** Meta description */
  metaDescription?: string;

  /** Meta keywords */
  metaKeywords?: string;

  /** Content to display above listings */
  contentAbove?: string;

  /** Content to display below listings (main SEO content) */
  contentBelow?: string;

  /** Open Graph title */
  ogTitle?: string;

  /** Open Graph description */
  ogDescription?: string;

  /** Open Graph image URL */
  ogImage?: string;

  /** Twitter card title */
  twitterTitle?: string;

  /** Twitter card description */
  twitterDescription?: string;

  /** Twitter card image URL */
  twitterImage?: string;

  /** Canonical URL */
  canonicalUrl?: string;

  /** Schema.org type (e.g., 'WebPage', 'Product') */
  schemaType?: string;

  /** Schema.org JSON-LD markup */
  schemaJson?: string;

  /** Breadcrumb JSON-LD markup */
  breadcrumbJson?: string;
}

/**
 * Options for fetching SEO metadata
 */
export interface SeoMetadataOptions {
  /** URL slug (e.g., '/mua-ban/ha-noi') */
  slug: string;

  /** Whether to apply price context (default: true) */
  applyPriceContext?: boolean;

  /** Whether to replace image URLs (default: true) */
  replaceImageUrls?: boolean;
}

/**
 * API response wrapper (optional - for Phase 4)
 */
export interface SeoMetadataApiResponse {
  status: 'success' | 'error';
  data?: SeoMetadata;
  message?: string;
}

/**
 * ElasticSearch hit type for SEO metadata
 */
export interface SeoMetadataESHit {
  _index: string;
  _id: string;
  _score: number;
  _source: SeoMetadataResult;
}

/**
 * ElasticSearch response type for SEO metadata
 */
export interface SeoMetadataESResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number | null;
    hits: SeoMetadataESHit[];
  };
}
