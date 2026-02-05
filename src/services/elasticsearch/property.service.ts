/**
 * Elasticsearch Property Service
 *
 * Handles property-specific searches in Elasticsearch
 * Searches the "real_estate" index
 */

import type { Property, TransactionType } from "@/types/property";
import { ElasticsearchBaseService } from "./base.service";
import {
  ES_INDICES,
  TRANSACTION_TYPE_MAP,
  PROPERTY_TYPE_MAP,
  UPLOADS_BASE_URL,
  type ESHit,
  type ESSource,
} from "./constants";

export class ElasticsearchPropertyService extends ElasticsearchBaseService {
  private defaultIndex: string;

  constructor() {
    super();
    this.defaultIndex = import.meta.env.ES_INDEX || process.env.ES_INDEX || ES_INDICES.PROPERTIES;
  }

  /**
   * Search properties by transaction type (sale or rent)
   * @param transactionType Type of transaction (sale/rent)
   * @param limit Number of results to return
   * @returns Array of Property objects
   */
  async searchProperties(transactionType: TransactionType, limit: number = 4): Promise<Property[]> {
    const esTransactionType = TRANSACTION_TYPE_MAP[transactionType];

    const result = await this.search<ESSource>(
      this.defaultIndex,
      {
        bool: {
          must: [{ term: { transaction_type: esTransactionType } }],
        },
      },
      {
        size: limit,
        sort: [{ created_on: "desc" }],
      }
    );

    return result.hits.map((hit) => this.mapToProperty(hit as any));
  }

  /**
   * Map Elasticsearch hit to Property interface
   * @param hit Elasticsearch hit object
   * @returns Property object
   */
  private mapToProperty(hit: ESHit<ESSource>): Property {
    const src = hit._source;

    // Parse images from JSON string and prepend base URL
    let images: string[] = [];
    try {
      const rawImages = JSON.parse(src.images || "[]") as string[];
      images = rawImages.map((img) => this.getFullImageUrl(img));
    } catch {
      images = [];
    }

    // Get thumbnail with full URL
    const thumbnail = this.getFullImageUrl(src.main_image) || images[0] || "";

    // Determine property type from ID
    const propertyType = PROPERTY_TYPE_MAP[src.property_type_id] || "house";

    // Determine transaction type from numeric value
    const transactionType: TransactionType = src.transaction_type === 1 ? "sale" : "rent";

    // Parse price and unit from price_description
    const { price, priceUnit } = this.parsePriceDescription(src.price_description);

    return {
      id: String(src.id || hit._id),
      title: src.title || "",
      slug: src.slug || "",
      type: propertyType,
      transactionType,
      price,
      priceUnit,
      area: src.area || 0,
      bedrooms: src.bedrooms ?? undefined,
      bathrooms: src.bathrooms ?? undefined,
      address: src.street_address || "",
      district: src.district || "",
      city: src.city || "",
      description: "",
      images,
      thumbnail,
      features: [],
      createdAt: src.created_on || src.created_time || new Date().toISOString(),
      isFeatured: src.is_featured || false,
      isHot: src.is_verified || false,
    };
  }

  /**
   * Parse price value and unit from price_description
   * @param priceDescription Vietnamese price description (e.g., "7.3 tỷ", "300 triệu")
   * @returns Object with price and priceUnit
   */
  private parsePriceDescription(priceDescription: string): {
    price: number;
    priceUnit: Property["priceUnit"];
  } {
    // Handle empty or special descriptions (negotiable, contact, etc.)
    if (
      !priceDescription ||
      priceDescription.toLowerCase().includes("thỏa thuận") ||
      priceDescription.toLowerCase().includes("liên hệ")
    ) {
      return { price: -1, priceUnit: "VND" }; // -1 signals "contact for price"
    }

    // Extract numeric value (supports both dot and comma as decimal separator)
    const numMatch = priceDescription.match(/[\d.,]+/);
    const numStr = numMatch ? numMatch[0].replace(",", ".") : "";
    const price = parseFloat(numStr);

    // If no valid number found, treat as negotiable
    if (isNaN(price) || price === 0) {
      return { price: -1, priceUnit: "VND" };
    }

    // Determine unit from description
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
   * Get full image URL from relative path
   * @param path Relative or absolute image path
   * @returns Full image URL
   */
  private getFullImageUrl(path: string | null | undefined): string {
    if (!path) return "";
    // Already a full URL
    if (path.startsWith("http")) return path;
    // Prepend base URL for relative paths
    return `${UPLOADS_BASE_URL}${path}`;
  }
}

// Singleton instance
export const elasticsearchPropertyService = new ElasticsearchPropertyService();
