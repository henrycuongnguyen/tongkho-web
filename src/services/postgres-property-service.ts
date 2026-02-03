/**
 * PostgreSQL Property Service
 * Fetches property data from PostgreSQL database for SSR pages
 */
import pg from "pg";
import type { Property, PropertyType, TransactionType } from "@/types/property";

const { Pool } = pg;

// Base URL for uploaded images
const UPLOADS_BASE_URL = "https://quanly.tongkhobds.com";

// Property type ID mapping (from DB to frontend)
const PROPERTY_TYPE_MAP: Record<number, PropertyType> = {
  1: "apartment",
  2: "villa",
  3: "office",
  4: "shophouse",
  5: "warehouse",
  14: "house",
  46: "land",
};

// Database row interface
interface DBPropertyRow {
  id: number;
  title: string;
  slug: string;
  property_type_id: number;
  property_type: string;
  transaction_type: number;
  price: string | null;
  price_description: string | null;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string | null;
  district: string | null;
  street_address: string | null;
  description: string | null;
  html_content: string | null;
  images: string | null;
  main_image: string | null;
  is_featured: boolean;
  is_verified: boolean;
  created_on: Date | null;
  created_time: Date | null;
  data_json: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  furniture: string | null;
  floors: number | null;
  house_direction: string | null;
  frontage_width: number | null;
  road_width: number | null;
}

/**
 * PostgreSQL Property Service for fetching real estate data
 */
export class PostgresPropertyService {
  private pool: pg.Pool | null = null;

  constructor() {
    this.initPool();
  }

  private initPool(): void {
    // Use import.meta.env (dev) with process.env fallback (production)
    const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      console.error("[PG] DATABASE_URL not configured");
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

  /**
   * Get property by slug
   */
  async getPropertyBySlug(slug: string): Promise<Property | null> {
    if (!this.pool) {
      throw new Error("[PG] Database connection not available - DATABASE_URL not configured");
    }

    const result = await this.pool.query<DBPropertyRow>(
      `SELECT
        id, title, slug, property_type_id, property_type,
        transaction_type, price, price_description, area,
        bedrooms, bathrooms, city, district, street_address,
        description, html_content, images, main_image,
        is_featured, is_verified, created_on, created_time,
        data_json, contact_name, contact_phone, contact_email,
        furniture, floors, house_direction, frontage_width, road_width
      FROM real_estate
      WHERE slug = $1 AND aactive = true
      LIMIT 1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToProperty(result.rows[0]);
  }

  /**
   * Get related properties (same type, exclude current)
   */
  async getRelatedProperties(
    excludeId: string,
    propertyTypeId: number,
    limit: number = 4
  ): Promise<Property[]> {
    if (!this.pool) {
      throw new Error("[PG] Database connection not available - DATABASE_URL not configured");
    }

    const result = await this.pool.query<DBPropertyRow>(
      `SELECT
        id, title, slug, property_type_id, property_type,
        transaction_type, price, price_description, area,
        bedrooms, bathrooms, city, district, street_address,
        description, html_content, images, main_image,
        is_featured, is_verified, created_on, created_time,
        data_json, contact_name, contact_phone, contact_email,
        furniture, floors, house_direction, frontage_width, road_width
      FROM real_estate
      WHERE id != $1
        AND property_type_id = $2
        AND aactive = true
      ORDER BY created_on DESC
      LIMIT $3`,
      [excludeId, propertyTypeId, limit]
    );

    return result.rows.map((row) => this.mapToProperty(row));
  }

  /**
   * Map database row to Property interface
   */
  private mapToProperty(row: DBPropertyRow): Property {
    // Parse images from JSON string
    let images: string[] = [];
    try {
      const rawImages = JSON.parse(row.images || "[]") as string[];
      images = rawImages.map((img) => this.getFullImageUrl(img));
    } catch {
      images = [];
    }

    // Get thumbnail with full URL
    const thumbnail = this.getFullImageUrl(row.main_image) || images[0] || "";

    // Determine property type from ID
    const propertyType = PROPERTY_TYPE_MAP[row.property_type_id] || "house";

    // Determine transaction type
    const transactionType: TransactionType =
      row.transaction_type === 1 ? "sale" : "rent";

    // Parse price and unit from price_description
    const { price, priceUnit } = this.parsePriceDescription(
      row.price_description
    );

    // Extract features from data_json and other fields
    const features = this.extractFeatures(row);

    // Use html_content if description is short/empty
    const description =
      row.description && row.description.length > 50
        ? row.description
        : this.stripHtml(row.html_content || row.description || "");

    return {
      id: String(row.id),
      title: row.title || "",
      slug: row.slug || "",
      type: propertyType,
      transactionType,
      price,
      priceUnit,
      area: row.area || 0,
      bedrooms: row.bedrooms ?? undefined,
      bathrooms: row.bathrooms ?? undefined,
      address: row.street_address || "",
      district: row.district || "",
      city: row.city || "",
      description,
      images,
      thumbnail,
      features,
      createdAt:
        row.created_on?.toISOString() ||
        row.created_time?.toISOString() ||
        new Date().toISOString(),
      isFeatured: row.is_featured || false,
      isHot: row.is_verified || false,
    };
  }

  /**
   * Parse price value and unit from price_description (e.g., "7.3 tỷ", "300 triệu")
   */
  private parsePriceDescription(priceDescription: string | null): {
    price: number;
    priceUnit: Property["priceUnit"];
  } {
    if (
      !priceDescription ||
      priceDescription.toLowerCase().includes("thỏa thuận") ||
      priceDescription.toLowerCase().includes("liên hệ")
    ) {
      return { price: -1, priceUnit: "VND" };
    }

    const numMatch = priceDescription.match(/[\d.,]+/);
    const numStr = numMatch ? numMatch[0].replace(",", ".") : "";
    const price = parseFloat(numStr);

    if (isNaN(price) || price === 0) {
      return { price: -1, priceUnit: "VND" };
    }

    let priceUnit: Property["priceUnit"] = "VND";
    if (priceDescription.includes("tỷ")) {
      priceUnit = "billion";
    } else if (priceDescription.includes("triệu/tháng")) {
      priceUnit = "per_month";
    } else if (priceDescription.includes("triệu")) {
      priceUnit = "million";
    }

    return { price, priceUnit };
  }

  /**
   * Extract features from various DB fields
   */
  private extractFeatures(row: DBPropertyRow): string[] {
    const features: string[] = [];

    // Parse data_json for tiện ích
    try {
      const dataJson = JSON.parse(row.data_json || "{}");
      if (Array.isArray(dataJson.tienich)) {
        features.push(...dataJson.tienich);
      }
    } catch {
      // Ignore JSON parse errors
    }

    // Add features from other fields
    if (row.floors) features.push(`${row.floors} tầng`);
    if (row.house_direction) features.push(`Hướng ${row.house_direction}`);
    if (row.furniture) features.push(row.furniture);
    if (row.frontage_width) features.push(`Mặt tiền ${row.frontage_width}m`);
    if (row.road_width) features.push(`Đường ${row.road_width}m`);

    return features;
  }

  /**
   * Get full image URL from relative path
   */
  private getFullImageUrl(path: string | null | undefined): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${UPLOADS_BASE_URL}${path}`;
  }

  /**
   * Strip HTML tags from string
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }

  /**
   * Close pool connections (for cleanup)
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Singleton instance
export const postgresPropertyService = new PostgresPropertyService();
