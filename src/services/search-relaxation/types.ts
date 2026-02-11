import type { PropertySearchFilters } from '@/services/elasticsearch/types';

/**
 * Filter priority levels for relaxation strategy
 * Lower priority = removed first
 */
export enum FilterPriority {
  TRANSACTION = 1,    // Never remove
  LOCATION = 2,       // Keep in Level 1
  PROPERTY_TYPE = 3,  // Remove last
  ROOMS = 4,          // Remove in Level 1
  AREA = 5,           // Remove in Level 1
  PRICE = 6           // Remove first
}

/**
 * Represents a single level of filter relaxation
 */
export interface RelaxationLevel {
  /** Relaxation level (1=keep location, 2=expand to city, 3=nationwide) */
  level: 1 | 2 | 3;

  /** User-friendly description of what was relaxed */
  description: string;

  /** List of filter names that were removed */
  removedFilters: string[];

  /** Location expansion info (for Level 2 and 3) */
  expandedLocation?: {
    from: string;  // "Ba Dinh"
    to: string;    // "Ha Noi"
  };

  /** Relaxed search parameters to execute */
  relaxedParams: PropertySearchFilters;
}

/**
 * Context about current location for expansion logic
 */
export interface LocationContext {
  currentProvince?: {
    nId: string;
    slug: string;
    name: string;
  };
  currentDistrict?: {
    nId: string;
    slug: string;
    name: string;
    provinceNId: string;
  };
  currentWard?: {
    nId: string;
    slug: string;
    name: string;
    districtNId: string;
  };
}

/**
 * Result of a successful fallback search
 */
export interface RelaxationResult {
  success: boolean;
  level: number;
  hits: any[]; // PropertySearchHit[]
  metadata: RelaxationLevel;
}
