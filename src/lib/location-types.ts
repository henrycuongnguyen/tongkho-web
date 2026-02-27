/**
 * Client-side Location Types
 * Simplified types for static JSON data (no DB fields)
 */

export interface LocationItem {
  nId: string;
  name: string;
  slug: string;
  propertyCount?: number;
  displayOrder?: number;
  cityImage?: string;
  cityImageWeb?: string;
}

export interface DistrictItem extends LocationItem {
  provinceId: string;
}

export interface WardItem extends LocationItem {
  districtId: string;
}

export type AddressVersion = 'new' | 'old';
