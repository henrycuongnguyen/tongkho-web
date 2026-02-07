/**
 * Location types for provinces, districts, wards
 */

// Province data
export interface Province {
  id: number;
  nId: string;          // n_id in DB
  name: string;         // "Hà Nội"
  slug: string;         // "ha-noi"
  districtCount: number;
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
}
