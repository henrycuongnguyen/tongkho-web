/**
 * Database Assumptions Verification Script
 *
 * Standalone script to verify database assumptions before Phase 1 implementation
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { pgTable, serial, varchar, integer, char, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { eq, and, isNull, sql } from 'drizzle-orm';

// Define simplified table schemas (just what we need for verification)
const folder = pgTable("folder", {
  id: serial().primaryKey(),
  parent: integer(),
  name: varchar({ length: 255 }),
  label: varchar({ length: 512 }),
  publish: char({ length: 1 }),
  displayOrder: integer("display_order"),
});

const propertyType = pgTable("property_type", {
  id: serial().primaryKey(),
  title: varchar({ length: 512 }),
  parentId: integer("parent_id"),
  transactionType: integer("transaction_type"),
  slug: varchar(),
  aactive: boolean(),
});

async function verifyAssumptions() {
  console.log('=== Database Assumptions Verification ===\n');

  // Get DATABASE_URL from environment or use default
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not set');
    console.log('\nPlease set DATABASE_URL before running this script.');
    console.log('Example: export DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"');
    process.exit(1);
  }

  const client = postgres(DATABASE_URL);
  const db = drizzle(client);

  try {
    // 1. Find news root folder (assumed to be ID 11)
    console.log('1. Verifying NEWS_ROOT_FOLDER_ID...');
    const rootFolders = await db
      .select()
      .from(folder)
      .where(isNull(folder.parent));

    console.log(`   Found ${rootFolders.length} root folders (parent IS NULL):`);
    rootFolders.forEach(f => {
      console.log(`   - ID: ${f.id}, Name: ${f.name}, Label: ${f.label}`);
    });

    // Check if folder 11 exists and its properties
    const folder11 = await db
      .select()
      .from(folder)
      .where(eq(folder.id, 11))
      .limit(1);

    if (folder11.length > 0) {
      console.log(`   ✓ Folder ID 11 exists: ${folder11[0].label} (${folder11[0].name})`);
      console.log(`     Parent: ${folder11[0].parent || 'NULL (root)'}`);
    } else {
      console.log(`   ✗ Folder ID 11 does NOT exist - need different root ID`);
    }

    // 2. Check property types with null slugs
    console.log('\n2. Checking property types with null slugs...');
    const nullSlugs = await db
      .select({
        id: propertyType.id,
        title: propertyType.title,
        transactionType: propertyType.transactionType,
        aactive: propertyType.aactive,
      })
      .from(propertyType)
      .where(and(
        eq(propertyType.aactive, true),
        isNull(propertyType.slug)
      ));

    if (nullSlugs.length > 0) {
      console.log(`   ✗ Found ${nullSlugs.length} active property types with NULL slug:`);
      nullSlugs.forEach(pt => {
        console.log(`   - ID: ${pt.id}, Title: ${pt.title}, TransactionType: ${pt.transactionType}`);
      });
      console.log('   → Service needs null slug fallback logic!');
    } else {
      console.log(`   ✓ All active property types have slug values`);
    }

    // 3. Count property types by transaction type
    console.log('\n3. Counting property types by transaction type...');
    const ptCounts = await db
      .select({
        transactionType: propertyType.transactionType,
        count: sql`count(*)::int`,
      })
      .from(propertyType)
      .where(eq(propertyType.aactive, true))
      .groupBy(propertyType.transactionType);

    ptCounts.forEach(row => {
      const typeName = row.transactionType === 1 ? 'Mua bán' :
                       row.transactionType === 2 ? 'Cho thuê' :
                       row.transactionType === 3 ? 'Dự án' : 'Unknown';
      console.log(`   Transaction Type ${row.transactionType} (${typeName}): ${row.count} items`);
    });

    // 4. Check news folders hierarchy
    console.log('\n4. Checking news folder hierarchy...');
    const newsFolders = await db
      .select({
        id: folder.id,
        parent: folder.parent,
        name: folder.name,
        label: folder.label,
        publish: folder.publish,
      })
      .from(folder)
      .where(eq(folder.publish, 'T'))
      .orderBy(folder.displayOrder);

    console.log(`   Found ${newsFolders.length} published folders`);
    const parentIds = new Set(newsFolders.map(f => f.parent).filter(p => p !== null));
    console.log(`   Unique parent IDs: ${[...parentIds].join(', ')}`);

    // Group by parent
    const byParent = newsFolders.reduce((acc, f) => {
      const key = f.parent || 'ROOT';
      if (!acc[key]) acc[key] = [];
      acc[key].push(f);
      return acc;
    }, {});

    Object.entries(byParent).forEach(([parentId, children]) => {
      console.log(`   Parent ${parentId}: ${children.length} children`);
    });

    console.log('\n=== Verification Complete ===');

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error verifying assumptions:', error.message);
    await client.end();
    process.exit(1);
  }
}

verifyAssumptions();
