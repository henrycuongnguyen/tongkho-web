/**
 * Featured Project Service
 * Query featured projects for sidebar from news table by folder
 * Matches v1 logic: /api_customer/news_by_folder.json?folder=banner-du-an-noi-bat
 */

import { db } from '@/db';
import { news, folder } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Base URL for uploaded images (same as postgres-news-project-service)
const UPLOADS_BASE_URL = 'https://quanly.tongkhobds.com';

export interface FeaturedProject {
  id: number;
  title: string;
  slug: string;
  mainImage: string | null;
  description: string | null;
}

// Featured projects folder name (same as v1)
const FEATURED_PROJECTS_FOLDER = 'banner-du-an-noi-bat';

/**
 * Get full image URL from news avatar path
 * Handles both local uploads and S3 storage
 *
 * Formats supported:
 * - Local: "news.avatar.xxx.jpg" → https://quanly.tongkhobds.com/tongkho/static/uploads/news/xxx.jpg
 * - S3 key: "news/xxx.jpg" → https://s3-han02.fptcloud.com/bds-crawl-data/news/xxx.jpg
 * - Full URL: "https://..." → returns as-is
 */
function getNewsAvatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Local upload format: "news.avatar.xxx.jpg"
  if (path.startsWith('news.avatar.')) {
    return `${UPLOADS_BASE_URL}/tongkho/static/uploads/news/${path}`;
  }

  // S3 key format: "news/xxx.jpg" or "uploads/news/xxx.jpg" (without "news.avatar." prefix)
  // These are direct S3 paths
  if (!path.startsWith('news.avatar.')) {
    const S3_ENDPOINT = 'https://s3-han02.fptcloud.com';
    const S3_BUCKET = 'bds-crawl-data';
    return `${S3_ENDPOINT}/${S3_BUCKET}/${path}`;
  }

  // Fallback to S3
  const S3_ENDPOINT = 'https://s3-han02.fptcloud.com';
  const S3_BUCKET = 'bds-crawl-data';
  return `${S3_ENDPOINT}/${S3_BUCKET}/${path}`;
}

/**
 * Get featured projects for sidebar
 * Queries news table by folder name, matching v1 behavior
 */
export async function getFeaturedProjects(
  limit: number = 5,
  excludeId?: number
): Promise<FeaturedProject[]> {
  try {
    // First, get the folder ID by name
    const folderRow = await db
      .select({ id: folder.id })
      .from(folder)
      .where(eq(folder.name, FEATURED_PROJECTS_FOLDER))
      .limit(1);

    if (!folderRow.length) {
      console.warn(`[FeaturedProjectService] Folder "${FEATURED_PROJECTS_FOLDER}" not found`);
      return [];
    }

    const folderId = folderRow[0].id;

    // Query news by folder ID
    const rows = await db
      .select({
        id: news.id,
        name: news.name,
        description: news.description,
        avatar: news.avatar,
        versionDocs: news.versionDocs,
        displayOrder: news.displayOrder,
      })
      .from(news)
      .where(
        and(
          eq(news.folder, folderId),
          eq(news.aactive, true)
        )
      )
      .orderBy(desc(news.displayOrder), desc(news.publishOn))
      .limit(limit + (excludeId ? 1 : 0));  // Get extra if we need to exclude

    // Filter out excluded news and limit
    const filtered = excludeId
      ? rows.filter(n => n.id !== excludeId).slice(0, limit)
      : rows.slice(0, limit);

    return filtered.map(row => ({
      id: row.id,
      title: row.name || '',
      // Use version_docs (project slug) directly from news table, fallback to id
      slug: row.versionDocs || String(row.id),
      mainImage: getNewsAvatarUrl(row.avatar),
      description: row.description,
    }));

  } catch (error) {
    console.error('[FeaturedProjectService] Failed to fetch:', error);
    return [];
  }
}
