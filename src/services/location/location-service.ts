/**
 * Location Service
 * Load provinces/districts from database
 */

import { db } from '@/db';
import { locations } from '@/db/schema';
import { eq, and, ne, isNotNull, sql } from 'drizzle-orm';
import type { Province, District, LocationHierarchy } from './types';

// In-memory cache for build-time optimization
let cachedHierarchy: LocationHierarchy | null = null;

/**
 * Get all provinces from database
 * @param useNewAddresses - true for modern addresses (default), false for legacy
 */
export async function getAllProvinces(useNewAddresses = true): Promise<Province[]> {
  try {
    // Query provinces (n_level = '0')
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
          eq(locations.nLevel, '0'),
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
              eq(locations.nLevel, '1'),
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
          eq(locations.nLevel, '1'),
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
 * Build complete location hierarchy (for build-time generation)
 */
export async function buildLocationHierarchy(): Promise<LocationHierarchy> {
  // Return cached if available
  if (cachedHierarchy) {
    return cachedHierarchy;
  }

  const provinces = await getAllProvinces(true);
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
      })
      .from(locations)
      .where(
        and(
          eq(locations.nSlug, slug),
          eq(locations.nLevel, '0'),
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
          eq(locations.nLevel, '1'),
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
        provinceId: locations.nParentid,
      })
      .from(locations)
      .where(
        and(
          eq(locations.nSlug, districtSlug),
          eq(locations.nParentid, provinceNId),
          eq(locations.nLevel, '1'),
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
}>> {
  if (slugs.length === 0) return [];

  try {
    const rows = await db
      .select({
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        level: locations.nLevel,
        provinceId: locations.nParentid,
      })
      .from(locations)
      .where(
        and(
          sql`${locations.nSlug} IN (${sql.join(slugs.map(s => sql`${s}`), sql`, `)})`,
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      );

    return rows.map(row => ({
      nId: row.nId || '',
      name: row.name || '',
      slug: row.slug || '',
      type: row.level === '0' ? 'province' : 'district',
      ...(row.level === '1' && { provinceId: row.provinceId || '' })
    }));

  } catch (error) {
    console.error('[LocationService] Failed to resolve location slugs:', error);
    return [];
  }
}

/**
 * Clear location cache (for testing)
 */
export function clearLocationCache(): void {
  cachedHierarchy = null;
}
