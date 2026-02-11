import type { PropertySearchFilters } from '@/services/elasticsearch/types';
import type { RelaxationLevel, LocationContext } from './types';

/**
 * Service for intelligently relaxing search filters when zero results found
 * Implements v1's 3-tier fallback strategy
 */
export class FilterRelaxationService {
  /**
   * Level 1: Keep location and transaction, remove specific filters
   * Removes: price, area, bedrooms, bathrooms, property_types
   *
   * This is the first fallback - users care more about location than specs
   */
  relaxLevel1(filters: PropertySearchFilters): RelaxationLevel {
    const relaxedParams: PropertySearchFilters = {
      transactionType: filters.transactionType, // Keep
      provinceIds: filters.provinceIds,         // Keep
      districtIds: filters.districtIds,         // Keep
      wardIds: filters.wardIds,                 // Keep
      // Remove all specific filters below
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyTypes: undefined,
    };

    const removedFilters: string[] = [];
    if (filters.minPrice || filters.maxPrice) removedFilters.push('price');
    if (filters.minArea || filters.maxArea) removedFilters.push('area');
    if (filters.bedrooms) removedFilters.push('bedrooms');
    if (filters.bathrooms) removedFilters.push('bathrooms');
    if (filters.propertyTypes?.length) removedFilters.push('property_types');

    return {
      level: 1,
      description: 'Đã bỏ các bộ lọc về giá, diện tích, và phòng',
      removedFilters,
      relaxedParams,
    };
  }

  /**
   * Level 2: Expand district/ward to city level, remove all filters
   * Example: "Ba Dinh" → "Ha Noi"
   *
   * Used when Level 1 still yields zero results
   */
  relaxLevel2(
    filters: PropertySearchFilters,
    locationContext: LocationContext
  ): RelaxationLevel {
    const relaxedParams: PropertySearchFilters = {
      transactionType: filters.transactionType,
      // Expand to city level
      provinceIds: locationContext.currentProvince
        ? [locationContext.currentProvince.nId]
        : filters.provinceIds,
      districtIds: undefined,  // Remove district specificity
      wardIds: undefined,      // Remove ward specificity
      // Remove all filters
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyTypes: undefined,
    };

    const expandedLocation = locationContext.currentDistrict
      ? {
          from: locationContext.currentDistrict.name,
          to: locationContext.currentProvince?.name || 'Thành phố',
        }
      : locationContext.currentWard
      ? {
          from: locationContext.currentWard.name,
          to: locationContext.currentProvince?.name || 'Thành phố',
        }
      : undefined;

    return {
      level: 2,
      description: `Đã mở rộng tìm kiếm sang ${expandedLocation?.to || 'khu vực lân cận'}`,
      removedFilters: ['price', 'area', 'rooms', 'property_types', 'district', 'ward'],
      expandedLocation,
      relaxedParams,
    };
  }

  /**
   * Level 3: Remove all location filters, keep only transaction type
   * Example: "Ha Noi" → "Toàn quốc"
   *
   * Last resort fallback - show anything matching transaction type
   */
  relaxLevel3(filters: PropertySearchFilters): RelaxationLevel {
    const relaxedParams: PropertySearchFilters = {
      transactionType: filters.transactionType,
      // Remove all location filters
      provinceIds: undefined,
      districtIds: undefined,
      wardIds: undefined,
      // Remove all specific filters
      minPrice: undefined,
      maxPrice: undefined,
      minArea: undefined,
      maxArea: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      propertyTypes: undefined,
    };

    return {
      level: 3,
      description: 'Đã mở rộng tìm kiếm ra toàn quốc',
      removedFilters: ['location', 'price', 'area', 'rooms', 'property_types'],
      expandedLocation: {
        from: 'Khu vực đã chọn',
        to: 'Toàn quốc',
      },
      relaxedParams,
    };
  }

  /**
   * Check if Level 1 relaxation is possible
   * Returns true if filters has any removable criteria
   */
  canRelax(filters: PropertySearchFilters, level: 1 | 2 | 3): boolean {
    switch (level) {
      case 1:
        // Can relax if has any removable filters
        return !!(
          filters.minPrice ||
          filters.maxPrice ||
          filters.minArea ||
          filters.maxArea ||
          filters.bedrooms ||
          filters.bathrooms ||
          filters.propertyTypes?.length
        );
      case 2:
      case 3:
        // Use specific methods for L2/L3
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if Level 2 relaxation is possible
   * Can only expand if currently at district/ward level
   */
  canRelaxLevel2(
    filters: PropertySearchFilters,
    locationContext: LocationContext
  ): boolean {
    return !!(
      locationContext.currentDistrict ||
      locationContext.currentWard
    );
  }

  /**
   * Check if Level 3 relaxation is possible
   * Can expand to nationwide if has any location filter
   */
  canRelaxLevel3(filters: PropertySearchFilters): boolean {
    return !!(
      filters.provinceIds?.length ||
      filters.districtIds?.length ||
      filters.wardIds?.length
    );
  }
}

// Export singleton instance
export const filterRelaxationService = new FilterRelaxationService();
