/**
 * Discover News and Project tables schema
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

    // News table
    console.log('━━━ NEWS TABLE ━━━');
    const newsColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'news'
      ORDER BY ordinal_position
    `);
    newsColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    const newsSample = await client.query(`SELECT * FROM news WHERE aactive = true ORDER BY created_on DESC LIMIT 1`);
    if (newsSample.rows.length > 0) {
      console.log('\n📄 Sample news:');
      console.log(JSON.stringify(newsSample.rows[0], null, 2));
    }

    // News category table
    console.log('\n━━━ NEWS_CATEGORY TABLE ━━━');
    const newsCatColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'news_category'
      ORDER BY ordinal_position
    `);
    newsCatColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    const catSample = await client.query(`SELECT * FROM news_category LIMIT 5`);
    console.log('\n📋 Categories:');
    catSample.rows.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.title || cat.name}`);
    });

    // Project table
    console.log('\n━━━ PROJECT TABLE ━━━');
    const projectColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'project'
      ORDER BY ordinal_position
    `);
    projectColumns.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    const projectSample = await client.query(`SELECT * FROM project WHERE aactive = true ORDER BY created_on DESC LIMIT 1`);
    if (projectSample.rows.length > 0) {
      console.log('\n📄 Sample project:');
      console.log(JSON.stringify(projectSample.rows[0], null, 2));
    }

    // Count records
    const newsCount = await client.query(`SELECT COUNT(*) FROM news WHERE aactive = true`);
    const projectCount = await client.query(`SELECT COUNT(*) FROM project WHERE aactive = true`);
    console.log('\n📊 Record counts:');
    console.log(`  News: ${newsCount.rows[0].count}`);
    console.log(`  Projects: ${projectCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
