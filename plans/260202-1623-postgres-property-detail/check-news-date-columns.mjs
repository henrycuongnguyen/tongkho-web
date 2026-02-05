import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.tongkhobds.com', port: 5432, user: 'tongkhobds',
  password: 'Ulvq6DVlE8TZ5NIRDGiDoqfd', database: 'tongkhobds'
});

await client.connect();

// Check all date columns for correct articles
const r = await client.query(`
  SELECT id, name, created_on, publish_on
  FROM news
  WHERE name LIKE '%thuế TNCN%' OR name LIKE '%mái Nhật%' OR name LIKE '%phong thuỷ xấu%'
`);

console.log('Date columns for known articles:');
r.rows.forEach(n => {
  console.log(`ID ${n.id}: ${n.name?.slice(0, 40)}`);
  console.log(`  created_on: ${n.created_on}`);
  console.log(`  publish_on: ${n.publish_on}`);
});

// Check the ID column order
const r2 = await client.query(`
  SELECT id, name, folder
  FROM news
  WHERE aactive = true AND folder IN (26, 27, 37) AND avatar IS NOT NULL AND avatar != ''
  ORDER BY id DESC
  LIMIT 10
`);
console.log('\nTop 10 by ID DESC:');
r2.rows.forEach((n, i) => console.log(`${i+1}. ID=${n.id} - ${n.name?.slice(0, 50)}`));

await client.end();
