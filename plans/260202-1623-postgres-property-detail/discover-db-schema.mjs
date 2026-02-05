/**
 * Database Schema Discovery Script
 * Run: node plans/260202-1623-postgres-property-detail/discover-db-schema.mjs
 */
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  host: 'db.tongkhobds.com',
  port: 5432,
  user: 'tongkhobds',
  password: 'Ulvq6DVlE8TZ5NIRDGiDoqfd',
  database: 'tongkhobds',
  ssl: false,
});

async function main() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // List all tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📋 Tables in database:');
    console.log('─'.repeat(50));
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Find property-related tables
    const propertyTables = tablesResult.rows.filter(r =>
      r.table_name.includes('property') ||
      r.table_name.includes('listing') ||
      r.table_name.includes('real_estate') ||
      r.table_name.includes('post') ||
      r.table_name.includes('bds')
    );

    if (propertyTables.length > 0) {
      console.log('\n🏠 Property-related tables found:');
      for (const table of propertyTables) {
        console.log(`\n━━━ ${table.table_name} ━━━`);
        const columnsResult = await client.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table.table_name]);

        columnsResult.rows.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });

        // Sample data
        const sampleResult = await client.query(`SELECT * FROM "${table.table_name}" LIMIT 1`);
        if (sampleResult.rows.length > 0) {
          console.log('\n  📄 Sample row:');
          console.log(JSON.stringify(sampleResult.rows[0], null, 2).split('\n').map(l => '  ' + l).join('\n'));
        }
      }
    }

    // Try common table names if no property tables found
    const commonNames = ['posts', 'listings', 'properties', 'real_estates', 'items'];
    for (const name of commonNames) {
      try {
        const result = await client.query(`SELECT * FROM "${name}" LIMIT 1`);
        if (result.rows.length > 0) {
          console.log(`\n🔍 Found data in "${name}":`, result.rows[0]);
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

    // Look for any table with slug column
    console.log('\n🔎 Tables with "slug" column:');
    const slugTables = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name LIKE '%slug%'
      AND table_schema = 'public'
    `);
    slugTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}.${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
