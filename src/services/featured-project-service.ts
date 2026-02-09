/**
 * Featured Project Service
 * Query featured projects for sidebar from news table by folder
 * Matches v1 logic: /api_customer/news_by_folder.json?folder=banner-du-an-noi-bat
 */

import { db } from '@/db';
import { news, folder } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getS3ImageUrl } from '@/utils/s3-url-helper';

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
      mainImage: getS3ImageUrl(row.avatar) || null,
      description: row.description,
    }));

  } catch (error) {
    console.error('[FeaturedProjectService] Failed to fetch:', error);
    return [];
  }
}
