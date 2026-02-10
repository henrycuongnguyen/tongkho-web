/**
 * Location types for provinces, districts, wards
 */

// Province data (extended with V1 fields from locations_with_count_property)
export interface Province {
  id: number;
  nId: string;          // n_id in DB (city_id in locations_with_count_property)
  name: string;         // "Hà Nội"
  slug: string;         // "ha-noi"
  districtCount: number;
  propertyCount?: number;       // From locations_with_count_property
  cityImage?: string;           // From locations_with_count_property
  cityImageWeb?: string;        // From locations_with_count_property
  cityLatlng?: string;          // From locations_with_count_property
  displayOrder?: number;        // From locations_with_count_property
}

// District data
export interface District {
  id: number;
  nId: string;
  name: string;         // "Ba Đình"
  slug: string;         // "ba-dinh"
  provinceId: string;   // n_parentid -> province's n_id
  provinceName?: string;
}

// Hierarchical structure for client-side
export interface LocationHierarchy {
  provinces: Province[];
  districtsByProvince: Record<string, District[]>; // keyed by province nId
}

// For client-side multi-select state
export interface SelectedLocation {
  id: number;
  nId: string;
  type: 'province' | 'district';
  name: string;
  slug: string;
  parentId?: string;    // For districts - parent province nId
  provinceId?: string;  // Province nId (for districts)
  lat?: number;         // Latitude (for radius search)
  lon?: number;         // Longitude (for radius search)
}
