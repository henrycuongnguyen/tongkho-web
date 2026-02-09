/**
 * Test script to check provinces data
 */
import { db } from './src/db';
import { locationsWithCountProperty } from './src/db/schema';
import { isNull } from 'drizzle-orm';

async function testProvinces() {
  console.log('Testing provinces query...');

  // Test 1: Get total count
  const allRows = await db
    .select()
    .from(locationsWithCountProperty)
    .limit(10);

  console.log(`Total rows in table (first 10):`, allRows.length);
  console.log('Sample data:', JSON.stringify(allRows.slice(0, 2), null, 2));

  // Test 2: Get with mergedintoid IS NULL (new addresses)
  const newAddresses = await db
    .select()
    .from(locationsWithCountProperty)
    .where(isNull(locationsWithCountProperty.mergedintoid))
    .limit(10);

  console.log(`\nNew addresses (mergedintoid IS NULL):`, newAddresses.length);
  console.log('Sample new address:', JSON.stringify(newAddresses[0], null, 2));

  // Test 3: Get all without filter
  const allNoFilter = await db
    .select()
    .from(locationsWithCountProperty)
    .orderBy(locationsWithCountProperty.displayOrder)
    .limit(10);

  console.log(`\nAll rows ordered by displayOrder:`, allNoFilter.length);
  allNoFilter.forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.title} (displayOrder: ${row.displayOrder}, mergedintoid: ${row.mergedintoid})`);
  });
}

testProvinces()
  .then(() => {
    console.log('\nTest completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
