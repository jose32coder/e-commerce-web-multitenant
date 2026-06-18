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
  console.log('Connected');
  
  await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS item_type text DEFAULT \'product\'');
  await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS service_duration text');
  await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS service_booking_mode text DEFAULT \'whatsapp\'');
  
  console.log('Columns added successfully');
  await client.end();
}
run().catch(console.error);
