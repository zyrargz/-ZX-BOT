const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:yuyLdekTgrLnXafqvpeYlVaAWmPoSAsc@postgres-p9zd.railway.internal:5432/railway",
  ssl: { rejectUnauthorized: false }  // Railway butuh SSL false
});

client.connect()
  .then(() => console.log("✅ Database connected!"))
  .catch(err => console.error("❌ Database connection error:", err));
