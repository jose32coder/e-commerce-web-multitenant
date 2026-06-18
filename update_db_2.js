const { Client } = require('pg');
const client = new Client({
  host: 'aws-1-us-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.xrstsqwfvyiyqurcnpde',
  password: 'C3oSxNqHL9wH63cH',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  const res = await client.query("UPDATE products SET item_type = 'service', service_booking_mode = 'whatsapp' WHERE name ILIKE '%servicio%' OR name ILIKE '%service%'");
  console.log('Updated rows:', res.rowCount);
  await client.end();
}
run().catch(console.error);
