import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.tongkhobds.com', port: 5432, user: 'tongkhobds',
  password: 'Ulvq6DVlE8TZ5NIRDGiDoqfd', database: 'tongkhobds'
});

await client.connect();

const r = await client.query(`
  SELECT id, name, folder, created_on, publish_on
  FROM news
  WHERE aactive = true AND folder IN (26, 27, 37) AND avatar IS NOT NULL AND avatar != ''
  ORDER BY created_on DESC NULLS LAST
  LIMIT 10
`);

console.log('Top 10 by created_on DESC:');
r.rows.forEach((n, i) => {
  const date = n.created_on?.toISOString()?.slice(0, 10) || 'null';
  console.log(`${i+1}. [${date}] folder=${n.folder} - ${n.name?.slice(0, 50)}`);
});

await client.end();
