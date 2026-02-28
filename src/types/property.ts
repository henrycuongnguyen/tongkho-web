// Property types for real estate listings

export interface Property {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  propertyTypeId?: number;
  propertyTypeName?: string;
  transactionType: TransactionType;
  price: number;
  priceUnit: PriceUnit;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  yearBuilt?: string;
  address: string;
  ward?: string;
  district: string;
  city: string;
  wardId?: string;
  districtId?: string;
  cityId?: string;
  lat?: number;
  lng?: number;
  description: string;
  htmlContent?: string;
  images: string[];
  thumbnail: string;
  features: string[];
  videoUrl?: string;
  legalDocuments?: LegalDocument[];
  priceHistory?: string;
  createdAt: string;
  isFeatured: boolean;
  isHot: boolean;
  realEstateCode?: string;
}

export interface LegalDocument {
  url: string;
  title: string;
  type: 'pdf' | 'doc' | 'other';
}

export type PropertyType =
  | "apartment"
  | "house"
  | "villa"
  | "land"
  | "office"
  | "shophouse"
  | "warehouse";

export type TransactionType = "sale" | "rent";

export type PriceUnit = "VND" | "billion" | "million" | "per_month";

export interface Project {
  id: string;
  name: string;
  slug: string;
  developer: string;
  location: string;
  city: string;
  status: ProjectStatus;
  totalUnits: number;
  priceRange: string;
  area: string;
  description: string;
  images: string[];
  thumbnail: string;
  amenities: string[];
  completionDate?: string;
  towers?: number;
  isFeatured: boolean;
}

export type ProjectStatus = "upcoming" | "selling" | "sold_out" | "completed";

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  thumbnail: string;
  category: NewsCategory;
  author: string;
  publishedAt: string;
  views: number;
}

export type NewsCategory =
  | "market"
  | "policy"
  | "tips"
  | "project_news"
  | "investment";

export interface Location {
  id: string;
  name: string;
  slug: string;
  image: string;
  propertyCount: number;
}

export interface SearchFilters {
  transactionType: TransactionType;
  city?: string;
  keyword?: string;
  propertyType?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
}
