/**
 * SEO Metadata Database Service
 * PostgreSQL fallback for SEO metadata queries
 */

import { db } from '@/db';
import { seoMetaData } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';
import type { SeoMetadataResult } from './types';

/**
 * Get SEO metadata from PostgreSQL by slug
 * Filters by is_active = true
 *
 * @param slug - URL path (e.g., '/mua-ban/ha-noi')
 * @returns SEO metadata or null if not found
 */
export async function getSeoMetadataFromDb(slug: string): Promise<SeoMetadataResult | null> {
  if (!slug || slug.trim().length === 0) {
    console.error('[SeoMetadataDB] Empty slug provided');
    return null;
  }

  try {
    const result = await db
      .select()
      .from(seoMetaData)
      .where(
        and(
          eq(seoMetaData.slug, slug.trim()),
          eq(seoMetaData.isActive, true)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return mapDbRecordToResult(result[0]);

  } catch (error) {
    console.error('[SeoMetadataDB] Query failed:', error);
    return null;
  }
}

/**
 * Get default SEO metadata (fallback when slug not found)
 * Queries for slug = '/default/'
 *
 * @returns Default SEO metadata or null
 */
export async function getDefaultSeoMetadata(): Promise<SeoMetadataResult | null> {
  try {
    const result = await db
      .select()
      .from(seoMetaData)
      .where(
        and(
          eq(seoMetaData.slug, '/default/'),
          eq(seoMetaData.isActive, true)
        )
      )
      .limit(1);

    if (result.length === 0) {
      console.warn('[SeoMetadataDB] No default SEO metadata found in database');
      return null;
    }

    return mapDbRecordToResult(result[0]);

  } catch (error) {
    console.error('[SeoMetadataDB] Failed to fetch default SEO:', error);
    return null;
  }
}

/**
 * Map database record to SeoMetadataResult type
 * Handles camelCase conversion and null values
 */
function mapDbRecordToResult(record: any): SeoMetadataResult {
  return {
    id: record.id,
    slug: record.slug,
    pageType: record.pageType || record.page_type,
    title: record.title,
    titleWeb: record.titleWeb || record.title_web,
    metaDescription: record.metaDescription || record.meta_description,
    metaKeywords: record.metaKeywords || record.meta_keywords,
    ogTitle: record.ogTitle || record.og_title,
    ogDescription: record.ogDescription || record.og_description,
    ogImage: record.ogImage || record.og_image,
    twitterTitle: record.twitterTitle || record.twitter_title,
    twitterDescription: record.twitterDescription || record.twitter_description,
    twitterImage: record.twitterImage || record.twitter_image,
    canonicalUrl: record.canonicalUrl || record.canonical_url,
    schemaType: record.schemaType || record.schema_type,
    schemaJson: record.schemaJson || record.schema_json,
    breadcrumbJson: record.breadcrumbJson || record.breadcrumb_json,
    contentAbove: record.contentAbove || record.content_above,
    contentBelow: record.contentBelow || record.content_below,
    isActive: record.isActive || record.is_active,
    isDefault: record.isDefault || record.is_default,
    createdAt: record.createdAt || record.created_at,
    updatedAt: record.updatedAt || record.updated_at,
    orderby: record.orderby,
    cachedHtml: record.cachedHtml || record.cached_html,
    socialTags: record.socialTags || record.social_tags
  };
}

/**
 * Check if SEO metadata exists for a given slug
 * Lightweight check (doesn't return full record)
 *
 * @param slug - URL path
 * @returns true if exists, false otherwise
 */
export async function seoMetadataExists(slug: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: seoMetaData.id })
      .from(seoMetaData)
      .where(
        and(
          eq(seoMetaData.slug, slug.trim()),
          eq(seoMetaData.isActive, true)
        )
      )
      .limit(1);

    return result.length > 0;

  } catch (error) {
    console.error('[SeoMetadataDB] Exists check failed:', error);
    return false;
  }
}
