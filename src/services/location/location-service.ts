/**
 * Location Service
 * Load provinces/districts from database
 */

import { db } from '@/db';
import { locations, locationsWithCountProperty } from '@/db/schema';
import { eq, and, ne, sql, isNull } from 'drizzle-orm';
import type { Province, District, LocationHierarchy } from './types';

// In-memory cache for build-time optimization
let cachedHierarchy: LocationHierarchy | null = null;

/**
 * Get all provinces from locations_with_count_property table
 * V1-compatible: includes property counts, images, and optimized for performance
 * @param limit - Number of provinces to return (default: all)
 * @param useNewAddresses - true for modern addresses (default), false for legacy
 */
export async function getAllProvincesWithCount(limit?: number, useNewAddresses = true): Promise<Province[]> {
  try {
    // Query from materialized aggregate table for performance
    // V1 logic: query all rows (id > 0), only filter mergedintoid if useNewAddresses=true
    let query = db
      .select({
        id: locationsWithCountProperty.id,
        cityId: locationsWithCountProperty.cityId,
        title: locationsWithCountProperty.title,
        slug: locationsWithCountProperty.slug,
        propertyCount: locationsWithCountProperty.propertyCount,
        cityImage: locationsWithCountProperty.cityImage,
        cityImageWeb: locationsWithCountProperty.cityImageWeb,
        cityLatlng: locationsWithCountProperty.cityLatlng,
        displayOrder: locationsWithCountProperty.displayOrder,
        mergedintoid: locationsWithCountProperty.mergedintoid,
      })
      .from(locationsWithCountProperty) as any;

    // V1 logic: only filter by mergedintoid if grant='2' (new addresses)
    if (useNewAddresses) {
      query = query.where(isNull(locationsWithCountProperty.mergedintoid));
    }

    // Order by display_order (V1 uses this for featured cities)
    query = query.orderBy(locationsWithCountProperty.displayOrder);

    // Apply limit if specified
    const rows = limit ? await query.limit(limit) : await query;

    // Transform to Province type
    const provinces: Province[] = (rows as any[]).map((row: any) => ({
      id: row.id,
      nId: row.cityId || '',
      name: row.title || '',
      slug: row.slug || '',
      districtCount: 0, // Not needed when using propertyCount
      propertyCount: row.propertyCount || 0,
      cityImage: row.cityImage || undefined,
      cityImageWeb: row.cityImageWeb || undefined,
      cityLatlng: row.cityLatlng || undefined,
      displayOrder: row.displayOrder || undefined,
    }));

    return provinces;

  } catch (error) {
    console.error('[LocationService] Failed to load provinces with count:', error);
    console.error(error);
    return [];
  }
}

/**
 * Get all provinces from database (legacy function)
 * @param useNewAddresses - true for modern addresses (default), false for legacy
 * @deprecated Use getAllProvincesWithCount for better performance
 */
export async function getAllProvinces(useNewAddresses = true): Promise<Province[]> {
  try {
    // Query provinces (n_level = 'TinhThanh' not '0')
    const rows = await db
      .select({
        id: locations.id,
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        mergedintoid: locations.mergedintoid,
      })
      .from(locations)
      .where(
        and(
          eq(locations.nLevel, 'TinhThanh'), // Changed from '0' to 'TinhThanh'
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      )
      .orderBy(locations.displayOrder, locations.nName);

    // Filter based on address type
    const filteredRows = useNewAddresses
      ? rows.filter(r => !r.mergedintoid) // New addresses have no mergedintoid
      : rows.filter(r => r.mergedintoid); // Old addresses have mergedintoid

    // Count districts for each province
    const provincesWithCount = await Promise.all(
      filteredRows.map(async (province) => {
        const districtCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(locations)
          .where(
            and(
              eq(locations.nParentid, province.nId!),
              eq(locations.nLevel, 'QuanHuyen'), // Changed from '1' to 'QuanHuyen'
              ne(locations.nStatus, '6'),
              eq(locations.aactive, true)
            )
          );

        return {
          id: province.id,
          nId: province.nId || '',
          name: province.name || '',
          slug: province.slug || '',
          districtCount: Number(districtCount[0]?.count || 0)
        };
      })
    );

    return provincesWithCount;

  } catch (error) {
    console.error('[LocationService] Failed to load provinces:', error);
    return [];
  }
}

/**
 * Get districts by province nIds
 */
export async function getDistrictsByProvinces(
  provinceNIds: string[]
): Promise<Record<string, District[]>> {
  if (provinceNIds.length === 0) return {};

  try {
    const rows = await db
      .select({
        id: locations.id,
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        provinceId: locations.nParentid,
      })
      .from(locations)
      .where(
        and(
          sql`${locations.nParentid} IN ${provinceNIds}`,
          eq(locations.nLevel, 'QuanHuyen'),
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      )
      .orderBy(locations.displayOrder, locations.nName);

    // Group by province
    const grouped: Record<string, District[]> = {};
    for (const row of rows) {
      const provinceId = row.provinceId || '';
      if (!grouped[provinceId]) {
        grouped[provinceId] = [];
      }
      grouped[provinceId].push({
        id: row.id,
        nId: row.nId || '',
        name: row.name || '',
        slug: row.slug || '',
        provinceId
      });
    }

    return grouped;

  } catch (error) {
    console.error('[LocationService] Failed to load districts:', error);
    return {};
  }
}

/**
 * Get districts by province nId with property counts (V1-compatible)
 * Queries from locations table and gets counts from aggregate table
 */
export async function getDistrictsByProvinceNId(
  provinceNId: string,
  limit?: number
): Promise<District[]> {
  try {
    // Get districts with searchCount from locations table (V1-compatible)
    let query = db
      .select({
        id: locations.id,
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        slugV1: locations.nSlugV1,
        provinceId: locations.nParentid,
        searchCount: locations.searchCount, // Use searchCount as property count
      })
      .from(locations)
      .where(
        and(
          eq(locations.nParentid, provinceNId),
          eq(locations.nLevel, 'QuanHuyen'),
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      )
      .orderBy(locations.displayOrder, locations.nName);

    // Apply limit if specified
    const rows = limit ? await query.limit(limit) : await query;

    // Map to District type with searchCount as propertyCount
    return rows.map(row => ({
      id: row.id,
      nId: row.nId || '',
      name: row.name || '',
      slug: row.slug || row.slugV1 || '', // Prefer modern slug, fallback to V1
      provinceId: provinceNId,
      propertyCount: Number(row.searchCount) || 0 // Use searchCount field
    }));

  } catch (error) {
    console.error('[LocationService] Failed to load districts by province nId:', error);
    return [];
  }
}

/**
 * Build complete location hierarchy (for build-time generation)
 * Uses V1-compatible table for better performance
 */
export async function buildLocationHierarchy(): Promise<LocationHierarchy> {
  // Return cached if available
  if (cachedHierarchy) {
    return cachedHierarchy;
  }

  // Use V1-compatible function with property counts and images
  const provinces = await getAllProvincesWithCount(undefined, true);
  const provinceNIds = provinces.map(p => p.nId);
  const districtsByProvince = await getDistrictsByProvinces(provinceNIds);

  cachedHierarchy = {
    provinces,
    districtsByProvince
  };

  return cachedHierarchy;
}

/**
 * Get province by slug
 */
export async function getProvinceBySlug(slug: string): Promise<Province | null> {
  try {
    const rows = await db
      .select({
        id: locations.id,
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        slugV1: locations.nSlugV1,
      })
      .from(locations)
      .where(
        and(
          sql`(${locations.nSlug} = ${slug} OR ${locations.nSlugV1} = ${slug})`,
          eq(locations.nLevel, 'TinhThanh'),
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      )
      .limit(1);

    if (!rows[0]) return null;

    // Count districts
    const districtCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(locations)
      .where(
        and(
          eq(locations.nParentid, rows[0].nId!),
          eq(locations.nLevel, 'QuanHuyen'),
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      );

    return {
      id: rows[0].id,
      nId: rows[0].nId || '',
      name: rows[0].name || '',
      slug: rows[0].slug || '',
      districtCount: Number(districtCount[0]?.count || 0)
    };

  } catch (error) {
    console.error('[LocationService] Failed to get province:', error);
    return null;
  }
}

/**
 * Get district by slug (requires province context)
 */
export async function getDistrictBySlug(
  provinceNId: string,
  districtSlug: string
): Promise<District | null> {
  try {
    const rows = await db
      .select({
        id: locations.id,
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        slugV1: locations.nSlugV1,
        provinceId: locations.nParentid,
      })
      .from(locations)
      .where(
        and(
          sql`(${locations.nSlug} = ${districtSlug} OR ${locations.nSlugV1} = ${districtSlug})`,
          eq(locations.nParentid, provinceNId),
          eq(locations.nLevel, 'QuanHuyen'),
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      )
      .limit(1);

    if (!rows[0]) return null;

    return {
      id: rows[0].id,
      nId: rows[0].nId || '',
      name: rows[0].name || '',
      slug: rows[0].slug || '',
      provinceId: rows[0].provinceId || ''
    };

  } catch (error) {
    console.error('[LocationService] Failed to get district:', error);
    return null;
  }
}

/**
 * Batch resolve location slugs to nIds and metadata (v1 multi-location support)
 * Resolves both provinces and districts in one query
 */
export async function resolveLocationSlugs(
  slugs: string[]
): Promise<Array<{
  nId: string;
  name: string;
  slug: string;
  type: 'province' | 'district';
  provinceId?: string; // For districts only
  lat?: number;        // For radius search
  lon?: number;        // For radius search
}>> {
  if (slugs.length === 0) return [];


  try {
    const rows = await db
      .select({
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        slugV1: locations.nSlugV1,
        level: locations.nLevel,
        provinceId: locations.nParentid,
        aactive: locations.aactive,
        nStatus: locations.nStatus,
        nLatlng: locations.nLatlng,
      })
      .from(locations)
      .where(
        and(
          sql`(${locations.nSlug} IN (${sql.join(slugs.map(s => sql`${s}`), sql`, `)}) OR ${locations.nSlugV1} IN (${sql.join(slugs.map(s => sql`${s}`), sql`, `)}))`,
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      );

    return rows.map(row => {
      // Determine which slug matched (prefer V1 slug for backward compatibility)
      const matchedSlug = slugs.find(s => s === row.slugV1 || s === row.slug) || row.slug || '';

      // Parse lat/lon from nLatlng string (format: "lat,lng")
      let lat: number | undefined;
      let lon: number | undefined;
      if (row.nLatlng) {
        const parts = row.nLatlng.split(',');
        if (parts.length === 2) {
          const parsedLat = parseFloat(parts[0].trim());
          const parsedLon = parseFloat(parts[1].trim());
          if (!isNaN(parsedLat) && !isNaN(parsedLon)) {
            lat = parsedLat;
            lon = parsedLon;
          }
        }
      }

      return {
        nId: row.nId || '',
        name: row.name || '',
        slug: matchedSlug,
        type: row.level === 'TinhThanh' ? 'province' : 'district',
        ...(row.level === 'QuanHuyen' && { provinceId: row.provinceId || '' }),
        ...(lat !== undefined && { lat }),
        ...(lon !== undefined && { lon })
      };
    });

  } catch (error) {
    console.error('[LocationService] Failed to resolve location slugs:', error);
    console.error(error);
    return [];
  }
}

/**
 * Get districts by province slug with property counts
 * Queries locations_with_count_property for performance
 * @param provinceSlug - Province slug to get districts for
 * @param limit - Number of districts to return (default: all)
 * @param useNewAddresses - true for modern addresses (default), false for legacy
 */
export async function getDistrictsByProvinceSlugWithCount(
  provinceSlug: string,
  limit?: number,
  useNewAddresses = true
): Promise<District[]> {
  try {
    // First, get the province to find its cityId
    const province = await getProvinceBySlug(provinceSlug);
    if (!province) {
      console.warn(`[LocationService] Province not found: ${provinceSlug}`);
      return [];
    }


    // Query districts from locations_with_count_property
    // Build all filter conditions
    const conditions = [
      eq(locationsWithCountProperty.cityId, province.nId),
      ne(locationsWithCountProperty.districtId, ''), // Has district
      isNull(locationsWithCountProperty.wardId), // No ward (district level)
    ];

    // Add mergedintoid filter if needed
    if (useNewAddresses) {
      conditions.push(isNull(locationsWithCountProperty.mergedintoid));
    }


    // Build query with all conditions combined
    const query = db
      .select({
        id: locationsWithCountProperty.id,
        districtId: locationsWithCountProperty.districtId,
        title: locationsWithCountProperty.title,
        slug: locationsWithCountProperty.slug,
        propertyCount: locationsWithCountProperty.propertyCount,
        displayOrder: locationsWithCountProperty.displayOrder,
        mergedintoid: locationsWithCountProperty.mergedintoid,
      })
      .from(locationsWithCountProperty)
      .where(and(...conditions))
      .orderBy(locationsWithCountProperty.displayOrder);

    // Apply limit if specified
    const rows = limit ? await query.limit(limit) : await query;

    // Transform to District type
    const districts: District[] = (rows as any[]).map((row: any) => ({
      id: row.id,
      nId: row.districtId || '',
      name: row.title || '',
      slug: row.slug || '',
      provinceId: province.nId,
      propertyCount: row.propertyCount || 0,
    }));

    return districts;

  } catch (error) {
    console.error('[LocationService] Failed to load districts with count:', error);
    return [];
  }
}

/**
 * Get wards by district slug with property counts
 * Queries locations_with_count_property for performance
 * @param districtSlug - District slug to get wards for
 * @param limit - Number of wards to return (default: all)
 * @param useNewAddresses - true for modern addresses (default), false for legacy
 */
export async function getWardsByDistrictSlugWithCount(
  districtSlug: string,
  limit?: number,
  useNewAddresses = true
): Promise<Array<{
  id: number;
  nId: string;
  name: string;
  slug: string;
  districtId: string;
  propertyCount?: number;
}>> {
  try {
    // First, resolve the district to get its districtId
    const resolved = await resolveLocationSlugs([districtSlug]);
    const district = resolved.find(r => r.type === 'district');

    if (!district) {
      console.warn(`[LocationService] District not found: ${districtSlug}`);
      return [];
    }

    // Query wards from locations_with_count_property

    // Build all filter conditions
    const conditions = [
      eq(locationsWithCountProperty.districtId, district.nId),
      ne(locationsWithCountProperty.wardId, ''), // Has ward
    ];

    // Add mergedintoid filter if needed
    if (useNewAddresses) {
      conditions.push(isNull(locationsWithCountProperty.mergedintoid));
    }

    // Build query with all conditions combined
    const query = db
      .select({
        id: locationsWithCountProperty.id,
        wardId: locationsWithCountProperty.wardId,
        title: locationsWithCountProperty.title,
        slug: locationsWithCountProperty.slug,
        districtId: locationsWithCountProperty.districtId,
        propertyCount: locationsWithCountProperty.propertyCount,
        displayOrder: locationsWithCountProperty.displayOrder,
        mergedintoid: locationsWithCountProperty.mergedintoid,
      })
      .from(locationsWithCountProperty)
      .where(and(...conditions))
      .orderBy(locationsWithCountProperty.displayOrder);

    // Apply limit if specified
    const rows = limit ? await query.limit(limit) : await query;
    // Transform to Ward type
    const wards = (rows as any[]).map((row: any) => ({
      id: row.id,
      nId: row.wardId || '',
      name: row.title || '',
      slug: row.slug || '',
      districtId: row.districtId || '',
      propertyCount: row.propertyCount || 0,
    }));

    return wards;

  } catch (error) {
    console.error('[LocationService] Failed to load wards with count:', error);
    return [];
  }
}

/**
 * Clear location cache (for testing)
 */
export function clearLocationCache(): void {
  cachedHierarchy = null;
}
