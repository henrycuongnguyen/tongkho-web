/**
 * ElasticSearch types for property search
 * Used by listing page with complex filters
 */

// Search filters from URL/user input
export interface PropertySearchFilters {
  transactionType: number;          // 1=mua bán, 2=cho thuê, 3=dự án
  propertyTypes?: number[];         // [12, 13, 14]
  provinceIds?: number[];           // [1, 2]
  districtIds?: number[];           // [10, 11, 12]
  minPrice?: number;                // VND
  maxPrice?: number;                // VND
  minArea?: number;                 // m²
  maxArea?: number;                 // m²
  bedrooms?: number;                // 1-5+
  bathrooms?: number;               // 1-5+
  radius?: number;                  // km (5, 10, 50, 100)
  centerLat?: number;               // For radius search
  centerLon?: number;               // For radius search
  sort?: SortOption;
  page?: number;                    // Pagination (1-based)
  pageSize?: number;                // Items per page (default 20)
  keyword?: string;                 // Text search
}

export type SortOption =
  | 'newest'
  | 'oldest'
  | 'price_asc'
  | 'price_desc'
  | 'area_asc'
  | 'area_desc';

// ES search result wrapper
export interface ElasticSearchResult<T> {
  total: number;
  hits: T[];
  took: number;                     // Query time (ms)
  aggregations?: Record<string, unknown>;
}

// Property document from ES index
export interface PropertyDocument {
  id: number;
  title: string;
  slug: string;
  transaction_type: number;
  property_type_id: number;
  property_type_name?: string;
  price: number;
  price_description?: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  street_address?: string;
  address?: string;
  district?: string;
  district_name?: string;
  city?: string;
  city_name?: string;
  province_id?: number;
  district_id?: number;
  main_image?: string;
  thumbnail?: string;
  images?: string;
  created_on: string;
  created_time?: string;
  updated_on?: string;
  location?: {
    lat: number;
    lon: number;
  };
  is_verified?: boolean;
  is_featured?: boolean;
  source_post?: string;
}

// ES query structure
export interface ESQuery {
  query: {
    bool: {
      must: unknown[];
      filter?: unknown[];
      should?: unknown[];
      must_not?: unknown[];
    };
  };
  from: number;
  size: number;
  sort: unknown[];
  _source: string[];
}

// ES response types
export interface ESHit<T> {
  _id: string;
  _source: T;
  _score?: number;
}

export interface ESSearchResponse<T> {
  took: number;
  hits: {
    total: { value: number } | number;
    hits: ESHit<T>[];
  };
  aggregations?: Record<string, unknown>;
}

// Location search result (for autocomplete)
export interface LocationSearchResult {
  id: string;
  type: 'province' | 'district' | 'ward' | 'project';
  name: string;           // "Hà Nội" or "Vinhomes Central Park"
  fullName: string;       // "Phường Tân Kiểng, Quận 7, TP. HCM"
  slug: string;
  level?: number;         // 0=Province, 1=District, 2=Ward
  provinceId?: string;
  districtId?: string;
}
