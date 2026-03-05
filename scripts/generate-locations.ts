/**
 * Generate Static Location JSON Files
 * Creates static JSON files for provinces, districts, and wards at build time.
 *
 * Usage: npm run generate:locations
 *
 * Output structure:
 * public/data/
 * ├── provinces-new.json
 * ├── provinces-old.json
 * ├── districts/
 * │   ├── new/{provinceNId}.json
 * │   └── old/{provinceNId}.json
 * └── wards/
 *     ├── new/{districtNId}.json
 *     └── old/{districtNId}.json
 *
 * Version logic:
 * - NEW: mergedintoid IS NULL (modern addresses, n_status = '6')
 * - OLD: n_status != '6' OR n_status IS NULL (legacy addresses)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { locations } from '../src/db/schema/location';
import { locationsWithCountProperty } from '../src/db/schema/location-with-count';
import * as fs from 'fs';
import * as path from 'path';

// Load .env file manually (no dotenv dependency)
function loadEnv(): void {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          let value = trimmed.substring(eqIndex + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    }
  }
}

loadEnv();

const OUTPUT_DIR = 'public/data';

interface LocationItem {
  nId: string;
  name: string;
  slug: string;
  propertyCount?: number;
  displayOrder?: number;
  cityImage?: string;
  cityImageWeb?: string;
}

interface DistrictItem extends LocationItem {
  provinceId: string;
}

interface WardItem extends LocationItem {
  districtId: string;
}

type AddressVersion = 'new' | 'old';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[ERROR] DATABASE_URL not configured');
  process.exit(1);
}

const client = postgres(connectionString, { max: 5, connect_timeout: 10, idle_timeout: 30 });
const db = drizzle(client);

/**
 * Get provinces from locations_with_count_property
 * - NEW: mergedintoid IS NULL
 * - OLD: all records (no filter)
 */
async function getProvinces(version: AddressVersion): Promise<LocationItem[]> {
  console.log(`  Fetching provinces (${version})...`);

  try {
    const baseConditions = [
      sql`${locationsWithCountProperty.cityId} IS NOT NULL`,
      sql`(${locationsWithCountProperty.districtId} IS NULL OR ${locationsWithCountProperty.districtId} = '')`,
      sql`(${locationsWithCountProperty.wardId} IS NULL OR ${locationsWithCountProperty.wardId} = '')`,
    ];

    // NEW: only non-merged addresses
    // OLD: all addresses (no additional filter)
    const conditions = version === 'new'
      ? [...baseConditions, isNull(locationsWithCountProperty.mergedintoid)]
      : baseConditions;

    const rows = await db
      .select({
        cityId: locationsWithCountProperty.cityId,
        title: locationsWithCountProperty.title,
        slug: locationsWithCountProperty.slug,
        propertyCount: locationsWithCountProperty.propertyCount,
        displayOrder: locationsWithCountProperty.displayOrder,
        cityImage: locationsWithCountProperty.cityImage,
        cityImageWeb: locationsWithCountProperty.cityImageWeb,
      })
      .from(locationsWithCountProperty)
      .where(and(...conditions))
      .orderBy(locationsWithCountProperty.displayOrder);

    console.log(`    Found ${rows.length} provinces`);

    return rows.map(row => ({
      nId: row.cityId || '',
      name: row.title || '',
      slug: row.slug || '',
      propertyCount: row.propertyCount || 0,
      displayOrder: row.displayOrder || 100,
      cityImage: row.cityImage || '',
      cityImageWeb: row.cityImageWeb || '',
    }));
  } catch (error) {
    console.error(`  [ERROR] Failed to fetch provinces (${version}):`, error);
    return [];
  }
}

/**
 * Get districts from locations table
 * - NEW: n_status = '6'
 * - OLD: n_status != '6' OR n_status IS NULL
 */
async function getDistrictsByProvince(provinceNId: string, version: AddressVersion): Promise<DistrictItem[]> {
  try {
    const conditions = [
      eq(locations.nParentid, provinceNId),
      eq(locations.nLevel, version === 'new' ? 'PhuongXa' : 'QuanHuyen'),
      eq(locations.aactive, true),
    ];

    if (version === 'new') {
      conditions.push(eq(locations.nStatus, '6'));
    } else {
      conditions.push(sql`(${locations.nStatus} != '6' OR ${locations.nStatus} IS NULL)`);
    }

    const rows = await db
      .select({
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        slugV1: locations.nSlugV1,
        displayOrder: locations.displayOrder,
        searchCount: locations.searchCount,
      })
      .from(locations)
      .where(and(...conditions))
      .orderBy(locations.displayOrder, locations.nName);

    // Sort: Thành phố > Thị xã > Huyện, then by displayOrder, then by name
    const sortedRows = rows.sort((a, b) => {
      const getPriority = (name: string) => {
        if (name.startsWith('Thành phố')) return 0;
        if (name.startsWith('Thị xã')) return 1;
        return 2; // Huyện
      };
      const priorityDiff = getPriority(a.name || '') - getPriority(b.name || '');
      if (priorityDiff !== 0) return priorityDiff;
      const orderDiff = (a.displayOrder || 100) - (b.displayOrder || 100);
      if (orderDiff !== 0) return orderDiff;
      return (a.name || '').localeCompare(b.name || '', 'vi');
    });

    return sortedRows.map(row => ({
      nId: row.nId || '',
      name: row.name || '',
      slug: row.slugV1 || row.slug || '',
      propertyCount: Number(row.searchCount) || 0,
      displayOrder: row.displayOrder || 100,
      provinceId: provinceNId,
    }));
  } catch (error) {
    console.error(`  [ERROR] Failed to fetch districts for ${provinceNId}:`, error);
    return [];
  }
}

/**
 * Get wards from locations table
 * - NEW: n_status = '6'
 * - OLD: n_status != '6' OR n_status IS NULL
 */
async function getWardsByDistrict(districtNId: string, version: AddressVersion): Promise<WardItem[]> {
  try {
    const conditions = [
      eq(locations.nParentid, districtNId),
      eq(locations.nLevel, 'PhuongXa'),
      eq(locations.aactive, true),
    ];

    if (version === 'new') {
      conditions.push(eq(locations.nStatus, '6'));
    } else {
      conditions.push(sql`(${locations.nStatus} != '6' OR ${locations.nStatus} IS NULL)`);
    }

    const rows = await db
      .select({
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlug,
        slugV1: locations.nSlugV1,
        displayOrder: locations.displayOrder,
        searchCount: locations.searchCount,
      })
      .from(locations)
      .where(and(...conditions))
      .orderBy(locations.displayOrder, locations.nName);

    // Sort: Phường > Thị trấn > Xã, then by displayOrder, then by name
    const sortedRows = rows.sort((a, b) => {
      const getPriority = (name: string) => {
        if (name.startsWith('Phường')) return 0;
        if (name.startsWith('Thị trấn')) return 1;
        return 2; // Xã
      };
      const priorityDiff = getPriority(a.name || '') - getPriority(b.name || '');
      if (priorityDiff !== 0) return priorityDiff;
      const orderDiff = (a.displayOrder || 100) - (b.displayOrder || 100);
      if (orderDiff !== 0) return orderDiff;
      return (a.name || '').localeCompare(b.name || '', 'vi');
    });

    return sortedRows.map(row => ({
      nId: row.nId || '',
      name: row.name || '',
      slug: row.slugV1 || row.slug || '',
      propertyCount: Number(row.searchCount) || 0,
      displayOrder: row.displayOrder || 100,
      districtId: districtNId,
    }));
  } catch (error) {
    console.error(`  [ERROR] Failed to fetch wards for ${districtNId}:`, error);
    return [];
  }
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data));
}

async function generateLocations(): Promise<void> {
  console.log('\n========================================');
  console.log('Generating Static Location JSON Files');
  console.log('========================================\n');

  const startTime = Date.now();
  let totalFiles = 0;
  let totalWardFiles = { new: 0, old: 0 };

  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, 'districts', 'new'));
  ensureDir(path.join(OUTPUT_DIR, 'districts', 'old'));
  ensureDir(path.join(OUTPUT_DIR, 'wards', 'new'));
  ensureDir(path.join(OUTPUT_DIR, 'wards', 'old'));

  for (const version of ['new', 'old'] as AddressVersion[]) {
    console.log(`\n[${version.toUpperCase()}] Processing ${version} addresses...`);

    // 1. Generate provinces
    const provinces = await getProvinces(version);
    writeJson(path.join(OUTPUT_DIR, `provinces-${version}.json`), provinces);
    totalFiles++;
    console.log(`  ✓ provinces-${version}.json (${provinces.length} records)`);

    // 2. Generate districts for each province
    let districtFileCount = 0;
    let totalDistricts = 0;

    for (const province of provinces) {
      const districts = await getDistrictsByProvince(province.nId, version);
      const districtFile = path.join(OUTPUT_DIR, 'districts', version, `${province.nId}.json`);
      writeJson(districtFile, districts);
      districtFileCount++;
      totalDistricts += districts.length;

      // 3. Generate wards for each district
      // for (const district of districts) {
      //   const wards = await getWardsByDistrict(district.nId, version);
      //   if (wards.length > 0) {
      //     const wardFile = path.join(OUTPUT_DIR, 'wards', version, `${district.nId}.json`);
      //     writeJson(wardFile, wards);
      //     totalFiles++;
      //     totalWardFiles[version]++;
      //   }
      // }
    }

    totalFiles += districtFileCount;
    console.log(`  ✓ districts/${version}/ (${districtFileCount} files, ${totalDistricts} total districts)`);
    // console.log(`  ✓ wards/${version}/ (${totalWardFiles[version]} files)`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n========================================');
  console.log('Generation Complete!');
  console.log('========================================');
  console.log(`  Total files: ${totalFiles}`);
  // console.log(`  Wards (new): ${totalWardFiles.new} files`);
  // console.log(`  Wards (old): ${totalWardFiles.old} files`);
  console.log(`  Time: ${elapsed}s`);
  console.log('');
}

generateLocations()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('\n[FATAL] Generation failed:', error);
    await client.end();
    process.exit(1);
  });
