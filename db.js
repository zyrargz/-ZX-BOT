const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:lZQXqBxrSkyqjqaDquFrygxVxzUTCuEz@postgres.railway.internal:5432/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('✅ Database connected!'))
  .catch(err => console.error('❌ Database connection error:', err));

module.exports = client;
