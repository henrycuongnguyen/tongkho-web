/**
 * Test news query to understand correct data structure
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
    console.log('✅ Connected\n');

    // Check folder meanings
    console.log('━━━ FOLDERS (news categories) ━━━');
    const folders = await client.query(`
      SELECT DISTINCT folder, COUNT(*) as count
      FROM news WHERE aactive = true
      GROUP BY folder ORDER BY count DESC
    `);
    console.log('Folders:', folders.rows);

    // Check folder table if exists
    console.log('\n━━━ FOLDER TABLE ━━━');
    try {
      const folderTable = await client.query(`SELECT * FROM folder LIMIT 10`);
      folderTable.rows.forEach(f => console.log(`  ${f.id}: ${f.name || f.title}`));
    } catch (e) {
      console.log('No folder table found');
    }

    // Get sample news with good images
    console.log('\n━━━ SAMPLE NEWS WITH IMAGES ━━━');
    const news = await client.query(`
      SELECT id, name, avatar, folder, created_on, display_order
      FROM news
      WHERE aactive = true AND avatar IS NOT NULL AND avatar != ''
      ORDER BY display_order ASC, created_on DESC NULLS LAST
      LIMIT 8
    `);
    news.rows.forEach((n, i) => {
      console.log(`${i+1}. [folder=${n.folder}] ${n.name?.slice(0,50)}...`);
      console.log(`   avatar: ${n.avatar}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

main();
