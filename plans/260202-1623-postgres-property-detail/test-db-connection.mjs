/**
 * Test PostgreSQL connection and property fetch
 */
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.tongkhobds.com',
  port: 5432,
  user: 'tongkhobds',
  password: 'Ulvq6DVlE8TZ5NIRDGiDoqfd',
  database: 'tongkhobds',
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // Test fetching a property by slug
    const testSlug = 'bds-nha-255m2-goc-2-mat-tien-pham-thi-trich-cu-chi-gia-5-2-ty-co-hoi-vang';

    const result = await client.query(`
      SELECT id, title, slug, price_description, area, city, district,
             main_image, images, is_featured, created_on
      FROM real_estate
      WHERE slug = $1 AND aactive = true
      LIMIT 1
    `, [testSlug]);

    if (result.rows.length > 0) {
      console.log('✅ Found property by slug:');
      console.log(JSON.stringify(result.rows[0], null, 2));
    } else {
      console.log('❌ No property found with slug:', testSlug);

      // Try to find a valid slug
      const validResult = await client.query(`
        SELECT slug, title FROM real_estate
        WHERE aactive = true
        ORDER BY created_on DESC
        LIMIT 5
      `);
      console.log('\n📋 Sample valid slugs:');
      validResult.rows.forEach(row => {
        console.log(`  - ${row.slug}`);
        console.log(`    Title: ${row.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
