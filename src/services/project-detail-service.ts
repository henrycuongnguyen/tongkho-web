/**
 * Project Detail Service
 * Fetch project details from PostgreSQL by slug
 */

import { db } from '@/db';
import { project, type ProjectRow } from '@/db/schema/project';
import { eq, and } from 'drizzle-orm';
import { searchProperties } from '@/services/elasticsearch/property-search-service';
import type { PropertySearchFilters, PropertyDocument } from '@/services/elasticsearch/types';

// S3 and upload base URLs
const UPLOADS_BASE_URL = 'https://quanly.tongkhobds.com';
const S3_ENDPOINT = 'https://s3-han02.fptcloud.com';
const S3_BUCKET = 'bds-crawl-data';

export interface ProjectDetail {
  id: number;
  slug: string;
  projectName: string;
  projectCode: string | null;
  description: string | null;
  projectStatus: string | null;
  legalStatus: string | null;
  projectArea: number | null;
  areaUnit: string | null;
  totalUnits: number | null;
  totalTowers: number | null;
  utilities: string[];

  // Developer
  developerName: string | null;
  developerLogo: string | null;

  // Location
  city: string | null;
  cityId: string | null;
  district: string | null;
  districtId: string | null;
  ward: string | null;
  wardId: string | null;
  streetAddress: string | null;
  fullAddress: string;
  lat: number | null;
  lng: number | null;

  // Images
  mainImage: string | null;
  galleryImages: string[];
  masterPlanImages: string[];

  // Pricing
  priceDescription: string | null;
}

export interface ProjectProperties {
  sellProperties: PropertyDocument[];
  rentProperties: PropertyDocument[];
  seeAllSellUrl: string | null;
  seeAllRentUrl: string | null;
}

/**
 * Parse image URL - handle different storage formats
 */
function parseImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Already a full URL
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Local upload format: "project.main_image.xxx.jpg"
  if (path.startsWith('project.')) {
    return `${UPLOADS_BASE_URL}/tongkho/static/uploads/project/${path}`;
  }

  // S3 key format - remove leading slash if present to avoid double slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${S3_ENDPOINT}/${S3_BUCKET}/${cleanPath}`;
}

/**
 * Parse JSON array of images
 */
function parseImageArray(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map(img => parseImageUrl(img)).filter(Boolean) as string[];
    }
    return [];
  } catch {
    // Maybe it's a comma-separated string
    if (jsonStr.includes(',')) {
      return jsonStr.split(',').map(s => parseImageUrl(s.trim())).filter(Boolean) as string[];
    }
    // Single image
    const single = parseImageUrl(jsonStr);
    return single ? [single] : [];
  }
}

/**
 * Parse utilities JSON
 */
function parseUtilities(jsonStr: string | null | undefined): string[] {
  if (!jsonStr) return [];

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter(u => typeof u === 'string');
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Build full address from location parts
 */
function buildFullAddress(row: ProjectRow): string {
  const parts = [row.streetAddress, row.ward, row.district, row.city].filter(Boolean);
  return parts.join(', ') || 'Đang cập nhật';
}

/**
 * Map database row to ProjectDetail
 */
function mapToProjectDetail(row: ProjectRow): ProjectDetail {
  const galleryImages = parseImageArray(row.galleryImages);
  const mainImage = parseImageUrl(row.mainImage);

  // Use mainImage as first gallery image if gallery is empty
  const finalGallery = galleryImages.length > 0 ? galleryImages : (mainImage ? [mainImage] : []);

  return {
    id: row.id,
    slug: row.slug || '',
    projectName: row.projectName || 'Dự án',
    projectCode: row.projectCode,
    description: row.description,
    projectStatus: row.projectStatus,
    legalStatus: row.legalStatus,
    projectArea: row.projectArea,
    areaUnit: row.areaUnit || 'm²',
    totalUnits: row.totalUnits,
    totalTowers: row.totalTowers,
    utilities: parseUtilities(row.utilities),

    developerName: row.developerName,
    developerLogo: parseImageUrl(row.developerLogo),

    city: row.city,
    cityId: row.cityId,
    district: row.district,
    districtId: row.districtId,
    ward: row.ward,
    wardId: row.wardId,
    streetAddress: row.streetAddress,
    fullAddress: buildFullAddress(row),
    lat: row.latitude ? parseFloat(row.latitude) : null,
    lng: row.longitude ? parseFloat(row.longitude) : null,

    mainImage,
    galleryImages: finalGallery,
    masterPlanImages: parseImageArray(row.masterPlanImages),

    priceDescription: row.priceDescription,
  };
}

/**
 * Get project detail by slug - tries multiple matching strategies
 */
export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  try {
    // Strategy 1: Exact slug match in PostgreSQL
    let rows = await db
      .select()
      .from(project)
      .where(and(
        eq(project.slug, slug),
        eq(project.aactive, true)
      ))
      .limit(1);

    if (rows.length > 0) {
      return mapToProjectDetail(rows[0]);
    }

    // Strategy 2: Slug variations (for variants like "du-an-xxx-123" vs "xxx")
    const slugWithoutPrefix = slug.replace(/^du-an-/, '');
    const slugWithoutSuffix = slug.replace(/-\d+$/, '');
    const cleanSlug = slugWithoutPrefix.replace(/-\d+$/, '');

    rows = await db
      .select()
      .from(project)
      .where(eq(project.aactive, true))
      .limit(100);

    // Try matching with different slug variations
    const matchingProject = rows.find(row => {
      if (!row.slug) return false;
      const rowSlug = row.slug.toLowerCase();
      const inputSlug = slug.toLowerCase();

      return (
        rowSlug === inputSlug ||
        rowSlug === slugWithoutPrefix.toLowerCase() ||
        rowSlug === slugWithoutSuffix.toLowerCase() ||
        rowSlug === cleanSlug.toLowerCase() ||
        inputSlug.includes(rowSlug) ||
        rowSlug.includes(inputSlug.replace(/^du-an-/, '').replace(/-\d+$/, ''))
      );
    });

    if (matchingProject) {
      return mapToProjectDetail(matchingProject);
    }

    // Strategy 3: Try Elasticsearch project index
    const esProject = await searchProjectInES(slug);
    if (esProject) {
      return esProject;
    }

    return null;
  } catch (error) {
    console.error('[ProjectDetailService] Failed to fetch project:', error);
    return null;
  }
}

/**
 * Search for project in Elasticsearch index
 */
async function searchProjectInES(slug: string): Promise<ProjectDetail | null> {
  const ES_URL = import.meta.env.ES_URL;
  const ES_API_KEY = import.meta.env.ES_API_KEY;

  if (!ES_URL || !ES_API_KEY) {
    return null;
  }

  try {
    // Clean up slug variations
    const slugVariants = [
      slug,
      slug.replace(/^du-an-/, ''),
      slug.replace(/-\d+$/, ''),
      slug.replace(/^du-an-/, '').replace(/-\d+$/, ''),
    ];

    // Build ES query to match any slug variant
    const response = await fetch(`${ES_URL}/project/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: {
          bool: {
            should: slugVariants.map(s => ({ term: { slug: s } })),
            minimum_should_match: 1
          }
        },
        size: 1,
        _source: [
          'id', 'slug', 'project_name', 'project_code', 'description',
          'project_status', 'legal_status', 'project_area', 'area_unit',
          'total_units', 'total_towers', 'utilities', 'developer_name',
          'developer_logo', 'city', 'city_id', 'district', 'district_id',
          'ward', 'ward_id', 'street_address', 'latitude', 'longitude',
          'main_image', 'gallery_images', 'master_plan_images', 'price_description'
        ]
      })
    });

    if (!response.ok) {
      console.error('[ProjectDetailService] ES request failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.hits?.hits?.length > 0) {
      return mapESProjectToDetail(data.hits.hits[0]._source);
    }

    return null;
  } catch (error) {
    console.error('[ProjectDetailService] ES search failed:', error);
    return null;
  }
}

/**
 * Map ES project document to ProjectDetail
 */
function mapESProjectToDetail(source: any): ProjectDetail {
  return {
    id: source.id || 0,
    slug: source.slug || '',
    projectName: source.project_name || 'Dự án',
    projectCode: source.project_code || null,
    description: source.description || null,
    projectStatus: source.project_status || null,
    legalStatus: source.legal_status || null,
    projectArea: source.project_area || null,
    areaUnit: source.area_unit || 'm²',
    totalUnits: source.total_units || null,
    totalTowers: source.total_towers || null,
    utilities: parseUtilities(source.utilities),

    developerName: source.developer_name || null,
    developerLogo: parseImageUrl(source.developer_logo),

    city: source.city || null,
    cityId: source.city_id || null,
    district: source.district || null,
    districtId: source.district_id || null,
    ward: source.ward || null,
    wardId: source.ward_id || null,
    streetAddress: source.street_address || null,
    fullAddress: [source.street_address, source.ward, source.district, source.city]
      .filter(Boolean).join(', ') || 'Đang cập nhật',
    lat: source.latitude ? parseFloat(source.latitude) : null,
    lng: source.longitude ? parseFloat(source.longitude) : null,

    mainImage: parseImageUrl(source.main_image),
    galleryImages: parseImageArray(source.gallery_images),
    masterPlanImages: parseImageArray(source.master_plan_images),

    priceDescription: source.price_description || null,
  };
}

/**
 * Get project detail by ID (tries PostgreSQL then ES)
 */
export async function getProjectById(id: number): Promise<ProjectDetail | null> {
  try {
    // Strategy 1: PostgreSQL lookup
    const rows = await db
      .select()
      .from(project)
      .where(and(
        eq(project.id, id),
        eq(project.aactive, true)
      ))
      .limit(1);

    if (rows.length > 0) {
      return mapToProjectDetail(rows[0]);
    }

    // Strategy 2: Try Elasticsearch
    const esProject = await searchProjectByIdInES(id);
    if (esProject) {
      return esProject;
    }

    return null;
  } catch (error) {
    console.error('[ProjectDetailService] Failed to fetch project by ID:', error);
    return null;
  }
}

/**
 * Search for project by ID in Elasticsearch
 */
async function searchProjectByIdInES(id: number): Promise<ProjectDetail | null> {
  const ES_URL = import.meta.env.ES_URL;
  const ES_API_KEY = import.meta.env.ES_API_KEY;

  if (!ES_URL || !ES_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${ES_URL}/project/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: { term: { id: id } },
        size: 1,
        _source: [
          'id', 'slug', 'project_name', 'project_code', 'description',
          'project_status', 'legal_status', 'project_area', 'area_unit',
          'total_units', 'total_towers', 'utilities', 'developer_name',
          'developer_logo', 'city', 'city_id', 'district', 'district_id',
          'ward', 'ward_id', 'street_address', 'latitude', 'longitude',
          'main_image', 'gallery_images', 'master_plan_images', 'price_description'
        ]
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.hits?.hits?.length > 0) {
      return mapESProjectToDetail(data.hits.hits[0]._source);
    }

    return null;
  } catch (error) {
    console.error('[ProjectDetailService] ES ID search failed:', error);
    return null;
  }
}

/**
 * Get properties listed at this project
 */
export async function getProjectProperties(
  projectName: string,
  districtId: string | null,
  projectCode: string | null,
  limit: number = 6
): Promise<ProjectProperties> {
  const result: ProjectProperties = {
    sellProperties: [],
    rentProperties: [],
    seeAllSellUrl: null,
    seeAllRentUrl: null,
  };

  try {
    // Build common filter base
    const baseFilters: Partial<PropertySearchFilters> = {
      pageSize: limit,
      page: 1,
    };

    // If we have districtId, filter by it
    if (districtId) {
      baseFilters.districtIds = [districtId];
    }

    // Search for sale properties (transactionType=1)
    const sellResult = await searchProperties({
      ...baseFilters,
      transactionType: 1,
      keyword: projectName,
    } as PropertySearchFilters);

    result.sellProperties = sellResult.hits;

    // Search for rent properties (transactionType=2)
    const rentResult = await searchProperties({
      ...baseFilters,
      transactionType: 2,
      keyword: projectName,
    } as PropertySearchFilters);

    result.rentProperties = rentResult.hits;

    // Build "see all" URLs if there are results
    // Use project_code (matching v1) instead of keyword
    if (projectCode) {
      if (sellResult.total > limit) {
        result.seeAllSellUrl = `/mua-ban?project_code=${projectCode}`;
      }
      if (rentResult.total > limit) {
        result.seeAllRentUrl = `/cho-thue?project_code=${projectCode}`;
      }
    }

  } catch (error) {
    console.error('[ProjectDetailService] Failed to fetch project properties:', error);
  }

  return result;
}

/**
 * Get related projects from same district
 */
export async function getRelatedProjects(
  districtId: string | null,
  excludeId: number,
  limit: number = 6
): Promise<Array<{ id: number; title: string; slug: string; mainImage: string | null; description: string | null }>> {
  if (!districtId) return [];

  try {
    const rows = await db
      .select({
        id: project.id,
        projectName: project.projectName,
        slug: project.slug,
        mainImage: project.mainImage,
        streetAddress: project.streetAddress,
      })
      .from(project)
      .where(and(
        eq(project.districtId, districtId),
        eq(project.aactive, true)
      ))
      .limit(limit + 1);

    return rows
      .filter(r => r.id !== excludeId)
      .slice(0, limit)
      .map(r => ({
        id: r.id,
        title: r.projectName || '',
        slug: r.slug || String(r.id),
        mainImage: parseImageUrl(r.mainImage),
        description: r.streetAddress,
      }));
  } catch (error) {
    console.error('[ProjectDetailService] Failed to get related projects:', error);
    return [];
  }
}
