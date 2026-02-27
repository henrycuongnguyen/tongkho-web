// Property types for real estate listings

export interface Property {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  propertyTypeId?: number;
  transactionType: TransactionType;
  price: number;
  priceUnit: PriceUnit;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  address: string;
  district: string;
  city: string;
  wardId?: string;
  districtId?: string;
  cityId?: string;
  description: string;
  images: string[];
  thumbnail: string;
  features: string[];
  createdAt: string;
  isFeatured: boolean;
  isHot: boolean;
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
