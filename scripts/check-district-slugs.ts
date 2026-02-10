/**
 * Check district slugs format from database
 */
import { db } from '../src/db';
import { locations } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function checkDistrictSlugs() {
  console.log('Querying districts from Hanoi...\n');

  const districts = await db
    .select({
      nId: locations.nId,
      name: locations.nName,
      slug: locations.nSlug,
      slugV1: locations.nSlugV1,
      level: locations.nLevel,
    })
    .from(locations)
    .where(
      and(
        eq(locations.nParentid, 'VN-HN'),
        eq(locations.nLevel, 'QuanHuyen')
      )
    )
    .limit(15);

  console.log(`Found ${districts.length} districts:\n`);

  districts.forEach((d, i) => {
    console.log(`${i + 1}. ${d.name}`);
    console.log(`   nId: ${d.nId}`);
    console.log(`   slug: ${d.slug}`);
    console.log(`   slugV1: ${d.slugV1}`);
    console.log('');
  });

  process.exit(0);
}

checkDistrictSlugs().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
