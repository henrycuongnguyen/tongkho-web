/**
 * PostgreSQL News & Project Service
 * Fetches news articles and projects from PostgreSQL database using Drizzle ORM
 *
 * Phase 1: v1-compatible dynamic folder queries
 */
import { db } from "@/db";
import { news, project, type NewsRow, type ProjectRow } from "@/db/schema";
import { folder as folderTable } from "@/db/schema/menu";
import { eq, and, ne, desc, asc, inArray, isNull, isNotNull, sql } from "drizzle-orm";
import type { NewsArticle, Project, Folder, NewsCategory } from "@/types/property";
import { generateSlug } from "@/utils/format";

// Base URL for uploaded images
const UPLOADS_BASE_URL = "https://quanly.tongkhobds.com";

/**
 * Get category by folder ID (temporary mapping until Phase 2)
 * Phase 2 will use folder.label directly for category mapping
 */
function getCategoryByFolderId(folderId: number | null): NewsCategory {
  if (!folderId) return 'tips';

  const categoryMap: Record<number, NewsCategory> = {
    26: 'policy',      // quy-hoach-phap-ly (planning & legal)
    27: 'tips',        // noi-ngoai-that (interior/exterior design)
    37: 'tips',        // phong-thuy-nha-o (feng shui)
    // More mappings can be added as discovered
  };

  return categoryMap[folderId] || 'tips';
}

/**
 * Map database row to NewsArticle interface
 */
function mapNewsRowToArticle(row: NewsRow): NewsArticle {
  const slug = generateSlug(row.name || '');
  const category = getCategoryByFolderId(row.folder);

  return {
    id: String(row.id),
    title: row.name || "",
    slug,
    excerpt: row.description?.slice(0, 200) || "",
    content: fixLocalhostUrls(row.htmlcontent || row.description || ""),
    thumbnail: getFullImageUrl(row.avatar),
    category,
    author: "TongkhoBDS",
    publishedAt: row.publishOn?.toISOString() || new Date().toISOString(),
    views: Math.floor(Math.random() * 5000) + 500, // Placeholder, DB doesn't have views
  };
}

/**
 * Get news articles by folder slug (v1-compatible)
 * Matches v1 logic: cms.get_folder(folder) + cms.get_content(tablename='news', folder=folder_id)
 *
 * @param folderSlug - Folder slug (e.g., "du-an-noi-bat")
 * @param page - Page number (1-indexed)
 * @param itemsPerPage - Items per page (default: 9)
 * @returns News articles, total count, and folder metadata
 */
export async function getNewsByFolder(
  folderSlug: string,
  page: number = 1,
  itemsPerPage: number = 9
): Promise<{ items: NewsArticle[]; total: number; folder: Folder | null }> {
  // 1. Get folder by slug (v1: cms.get_folder)
  const folder = await db
    .select()
    .from(folderTable)
    .where(eq(folderTable.name, folderSlug))
    .limit(1)
    .then(rows => rows[0] || null);

  if (!folder) {
    return { items: [], total: 0, folder: null };
  }

  // 2. Get news by folder (v1: cms.get_content)
  const offset = (page - 1) * itemsPerPage;
  const newsRows = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.folder, folder.id),
        eq(news.aactive, true),
        isNotNull(news.avatar),
        ne(news.avatar, '')
      )
    )
    .orderBy(
      asc(news.displayOrder),  // v1: display_order ASC
      desc(news.id)             // v1: id DESC
    )
    .limit(itemsPerPage)
    .offset(offset);

  // 3. Get total count (v1: cms.get_count)
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(news)
    .where(
      and(
        eq(news.folder, folder.id),
        eq(news.aactive, true),
        isNotNull(news.avatar),
        ne(news.avatar, '')
      )
    )
    .then(rows => rows[0]?.count || 0);

  // 4. Map to NewsArticle type
  const items = newsRows.map(row => mapNewsRowToArticle(row));

  return { items, total: countResult, folder: folder as Folder };
}

/**
 * Get news article by slug
 */
export async function getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  const result = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.aactive, true),
        // Removed hardcoded folder filter - search all folders
        isNotNull(news.avatar),
        ne(news.avatar, '')
      )
    )
    .orderBy(
      asc(news.displayOrder),  // v1: display_order ASC
      desc(news.id)             // v1: id DESC
    );

  // Find article by generated slug
  const matchingRow = result.find(
    (row) => generateSlug(row.name || '') === slug
  );

  if (!matchingRow) {
    return null;
  }

  return mapNewsRowToArticle(matchingRow);
}

/**
 * Get latest news articles (v1-compatible sort order)
 */
export async function getLatestNews(limit: number = 8): Promise<NewsArticle[]> {
  const result = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.aactive, true),
        // Removed hardcoded folder filter - get from ALL folders
        isNotNull(news.avatar),
        ne(news.avatar, '')
      )
    )
    .orderBy(
      asc(news.displayOrder),  // v1: display_order ASC
      desc(news.id)             // v1: id DESC
    )
    .limit(limit);

  return result.map((row) => mapNewsRowToArticle(row));
}

/**
 * Get featured projects
 */
export async function getFeaturedProjects(limit: number = 5): Promise<Project[]> {
  // Try featured first
  let result = await db
    .select()
    .from(project)
    .where(
      and(
        eq(project.aactive, true),
        eq(project.isFeatured, true),
        isNull(project.parentId)
      )
    )
    .orderBy(desc(project.createdOn))
    .limit(limit);

  // Fallback to any active projects if no featured
  if (result.length === 0) {
    result = await db
      .select()
      .from(project)
      .where(
        and(
          eq(project.aactive, true),
          isNull(project.parentId)
        )
      )
      .orderBy(desc(project.createdOn))
      .limit(limit);
  }

  return result.map((row) => mapToProject(row));
}

/**
 * Map database row to Project interface
 */
function mapToProject(row: ProjectRow): Project {
  // Parse gallery images
  let images: string[] = [];
  try {
    const rawImages = JSON.parse(row.galleryImages || "[]") as string[];
    images = rawImages.map((img) => getFullImageUrl(img));
  } catch {
    images = [];
  }

  // Add main image to front if exists
  const mainImage = getFullImageUrl(row.mainImage);
  if (mainImage && !images.includes(mainImage)) {
    images.unshift(mainImage);
  }

  // Ensure at least 2 images for carousel
  if (images.length < 2 && mainImage) {
    images = [mainImage, mainImage];
  }

  // Map project status
  const statusMap: Record<string, Project["status"]> = {
    "Đang mở bán": "selling",
    "Sắp mở bán": "upcoming",
    "Đã bán hết": "sold_out",
    "Hoàn thành": "completed",
  };
  const status = statusMap[row.projectStatus || ""] || "selling";

  // Format area - projectArea is numeric type from DB
  const projectAreaNum = row.projectArea ? Number(row.projectArea) : 0;
  const areaInHa = projectAreaNum
    ? projectAreaNum >= 10000
      ? `${(projectAreaNum / 10000).toFixed(1)} ha`
      : `${projectAreaNum.toLocaleString()} m²`
    : "N/A";

  // Parse amenities from utilities
  const amenities = row.utilities
    ? row.utilities.split(",").map((s) => s.trim())
    : [];

  return {
    id: String(row.id),
    name: row.projectName || "",
    slug: row.slug || generateSlug(row.projectName || ""),
    developer: row.developerName || "N/A",
    location: `${row.streetAddress || ""}, ${row.district || ""}`.trim().replace(/^,\s*/, ""),
    city: row.city || "",
    status,
    totalUnits: row.totalUnits || 0,
    priceRange: row.priceDescription || "Liên hệ",
    area: areaInHa,
    description: row.description || "",
    images,
    thumbnail: mainImage || images[0] || "",
    amenities,
    completionDate: undefined,
    towers: row.totalTowers || undefined,
    isFeatured: row.isFeatured || false,
  };
}

/**
 * Get full image URL from relative path
 */
function getFullImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Handle news avatar format (e.g., "news.avatar.xxx.jpg")
  if (path.startsWith("news.")) {
    return `${UPLOADS_BASE_URL}/tongkho/static/uploads/news/${path}`;
  }
  // Handle regular uploads
  if (path.startsWith("uploads/") || path.startsWith("/uploads/")) {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${UPLOADS_BASE_URL}${cleanPath}`;
  }
  return `${UPLOADS_BASE_URL}/${path}`;
}

/**
 * Fix localhost URLs in HTML content
 * Replaces http://localhost/... with https://quanly.tongkhobds.com/...
 */
function fixLocalhostUrls(content: string | null | undefined): string {
  if (!content) return "";
  // Replace localhost URLs with production domain
  return content.replace(
    /http:\/\/localhost\//g,
    'https://quanly.tongkhobds.com/'
  );
}
