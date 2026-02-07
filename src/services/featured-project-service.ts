/**
 * Featured Project Service
 * Query featured projects for sidebar
 */

import { db } from '@/db';
import { project } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface FeaturedProject {
  id: number;
  title: string;
  slug: string;
  mainImage: string | null;
  streetAddress: string | null;
  district: string | null;
  city: string | null;
}

// Base URL for images
const UPLOADS_BASE_URL = 'https://quanly.tongkhobds.com';

/**
 * Get featured projects for sidebar
 */
export async function getFeaturedProjects(
  limit: number = 5,
  excludeId?: number
): Promise<FeaturedProject[]> {
  try {
    const rows = await db
      .select({
        id: project.id,
        title: project.projectName,
        slug: project.slug,
        mainImage: project.mainImage,
        streetAddress: project.streetAddress,
        district: project.district,
        city: project.city,
      })
      .from(project)
      .where(
        and(
          eq(project.isFeatured, true),
          eq(project.aactive, true)
        )
      )
      .orderBy(desc(project.createdOn))
      .limit(limit + (excludeId ? 1 : 0));  // Get extra if we need to exclude

    // Filter out excluded project and limit
    const filtered = excludeId
      ? rows.filter(p => p.id !== excludeId).slice(0, limit)
      : rows.slice(0, limit);

    return filtered.map(row => ({
      id: row.id,
      title: row.title || '',
      slug: row.slug || '',
      mainImage: getFullImageUrl(row.mainImage),
      streetAddress: row.streetAddress,
      district: row.district,
      city: row.city,
    }));

  } catch (error) {
    console.error('[FeaturedProjectService] Failed to fetch:', error);
    return [];
  }
}

/**
 * Get full image URL
 */
function getFullImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOADS_BASE_URL}${path}`;
}
