/**
 * PostgreSQL News & Project Service
 * Fetches news articles and projects from PostgreSQL database
 */
import pg from "pg";
import type { NewsArticle, Project } from "@/types/property";
import { mockNews, mockProjects } from "@/data/mock-properties";
import { generateSlug } from "@/utils/format";

const { Pool } = pg;

// Base URL for uploaded images
const UPLOADS_BASE_URL = "https://quanly.tongkhobds.com";

// Database row interfaces
interface DBNewsRow {
  id: number;
  name: string;
  description: string;
  htmlcontent: string;
  avatar: string;
  folder: number;
  publish_on: Date | null;
  created_on: Date | null;
  display_order: number;
}

interface DBProjectRow {
  id: number;
  slug: string;
  project_name: string;
  description: string;
  project_status: string;
  developer_name: string;
  total_units: number;
  total_towers: number;
  city: string;
  district: string;
  street_address: string;
  main_image: string;
  gallery_images: string;
  is_featured: boolean;
  created_on: Date;
  project_area: number;
  utilities: string;
  price_description: string;
}

/**
 * Service for fetching news and projects from PostgreSQL
 */
export class PostgresNewsProjectService {
  private pool: pg.Pool | null = null;

  constructor() {
    this.initPool();
  }

  private initPool(): void {
    const connectionString = import.meta.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("[PG] No DATABASE_URL configured, will use mock data");
      return;
    }

    try {
      this.pool = new Pool({
        connectionString,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    } catch (error) {
      console.error("[PG] Failed to create pool:", error);
    }
  }

  // News folder IDs for website articles (based on actual content analysis)
  // 26: quy-hoach-phap-ly, 27: noi-ngoai-that, 37: phong-thuy-nha-o
  private readonly NEWS_FOLDERS = [26, 27, 37];

  /**
   * Get news article by slug
   */
  async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    if (!this.pool) {
      console.warn("[PG] No pool, using mock news for slug lookup");
      return mockNews.find((a) => a.slug === slug) || null;
    }

    try {
      const result = await this.pool.query<DBNewsRow>(
        `SELECT id, name, description, htmlcontent, avatar, folder,
                publish_on, created_on, display_order
         FROM news
         WHERE aactive = true
           AND folder = ANY($1)
           AND avatar IS NOT NULL AND avatar != ''
         ORDER BY publish_on DESC NULLS LAST`,
        [this.NEWS_FOLDERS]
      );

      // Find article by generated slug
      const matchingRow = result.rows.find(
        (row) => generateSlug(row.name) === slug
      );

      if (!matchingRow) {
        return mockNews.find((a) => a.slug === slug) || null;
      }

      return this.mapToNewsArticle(matchingRow);
    } catch (error) {
      console.error("[PG] News slug lookup failed:", error);
      return mockNews.find((a) => a.slug === slug) || null;
    }
  }

  /**
   * Get latest news articles
   */
  async getLatestNews(limit: number = 8): Promise<NewsArticle[]> {
    if (!this.pool) {
      console.warn("[PG] No pool, using mock news");
      return mockNews.slice(0, limit);
    }

    try {
      const result = await this.pool.query<DBNewsRow>(
        `SELECT id, name, description, htmlcontent, avatar, folder,
                publish_on, created_on, display_order
         FROM news
         WHERE aactive = true
           AND folder = ANY($2)
           AND avatar IS NOT NULL AND avatar != ''
         ORDER BY publish_on DESC NULLS LAST, id DESC
         LIMIT $1`,
        [limit, this.NEWS_FOLDERS]
      );

      if (result.rows.length === 0) {
        return mockNews.slice(0, limit);
      }

      return result.rows.map((row) => this.mapToNewsArticle(row));
    } catch (error) {
      console.error("[PG] News query failed:", error);
      return mockNews.slice(0, limit);
    }
  }

  /**
   * Get featured projects
   */
  async getFeaturedProjects(limit: number = 5): Promise<Project[]> {
    if (!this.pool) {
      console.warn("[PG] No pool, using mock projects");
      return mockProjects.slice(0, limit);
    }

    try {
      const result = await this.pool.query<DBProjectRow>(
        `SELECT id, slug, project_name, description, project_status,
                developer_name, total_units, total_towers, city, district,
                street_address, main_image, gallery_images, is_featured,
                created_on, project_area, utilities, price_description
         FROM project
         WHERE aactive = true AND is_featured = true AND parent_id IS NULL
         ORDER BY created_on DESC
         LIMIT $1`,
        [limit]
      );

      if (result.rows.length === 0) {
        // Fallback to any active projects if no featured
        const fallbackResult = await this.pool.query<DBProjectRow>(
          `SELECT id, slug, project_name, description, project_status,
                  developer_name, total_units, total_towers, city, district,
                  street_address, main_image, gallery_images, is_featured,
                  created_on, project_area, utilities, price_description
           FROM project
           WHERE aactive = true AND parent_id IS NULL
           ORDER BY created_on DESC
           LIMIT $1`,
          [limit]
        );

        if (fallbackResult.rows.length === 0) {
          return mockProjects.slice(0, limit);
        }

        return fallbackResult.rows.map((row) => this.mapToProject(row));
      }

      return result.rows.map((row) => this.mapToProject(row));
    } catch (error) {
      console.error("[PG] Projects query failed:", error);
      return mockProjects.slice(0, limit);
    }
  }

  /**
   * Map database row to NewsArticle interface
   */
  private mapToNewsArticle(row: DBNewsRow): NewsArticle {
    // Generate slug from name
    const slug = generateSlug(row.name);

    // Map folder to category based on actual DB folder structure
    const categoryMap: Record<number, NewsArticle["category"]> = {
      26: "policy",        // quy-hoach-phap-ly (planning & legal)
      27: "tips",          // noi-ngoai-that (interior/exterior design)
      37: "tips",          // phong-thuy-nha-o (feng shui)
    };
    const category = categoryMap[row.folder] || "tips";

    return {
      id: String(row.id),
      title: row.name || "",
      slug,
      excerpt: row.description?.slice(0, 200) || "",
      content: row.htmlcontent || row.description || "",
      thumbnail: this.getFullImageUrl(row.avatar),
      category,
      author: "TongkhoBDS",
      publishedAt: row.publish_on?.toISOString() || new Date().toISOString(),
      views: Math.floor(Math.random() * 5000) + 500, // Placeholder, DB doesn't have views
    };
  }

  /**
   * Map database row to Project interface
   */
  private mapToProject(row: DBProjectRow): Project {
    // Parse gallery images
    let images: string[] = [];
    try {
      const rawImages = JSON.parse(row.gallery_images || "[]") as string[];
      images = rawImages.map((img) => this.getFullImageUrl(img));
    } catch {
      images = [];
    }

    // Add main image to front if exists
    const mainImage = this.getFullImageUrl(row.main_image);
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
    const status = statusMap[row.project_status] || "selling";

    // Format area
    const areaInHa = row.project_area
      ? row.project_area >= 10000
        ? `${(row.project_area / 10000).toFixed(1)} ha`
        : `${row.project_area.toLocaleString()} m²`
      : "N/A";

    // Parse amenities from utilities
    const amenities = row.utilities
      ? row.utilities.split(",").map((s) => s.trim())
      : [];

    return {
      id: String(row.id),
      name: row.project_name || "",
      slug: row.slug || generateSlug(row.project_name || ""),
      developer: row.developer_name || "N/A",
      location: `${row.street_address || ""}, ${row.district || ""}`.trim().replace(/^,\s*/, ""),
      city: row.city || "",
      status,
      totalUnits: row.total_units || 0,
      priceRange: row.price_description || "Liên hệ",
      area: areaInHa,
      description: row.description || "",
      images,
      thumbnail: mainImage || images[0] || "",
      amenities,
      completionDate: undefined,
      towers: row.total_towers || undefined,
      isFeatured: row.is_featured || false,
    };
  }

  /**
   * Get full image URL from relative path
   */
  private getFullImageUrl(path: string | null | undefined): string {
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

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Singleton instance
export const postgresNewsProjectService = new PostgresNewsProjectService();
