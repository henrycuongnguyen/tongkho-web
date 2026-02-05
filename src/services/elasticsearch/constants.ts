/**
 * Elasticsearch Constants
 *
 * Centralized configuration for Elasticsearch indices and mappings
 */

import type { Property, TransactionType } from "@/types/property";

// Base URL for uploaded images
export const UPLOADS_BASE_URL = "https://quanly.tongkhobds.com";

/**
 * Elasticsearch Index Names
 * These are hardcoded as stable schema contracts
 * Only ES_URL and ES_API_KEY change per environment
 */
export const ES_INDICES = {
  PROPERTIES: "real_estate",    // Property listings
  PROJECTS: "project",           // Real estate projects
  LOCATIONS: "locations",        // Location data
  SEO_META: "seo_meta_data",     // SEO metadata
} as const;

/**
 * Transaction type mapping for Elasticsearch
 * 1 = sale, 2 = rent
 */
export const TRANSACTION_TYPE_MAP: Record<TransactionType, number> = {
  sale: 1,
  rent: 2,
};

/**
 * Property type ID to string mapping
 * Maps Elasticsearch property_type_id to Property type
 */
export const PROPERTY_TYPE_MAP: Record<number, Property["type"]> = {
  14: "house",      // Nhà nguyên căn
  46: "land",       // Đất nền
  1: "apartment",
  2: "villa",
  3: "office",
  4: "shophouse",
  5: "warehouse",
};

/**
 * Elasticsearch response interfaces
 */
export interface ESSource {
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

export interface ESHit<T = ESSource> {
  _id: string;
  _index?: string;
  _source: T;
}

export interface ESSearchResponse<T = ESSource> {
  hits: {
    total: { value: number };
    hits: ESHit<T>[];
  };
}
