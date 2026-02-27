/**
 * Side Block Filter Service V2
 * Implements v1 get_side_block logic using PostgreSQL
 */

import { db } from '@/db';
import { realEstate, locations, propertyType } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

interface FilterParams {
  transaction_type?: number;
  property_type_id?: number;
  property_types?: string;
  property_type_slug?: string;
  addresses?: string;
  selected_addresses?: string;
}

interface FilterItem {
  title: string;
  params: FilterParams;
}

interface SideBlock {
  title: string;
  filters: FilterItem[];
}

/**
 * Get side block filters for property detail page
 * Based on v1 RealEstateHandle.get_side_block()
 */
export async function getSideBlockFiltersV2(propertyId: string): Promise<SideBlock[]> {
  try {
    // Fetch property from database
    const property = await db
      .select({
        cityId: realEstate.cityId,
        districtId: realEstate.districtId,
        wardId: realEstate.wardId,
        propertyTypeId: realEstate.propertyTypeId,
        transactionType: realEstate.transactionType,
      })
      .from(realEstate)
      .where(
        and(
          eq(realEstate.id, parseInt(propertyId)),
          eq(realEstate.aactive, true)
        )
      )
      .limit(1);

    if (!property || property.length === 0) {
      return [];
    }

    const prop = property[0];
    const {
      cityId,
      districtId,
      wardId,
      propertyTypeId,
      transactionType,
    } = prop;

    // Determine transaction prefix
    const transactionPrefix = transactionType === 2 ? 'Cho thuê' : 'Bán';

    // Get property type name (simplified - in production should query property_type table)
    const propertyBaseName = 'bất động sản'; // TODO: Query from property_type table
    const propertyTypeName = `${transactionPrefix} ${propertyBaseName}`;

    const items: FilterItem[] = [];
    let title = '';

    // Get property type slug if property type ID exists
    let propertyTypeSlug: string | null = null;
    if (propertyTypeId) {
      const propertyTypeData = await db
        .select({
          slug: propertyType.slug,
        })
        .from(propertyType)
        .where(eq(propertyType.id, propertyTypeId))
        .limit(1);

      propertyTypeSlug = propertyTypeData[0]?.slug || null;
    }

    // Case 1: Has district -> List wards in that district
    if (districtId) {
      // Get district name
      const districtData = await db
        .select({
          districtName: locations.districtName,
        })
        .from(locations)
        .where(eq(locations.nId, districtId))
        .limit(1);

      const districtName = districtData[0]?.districtName || 'Quận/Huyện';
      title = `${propertyTypeName} tại ${districtName}`;

      // Count properties by ward in this district
      const conditions = [
        eq(realEstate.districtId, districtId),
        eq(realEstate.aactive, true)
      ];
      if (transactionType !== null) {
        conditions.push(eq(realEstate.transactionType, transactionType));
      }
      if (propertyTypeId) {
        conditions.push(eq(realEstate.propertyTypeId, propertyTypeId));
      }

      const wardCounts = await db
        .select({
          wardId: realEstate.wardId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(realEstate)
        .where(and(...conditions))
        .groupBy(realEstate.wardId)
        .orderBy(sql`count(*) DESC`)
        .limit(15);

      // Get ward details
      const wardIds = wardCounts
        .map(w => w.wardId)
        .filter((id): id is string => id !== null);

      if (wardIds.length > 0) {
        const wardDetails = await db
          .select({
            nId: locations.nId,
            nSlugV1: locations.nSlugV1,
            wardName: locations.wardName,
          })
          .from(locations)
          .where(
            and(
              eq(locations.nLevel, 'PhuongXa'),
              inArray(locations.nId, wardIds)
            )
          );

        const wardMap = new Map(
          wardDetails.map(w => [w.nId, w])
        );

        for (const wc of wardCounts) {
          if (!wc.wardId) continue;
          const ward = wardMap.get(wc.wardId);
          if (!ward) continue;

          let wardDisplayName = ward.wardName || '';
          // Add "Phường" prefix if ward name is numeric
          try {
            if (!isNaN(Number(wardDisplayName))) {
              wardDisplayName = `Phường ${wardDisplayName}`;
            }
          } catch {}

          items.push({
            title: `${wardDisplayName} (${wc.count.toLocaleString()})`,
            params: {
              transaction_type: transactionType || 1,
              property_types: propertyTypeId ? String(propertyTypeId) : undefined,
              property_type_slug: propertyTypeSlug || undefined,
              selected_addresses: ward.nSlugV1 || undefined,
            },
          });
        }
      }
    }
    // Case 2: Has city (no district) -> List districts in that city
    else if (cityId) {
      // Get city name
      const cityData = await db
        .select({
          cityName: locations.cityName,
        })
        .from(locations)
        .where(eq(locations.nId, cityId))
        .limit(1);

      const cityName = cityData[0]?.cityName || 'Tỉnh/Thành';
      title = `${propertyTypeName} tại ${cityName}`;

      // Count properties by district in this city
      const conditions = [
        eq(realEstate.cityId, cityId),
        eq(realEstate.aactive, true)
      ];
      if (transactionType !== null) {
        conditions.push(eq(realEstate.transactionType, transactionType));
      }
      if (propertyTypeId) {
        conditions.push(eq(realEstate.propertyTypeId, propertyTypeId));
      }

      const districtCounts = await db
        .select({
          districtId: realEstate.districtId,
          count: sql<number>`cast(count(*) as int)`,
        })
        .from(realEstate)
        .where(and(...conditions))
        .groupBy(realEstate.districtId)
        .orderBy(sql`count(*) DESC`)
        .limit(15);

      // Get district details
      const districtIds = districtCounts
        .map(d => d.districtId)
        .filter((id): id is string => id !== null);

      if (districtIds.length > 0) {
        const districtDetails = await db
          .select({
            nId: locations.nId,
            nSlugV1: locations.nSlugV1,
            districtName: locations.districtName,
          })
          .from(locations)
          .where(
            and(
              eq(locations.nLevel, 'QuanHuyen'),
              inArray(locations.nId, districtIds)
            )
          );

        const districtMap = new Map(
          districtDetails.map(d => [d.nId, d])
        );

        for (const dc of districtCounts) {
          if (!dc.districtId) continue;
          const district = districtMap.get(dc.districtId);
          if (!district) continue;

          let districtDisplayName = district.districtName || '';
          // Add "Quận" prefix if district name is numeric
          try {
            if (!isNaN(Number(districtDisplayName))) {
              districtDisplayName = `Quận ${districtDisplayName}`;
            }
          } catch {}

          items.push({
            title: `${districtDisplayName} (${dc.count.toLocaleString()})`,
            params: {
              transaction_type: transactionType || 1,
              property_types: propertyTypeId ? String(propertyTypeId) : undefined,
              property_type_slug: propertyTypeSlug || undefined,
              selected_addresses: district.nSlugV1 || undefined,
            },
          });
        }
      }
    }

    if (items.length === 0) {
      return [];
    }

    return [
      {
        title,
        filters: items,
      },
    ];
  } catch (error) {
    return [];
  }
}
