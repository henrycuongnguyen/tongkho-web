/**
 * Check property types data - verify Vietnamese names exist
 */
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL || 'postgres://tongkhobds_dev:jFtnw3DpmN4E@dbdev.tongkhobds.com:5432/tongkhobdsdev2';

const client = postgres(connectionString);

console.log('🔍 Checking property types data...\n');

// Check transaction type 1 (Mua bán / Sale)
const saleTypes = await client`
  SELECT id, title, vietnamese, slug, transaction_type, aactive
  FROM property_type
  WHERE aactive = true AND transaction_type = 1
  ORDER BY id
  LIMIT 10
`;

console.log('📊 Transaction Type 1 (Mua bán) - First 10 records:\n');
console.table(saleTypes.map(pt => ({
  ID: pt.id,
  Title: pt.title,
  Vietnamese: pt.vietnamese || '❌ NULL',
  Slug: pt.slug,
  Active: pt.aactive ? '✅' : '❌'
})));

// Check if Vietnamese field is populated
const hasVietnamese = saleTypes.some(pt => pt.vietnamese);
const missingVietnamese = saleTypes.filter(pt => !pt.vietnamese);

console.log('\n📈 Summary:');
console.log(`✅ Total records: ${saleTypes.length}`);
console.log(`${hasVietnamese ? '✅' : '❌'} Has Vietnamese names: ${hasVietnamese}`);
console.log(`⚠️  Missing Vietnamese: ${missingVietnamese.length} records`);

if (missingVietnamese.length > 0) {
  console.log('\n⚠️  WARNING: Some property types are missing Vietnamese names!');
  console.log('These will fallback to English "title" field.');
  console.log('\nMissing Vietnamese for:');
  missingVietnamese.forEach(pt => {
    console.log(`  - ID ${pt.id}: ${pt.title}`);
  });
}

await client.end();
