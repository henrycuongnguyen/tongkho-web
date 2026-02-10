/**
 * Sidebar Filter Service
 * Generate dynamic filter blocks based on current URL context
 */

import { db } from '@/db';
import { locations, propertyType } from '@/db/schema';
import { eq, and, ne, desc } from 'drizzle-orm';

export interface SidebarFilter {
  title: string;
  url: string;
  count?: number;
}

export interface SidebarFilterBlock {
  id: string;
  title: string;
  filters: SidebarFilter[];
}

export interface SidebarFilterParams {
  transactionType: number;
  provinceSlug?: string;
  districtSlug?: string;
  propertyTypeIds?: number[];
  baseUrl: string;
}

/**
 * Generate sidebar filter blocks based on current URL context
 */
export async function generateSidebarFilters(
  params: SidebarFilterParams
): Promise<SidebarFilterBlock[]> {
  const blocks: SidebarFilterBlock[] = [];

  // Block 1: Districts (if on province page without district)
  if (params.provinceSlug && !params.districtSlug) {
    const districtBlock = await generateDistrictBlock(params);
    if (districtBlock) {
      blocks.push(districtBlock);
    }
  }

  // Block 2: Property types
  const propertyTypeBlock = await generatePropertyTypeBlock(params);
  if (propertyTypeBlock) {
    blocks.push(propertyTypeBlock);
  }

  return blocks;
}

/**
 * Generate district filter block for current province
 */
async function generateDistrictBlock(
  params: SidebarFilterParams
): Promise<SidebarFilterBlock | null> {
  try {
    // Get province by slug
    const province = await db
      .select({ id: locations.id, nId: locations.nId, name: locations.nName })
      .from(locations)
      .where(
        and(
          eq(locations.nSlug, params.provinceSlug!),
          eq(locations.nLevel, '0'),
          eq(locations.aactive, true)
        )
      )
      .limit(1);

    if (!province[0]) return null;

    // Get districts for this province
    const districts = await db
      .select({
        id: locations.id,
        name: locations.nName,
        slug: locations.nSlug,
      })
      .from(locations)
      .where(
        and(
          eq(locations.nParentid, province[0].nId!),
          eq(locations.nLevel, '1'),
          ne(locations.nStatus, '6'),
          eq(locations.aactive, true)
        )
      )
      .orderBy(desc(locations.searchCount))
      .limit(50);

    if (districts.length === 0) return null;

    const txSlug = getTransactionSlug(params.transactionType);

    return {
      id: 'districts',
      title: 'Khu vực khác',
      filters: districts.map(d => ({
        title: d.name || '',
        url: `/${txSlug}/${params.provinceSlug}/${d.slug}`
      }))
    };

  } catch (error) {
    console.error('[SidebarFilterService] District block failed:', error);
    return null;
  }
}

/**
 * Generate property type filter block
 */
async function generatePropertyTypeBlock(
  params: SidebarFilterParams
): Promise<SidebarFilterBlock | null> {
  try {
    // Get property types for this transaction type
    const types = await db
      .select({
        id: propertyType.id,
        title: propertyType.title,
        vietnamese: propertyType.vietnamese,
        slug: propertyType.slug,
      })
      .from(propertyType)
      .where(
        and(
          eq(propertyType.transactionType, params.transactionType),
          eq(propertyType.aactive, true)
        )
      )
      .limit(20);

    if (types.length === 0) return null;

    // Filter out currently selected types
    const currentIds = params.propertyTypeIds || [];
    const availableTypes = types.filter(t => !currentIds.includes(t.id));

    if (availableTypes.length === 0) return null;

    // Build block title (V1-compatible)
    let blockTitle = 'Loại hình khác';

    // If a property type is selected, use V1-style title
    if (currentIds.length === 1) {
      const selectedType = types.find(t => t.id === currentIds[0]);
      if (selectedType) {
        blockTitle = buildPropertyTypeTitle(
          params.transactionType,
          selectedType.vietnamese || selectedType.title
        );
      }
    }

    return {
      id: 'property-types',
      title: blockTitle,
      filters: availableTypes.map(t => ({
        title: t.title || '',
        url: `${params.baseUrl}?property_types=${t.id}`
      }))
    };

  } catch (error) {
    console.error('[SidebarFilterService] Property type block failed:', error);
    return null;
  }
}

/**
 * Get transaction type slug
 */
function getTransactionSlug(type: number): string {
  const slugs: Record<number, string> = {
    1: 'mua-ban',
    2: 'cho-thue',
    3: 'du-an'
  };
  return slugs[type] || 'mua-ban';
}

/**
 * Build block title from transaction type and property type (V1-compatible)
 * Examples:
 * - "Mua bán căn hộ chung cư"
 * - "Cho thuê nhà riêng"
 */
export function buildPropertyTypeTitle(
  transactionType: number,
  propertyTypeVietnamese?: string | null
): string {
  // Transaction prefix
  const transactionPrefix = transactionType === 2 ? 'Cho thuê' : 'Mua bán';

  // Base name from property type
  let baseName = propertyTypeVietnamese || 'bất động sản';

  // Strip common prefixes to avoid duplication
  const prefixes = ['Bán ', 'Cho thuê '];
  for (const prefix of prefixes) {
    if (baseName.startsWith(prefix)) {
      baseName = baseName.substring(prefix.length);
      break;
    }
  }

  return `${transactionPrefix} ${baseName}`;
}
