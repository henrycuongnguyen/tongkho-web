import type { Property, TransactionType } from "@/types/property";

// Base URL for uploaded images
const UPLOADS_BASE_URL = "https://quanly.tongkhobds.com";

// ES transaction type mapping: 1=sale, 2=rent
const TRANSACTION_TYPE_MAP: Record<TransactionType, number> = {
  sale: 1,
  rent: 2,
};

// ES property type ID to string mapping
const PROPERTY_TYPE_MAP: Record<number, Property["type"]> = {
  14: "house", // Nhà nguyên căn
  46: "land", // Đất nền
  1: "apartment",
  2: "villa",
  3: "office",
  4: "shophouse",
  5: "warehouse",
};

interface ESSource {
  id: number;
  title: string;
  slug: string;
  property_type_id: number;
  transaction_type: number;
  price: number;
  price_description: string;
  area: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  street_address: string;
  district: string;
  city: string;
  images: string; // JSON string
  main_image: string;
  created_on: string;
  created_time: string;
  is_featured: boolean;
  is_verified: boolean;
}

interface ESHit {
  _id: string;
  _source: ESSource;
}

interface ESSearchResponse {
  hits: {
    total: { value: number };
    hits: ESHit[];
  };
}

export class ElasticsearchPropertyService {
  private baseUrl: string;
  private index: string;
  private apiKey: string;

  constructor() {
    // Use import.meta.env (dev) with process.env fallback (production)
    this.baseUrl = import.meta.env.ES_URL || process.env.ES_URL || "";
    this.index = import.meta.env.ES_INDEX || process.env.ES_INDEX || "real_estate";
    this.apiKey = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || "";
  }

  async searchProperties(
    transactionType: TransactionType,
    limit: number = 4
  ): Promise<Property[]> {
    if (!this.apiKey || !this.baseUrl) {
      throw new Error("[ES] Missing ES_URL or ES_API_KEY environment variables");
    }

    const esTransactionType = TRANSACTION_TYPE_MAP[transactionType];

    const response = await fetch(`${this.baseUrl}/${this.index}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `ApiKey ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: {
          bool: {
            must: [{ term: { transaction_type: esTransactionType } }],
          },
        },
        sort: [{ created_on: "desc" }],
        size: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`[ES] Search failed: ${response.status} ${response.statusText}`);
    }

    const data: ESSearchResponse = await response.json();
    return data.hits.hits.map((hit) => this.mapToProperty(hit));
  }

  private mapToProperty(hit: ESHit): Property {
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
    const transactionType: TransactionType =
      src.transaction_type === 1 ? "sale" : "rent";

    // Parse price and unit from price_description (e.g., "7.3 tỷ", "300 triệu")
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
   * Parse price value and unit from price_description (e.g., "7.3 tỷ", "300 triệu")
   * Returns the numeric value and appropriate unit for display
   * Special cases: "Thỏa thuận", "Liên hệ", empty → returns price=-1 as signal
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
