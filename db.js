const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});


client.connect()
  .then(() => console.log('✅ Database connected!'))
  .catch(err => console.error('❌ Database connection error:', err));

module.exports = client;
