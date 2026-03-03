/**
 * PostgreSQL Property Service
 * Fetches property data from PostgreSQL database for SSR pages
 */
import { db } from "@/db";
import { realEstate, type RealEstateRow } from "@/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";
import type { Property, PropertyType, TransactionType, LegalDocument } from "@/types/property";

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

/**
 * Get property by slug
 */
export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const result = await db
    .select()
    .from(realEstate)
    .where(
      and(
        eq(realEstate.slug, slug),
        eq(realEstate.aactive, true)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return mapToProperty(result[0]);
}

/**
 * Get related properties (same type, exclude current)
 */
export async function getRelatedProperties(
  excludeId: string,
  propertyTypeId: number,
  limit: number = 4
): Promise<Property[]> {
  const result = await db
    .select()
    .from(realEstate)
    .where(
      and(
        ne(realEstate.id, Number(excludeId)),
        eq(realEstate.propertyTypeId, propertyTypeId),
        eq(realEstate.aactive, true)
      )
    )
    .orderBy(desc(realEstate.createdOn))
    .limit(limit);

  return result.map((row) => mapToProperty(row));
}

/**
 * Map database row to Property interface
 */
function mapToProperty(row: RealEstateRow): Property {
  // Parse images from JSON string
  let images: string[] = [];
  try {
    const rawImages = JSON.parse(row.images || "[]") as string[];
    images = rawImages.map((img) => getFullImageUrl(img));
  } catch {
    images = [];
  }

  // Get thumbnail with full URL
  const thumbnail = getFullImageUrl(row.mainImage) || images[0] || "";

  // Determine property type from ID
  const propertyType = PROPERTY_TYPE_MAP[row.propertyTypeId || 14] || "house";

  // Determine transaction type
  const transactionType: TransactionType =
    row.transactionType === 1 ? "sale" : "rent";

  // Parse price and unit from priceDescription
  const { price, priceUnit } = parsePriceDescription(row.priceDescription);

  // Extract features from dataJson and other fields
  const features = extractFeatures(row);

  // Use htmlContent if description is short/empty
  const description =
    row.description && row.description.length > 50
      ? row.description
      : stripHtml(row.htmlContent || row.description || "");

  // Parse lat/lng from latlng field (format: "lat,lng")
  const { lat, lng } = parseLatLng(row.latlng);

  // Parse legal documents from legalDocumentUrl
  const legalDocuments = parseLegalDocuments(row.legalDocumentUrl);

  return {
    id: String(row.id),
    title: row.title || "",
    slug: row.slug || "",
    type: propertyType,
    propertyTypeId: row.propertyTypeId || undefined,
    propertyTypeName: row.propertyType || undefined,
    transactionType,
    price,
    priceUnit,
    area: Number(row.area) || 0,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
    floors: row.floors ?? undefined,
    yearBuilt: row.yearBuilt || undefined,
    address: row.streetAddress || "",
    ward: row.ward || undefined,
    district: row.district || "",
    city: row.city || "",
    wardId: row.wardId || undefined,
    districtId: row.districtId || undefined,
    cityId: row.cityId || undefined,
    lat,
    lng,
    description,
    htmlContent: row.htmlContent || undefined,
    images,
    thumbnail,
    features,
    videoUrl: row.videoUrl || undefined,
    legalDocuments,
    priceHistory: row.priceHistory || undefined,
    createdAt:
      row.createdOn?.toISOString() ||
      row.createdTime?.toISOString() ||
      new Date().toISOString(),
    isFeatured: row.isFeatured || false,
    isHot: row.isVerified || false,
    realEstateCode: row.realEstateCode || undefined,
  };
}

/**
 * Parse lat/lng from latlng string (format: "lat,lng")
 */
function parseLatLng(latlng: string | null): { lat?: number; lng?: number } {
  if (!latlng) return {};
  const parts = latlng.split(",");
  if (parts.length !== 2) return {};
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || isNaN(lng)) return {};
  return { lat, lng };
}

/**
 * Parse legal documents from URL or JSON string
 */
function parseLegalDocuments(url: string | null): LegalDocument[] {
  if (!url) return [];

  // Try parsing as JSON array first
  try {
    const docs = JSON.parse(url);
    if (Array.isArray(docs)) {
      return docs.map((doc: { url?: string; link_url?: string; title?: string; type?: string }) => ({
        url: doc.url || doc.link_url || "",
        title: doc.title || "Tài liệu pháp lý",
        type: getDocumentType(doc.type || doc.url || doc.link_url || ""),
      }));
    }
  } catch {
    // Not JSON, treat as single URL
  }

  // Single URL
  if (url.startsWith("http") || url.startsWith("/")) {
    return [{
      url: url,
      title: "Tài liệu pháp lý",
      type: getDocumentType(url),
    }];
  }

  return [];
}

/**
 * Get document type from URL or type string
 */
function getDocumentType(urlOrType: string): LegalDocument["type"] {
  const lower = urlOrType.toLowerCase();
  if (lower.includes("pdf") || lower.endsWith(".pdf")) return "pdf";
  if (lower.includes("doc") || lower.endsWith(".doc") || lower.endsWith(".docx")) return "doc";
  return "other";
}

/**
 * Parse price value and unit from priceDescription (e.g., "7.3 tỷ", "300 triệu")
 */
function parsePriceDescription(priceDescription: string | null): {
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
function extractFeatures(row: RealEstateRow): string[] {
  const features: string[] = [];

  // Parse dataJson for tiện ích
  try {
    if (row.dataJson && typeof row.dataJson === 'object') {
      const dataJson = row.dataJson as { tienich?: string[] };
      if (Array.isArray(dataJson.tienich)) {
        features.push(...dataJson.tienich);
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  // Add features from other fields
  if (row.floors) features.push(`${row.floors} tầng`);
  if (row.houseDirection) features.push(`Hướng ${row.houseDirection}`);
  if (row.furniture) features.push(row.furniture);
  if (row.frontageWidth) features.push(`Mặt tiền ${row.frontageWidth}m`);
  if (row.roadWidth) features.push(`Đường ${row.roadWidth}m`);

  return features;
}

/**
 * Get full image URL from relative path
 */
function getFullImageUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  // Ensure path starts with '/' for correct URL construction
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${UPLOADS_BASE_URL}${normalizedPath}`;
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

// Legacy singleton export for backward compatibility
export const postgresPropertyService = {
  getPropertyBySlug,
  getRelatedProperties,
};
