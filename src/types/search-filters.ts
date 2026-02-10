/**
 * Search filter types for URL building
 * Matches v1 search-url-builder.js interface
 */

export interface SearchFilters {
  /** Transaction type: 1=buy, 2=rent, 3=project */
  transaction_type?: string;
  /** Comma-separated property type IDs (e.g., "12,13,14") */
  property_types?: string;
  /** Comma-separated location slugs */
  selected_addresses?: string;
  /** Minimum price (VND or empty string) */
  min_price?: string | number;
  /** Maximum price (VND or empty string) */
  max_price?: string | number;
  /** Minimum area (m²) */
  min_area?: string | number;
  /** Maximum area (m²) */
  max_area?: string | number;
  /** Search radius (km) */
  radius?: string | number;
  /** Number of bathrooms */
  bathrooms?: string | number;
  /** Number of bedrooms */
  bedrooms?: string | number;
  /** Sort order */
  sort?: string;
  /** Street name filter */
  street_name?: string;
  /** Verified properties only */
  is_verified?: string | boolean;
}

/**
 * Property type slug mapping
 * Key: property type ID
 * Value: URL slug
 */
export interface PropertyTypeSlugMap {
  [typeId: string]: string;
}
