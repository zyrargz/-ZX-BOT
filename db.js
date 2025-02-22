const { Client } = require('pg');

// Gunakan environment variable DATABASE_URL agar lebih fleksibel
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yuyLdekTgrLnXafqvpeYlVaAWmPoSAsc@postgres-p9zd.railway.internal:5432/railway";

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Railway butuh SSL false
});

client.connect()
  .then(() => console.log("✅ Database connected!"))
  .catch(err => console.error("❌ Database connection error:", err));

module.exports = client;
