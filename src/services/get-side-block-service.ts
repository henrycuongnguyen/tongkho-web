/**
 * Get Side Block Service
 * Generate sidebar filter blocks based on pattern (property_type_slug/location_slug)
 * V1-compatible implementation for v2
 */

import { propertyAggregationService } from './elasticsearch/property-aggregation-service';
import type { AggregationFilters } from './elasticsearch/property-aggregation-service';
import {
  getAllProvincesWithCount,
  getDistrictsByProvinceNId,
  getWardsByDistrictSlugWithCount,
  resolveLocationSlugs
} from './location/location-service';
import { db } from '@/db';
import { propertyType, locations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface SideBlockFilter {
  title: string;
  url: string;
  params?: Record<string, any>;
}

export interface SideBlock {
  title: string;
  filters: SideBlockFilter[];
  total_items: number;
}

export interface GetSideBlockParams {
  pattern?: string | string[];
  id?: number;
}

/**
 * Main entry point: Get side block data
 * @param params - Either pattern (preferred) or property id (backward compatible)
 */
export async function getSideBlock(params: GetSideBlockParams): Promise<SideBlock[]> {
  // Priority: use pattern parameter
  if (params.pattern) {
    return await getSideBlockByPattern(params.pattern);
  }

  // Backward compatible: use id parameter
  if (params.id) {
    return await getSideBlockById(params.id);
  }

  throw new Error('Missing required parameter: pattern or id');
}

/**
 * Get side block by pattern (property_type_slug/location_slug)
 * V1-compatible implementation
 */
async function getSideBlockByPattern(patternRaw: string | string[]): Promise<SideBlock[]> {
  let propertyTypeSlug: string;
  let locationSlug: string | null = null;

  // Parse pattern
  if (typeof patternRaw === 'string') {
    if (patternRaw.includes('/')) {
      const parts = patternRaw.split('/').filter(p => p);
      if (parts.length === 0) {
        throw new Error('Invalid pattern');
      }
      propertyTypeSlug = parts[0];
      locationSlug = parts.length > 1 ? parts[1] : null;
    } else {
      propertyTypeSlug = patternRaw.trim();
    }
  } else if (Array.isArray(patternRaw)) {
    if (patternRaw.length === 0) {
      throw new Error('Invalid pattern');
    }
    propertyTypeSlug = patternRaw[0];
    locationSlug = patternRaw.length > 1 ? patternRaw[1] : null;
  } else {
    throw new Error('Invalid pattern format');
  }

  // Determine transaction_type and property_type_id from slug
  let transactionType: number | null = null;
  let propertyTypeId: number | null = null;
  let propertyTypeVietnamese: string | null = null;

  if (propertyTypeSlug === 'mua-ban') {
    transactionType = 1;
  } else if (propertyTypeSlug === 'cho-thue') {
    transactionType = 2;
  } else {
    // Get property type from database
    const pt = await db
      .select({
        id: propertyType.id,
        transactionType: propertyType.transactionType,
        vietnamese: propertyType.vietnamese,
      })
      .from(propertyType)
      .where(and(
        eq(propertyType.slug, propertyTypeSlug),
        eq(propertyType.aactive, true)
      ))
      .limit(1);

    if (pt.length === 0) {
      throw new Error('Property type not found');
    }

    transactionType = pt[0].transactionType || null;
    propertyTypeId = pt[0].id;
    propertyTypeVietnamese = pt[0].vietnamese;
  }

  // Case 1: No location slug - list all 63 provinces
  if (!locationSlug) {
    // Only support when property_type is specific, not mua-ban/cho-thue alone
    if (propertyTypeSlug === 'mua-ban' || propertyTypeSlug === 'cho-thue') {
      throw new Error('Pattern missing location detail');
    }

    return await generateProvinceBlock(propertyTypeSlug, transactionType, propertyTypeId, propertyTypeVietnamese);
  }

  // Case 2: Has location slug - resolve location
  const resolved = await resolveLocationSlugs([locationSlug]);
  if (resolved.length === 0) {
    throw new Error('Location not found');
  }

  const location = resolved[0];

  // Case 2a: Province level - list districts
  if (location.type === 'province') {
    return await generateDistrictBlock(
      propertyTypeSlug,
      locationSlug,
      location.nId,
      location.name,
      transactionType,
      propertyTypeId,
      propertyTypeVietnamese
    );
  }

  // Case 2b: District level - list wards
  if (location.type === 'district') {
    return await generateWardBlock(
      propertyTypeSlug,
      locationSlug,
      location.nId,
      location.name,
      transactionType,
      propertyTypeId,
      propertyTypeVietnamese
    );
  }

  return [];
}

/**
 * Generate province block (all 63 provinces with property counts)
 */
async function generateProvinceBlock(
  propertyTypeSlug: string,
  transactionType: number | null,
  propertyTypeId: number | null,
  propertyTypeVietnamese: string | null
): Promise<SideBlock[]> {
  try {
    // Build ES filters
    const esFilters: AggregationFilters = {};
    if (transactionType !== null) {
      esFilters.transaction_type = transactionType;
    }
    if (propertyTypeId !== null) {
      esFilters.property_types = propertyTypeId;
    }

    // Get aggregation by city
    const aggResult = await propertyAggregationService.aggregateByCity(esFilters);
    const cityIds = aggResult.buckets.map(b => String(b.key));

    // Get provinces from database
    const provinces = await getAllProvincesWithCount(undefined, true);
    const provinceMap = new Map(provinces.map(p => [p.nId, p]));

    // Build title
    const transactionPrefix = transactionType === 2 ? 'Cho thuê' : 'Mua bán';
    let baseName = propertyTypeVietnamese || 'bất động sản';

    // Strip common prefixes
    const prefixes = ['Bán ', 'Cho thuê '];
    for (const prefix of prefixes) {
      if (baseName.startsWith(prefix)) {
        baseName = baseName.substring(prefix.length);
        break;
      }
    }
    const title = `${transactionPrefix} ${baseName}`;

    // Build filters with counts
    const filters: SideBlockFilter[] = [];
    for (const bucket of aggResult.buckets) {
      const cityId = String(bucket.key);
      const province = provinceMap.get(cityId);

      if (!province) continue;

      const count = bucket.doc_count;
      const countFormat = count.toLocaleString('vi-VN');

      filters.push({
        title: `${province.name} (${countFormat})`,
        url: `/${propertyTypeSlug}/${province.slug}`,
        params: {
          addresses: province.slug,
          ...(propertyTypeId !== null && { property_types: propertyTypeId }),
          ...(transactionType !== null && { transaction_type: transactionType })
        }
      });
    }

    if (filters.length === 0) {
      return [];
    }

    return [{
      title,
      filters,
      total_items: filters.length
    }];

  } catch (error) {
    console.error('[GetSideBlockService] Province block failed:', error);
    throw error;
  }
}

/**
 * Generate district block (districts in a province with property counts)
 */
async function generateDistrictBlock(
  propertyTypeSlug: string,
  provinceSlug: string,
  provinceNId: string,
  provinceName: string,
  transactionType: number | null,
  propertyTypeId: number | null,
  propertyTypeVietnamese: string | null
): Promise<SideBlock[]> {
  try {
    // Build ES filters
    const esFilters: AggregationFilters = {
      city_id: provinceNId
    };
    if (transactionType !== null) {
      esFilters.transaction_type = transactionType;
    }
    if (propertyTypeId !== null) {
      esFilters.property_types = propertyTypeId;
    }

    // Get aggregation by district
    const aggResult = await propertyAggregationService.aggregateByDistrict(esFilters);
    const districtIds = aggResult.buckets.map(b => String(b.key));

    // Get districts from database
    const districts = await getDistrictsByProvinceNId(provinceNId);
    const districtMap = new Map(districts.map(d => [d.nId, d]));

    // Build title
    const transactionPrefix = transactionType === 2 ? 'Cho thuê' : 'Mua bán';
    let baseName = propertyTypeVietnamese || 'bất động sản';

    // Strip common prefixes
    const prefixes = ['Bán ', 'Cho thuê '];
    for (const prefix of prefixes) {
      if (baseName.startsWith(prefix)) {
        baseName = baseName.substring(prefix.length);
        break;
      }
    }
    const title = `${transactionPrefix} ${baseName} tại ${provinceName}`;

    // Build filters with counts
    const filters: SideBlockFilter[] = [];
    for (const bucket of aggResult.buckets) {
      const districtId = String(bucket.key);
      const district = districtMap.get(districtId);

      if (!district) continue;

      const count = bucket.doc_count;
      const countFormat = count.toLocaleString('vi-VN');

      // Add "Quận" prefix for numeric district names
      let districtName = district.name;
      try {
        if (!isNaN(parseInt(districtName))) {
          districtName = `Quận ${districtName}`;
        }
      } catch {}

      filters.push({
        title: `${districtName} (${countFormat})`,
        url: `/${propertyTypeSlug}/${district.slug}`,
        params: {
          addresses: district.slug,
          ...(propertyTypeId !== null && { property_types: propertyTypeId }),
          ...(transactionType !== null && { transaction_type: transactionType })
        }
      });
    }

    if (filters.length === 0) {
      return [];
    }

    return [{
      title,
      filters,
      total_items: filters.length
    }];

  } catch (error) {
    console.error('[GetSideBlockService] District block failed:', error);
    throw error;
  }
}

/**
 * Generate ward block (wards in a district with property counts)
 */
async function generateWardBlock(
  propertyTypeSlug: string,
  districtSlug: string,
  districtNId: string,
  districtName: string,
  transactionType: number | null,
  propertyTypeId: number | null,
  propertyTypeVietnamese: string | null
): Promise<SideBlock[]> {
  try {
    // Build ES filters
    const esFilters: AggregationFilters = {
      district_id: districtNId
    };
    if (transactionType !== null) {
      esFilters.transaction_type = transactionType;
    }
    if (propertyTypeId !== null) {
      esFilters.property_types = propertyTypeId;
    }

    // Get aggregation by ward
    const aggResult = await propertyAggregationService.aggregateByWard(esFilters);
    const wardIds = aggResult.buckets.map(b => String(b.key));

    // Get wards from database
    const wards = await getWardsByDistrictSlugWithCount(districtSlug);
    const wardMap = new Map(wards.map(w => [w.nId, w]));

    // Build title
    const transactionPrefix = transactionType === 2 ? 'Cho thuê' : 'Mua bán';
    let baseName = propertyTypeVietnamese || 'bất động sản';

    // Strip common prefixes
    const prefixes = ['Bán ', 'Cho thuê '];
    for (const prefix of prefixes) {
      if (baseName.startsWith(prefix)) {
        baseName = baseName.substring(prefix.length);
        break;
      }
    }
    const title = `${transactionPrefix} ${baseName} tại ${districtName}`;

    // Build filters with counts
    const filters: SideBlockFilter[] = [];
    for (const bucket of aggResult.buckets) {
      const wardId = String(bucket.key);
      const ward = wardMap.get(wardId);

      if (!ward) continue;

      const count = bucket.doc_count;
      const countFormat = count.toLocaleString('vi-VN');

      // Add "Phường" prefix for numeric ward names
      let wardName = ward.name;
      try {
        if (!isNaN(parseInt(wardName))) {
          wardName = `Phường ${wardName}`;
        }
      } catch {}

      filters.push({
        title: `${wardName} (${countFormat})`,
        url: `/${propertyTypeSlug}/${ward.slug}`,
        params: {
          addresses: ward.slug,
          ...(propertyTypeId !== null && { property_types: propertyTypeId }),
          ...(transactionType !== null && { transaction_type: transactionType })
        }
      });
    }

    if (filters.length === 0) {
      return [];
    }

    return [{
      title,
      filters,
      total_items: filters.length
    }];

  } catch (error) {
    console.error('[GetSideBlockService] Ward block failed:', error);
    throw error;
  }
}

/**
 * Backward compatible: Get side block by property ID
 * This is a fallback for old API calls
 */
async function getSideBlockById(propertyId: number): Promise<SideBlock[]> {
  // TODO: Implement if needed - requires fetching property details first
  // then calling getSideBlockByPattern with derived pattern
  throw new Error('Get side block by ID not yet implemented');
}
