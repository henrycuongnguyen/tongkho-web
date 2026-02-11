import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { locations } from './src/db/schema/location.ts';
import { eq, desc, sql } from 'drizzle-orm';

const connectionString = 'postgresql://postgres.tbtmzkqmuzxvafucgvwh:Yen0987654321@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';
const client = postgres(connectionString);
const db = drizzle(client);

const topDistricts = await db
  .select({
    nId: locations.nId,
    name: locations.nName,
    nType: locations.nType,
    searchCount: locations.searchCount,
  })
  .from(locations)
  .where(
    sql`${locations.cityId} = 'VN-HN' AND ${locations.nLevel} = 'QuanHuyen' AND ${locations.nStatus} != '6'`
  )
  .orderBy(desc(locations.searchCount))
  .limit(10);

console.log('Top 10 districts in Hanoi by search_count:\n');
topDistricts.forEach((d, idx) => {
  console.log(`#${idx + 1}: ${d.name} (${d.nType})`);
  console.log(`    search_count: ${d.searchCount}`);
  console.log(`    n_id: ${d.nId}\n`);
});

await client.end();
