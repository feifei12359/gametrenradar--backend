const { Pool } = require('pg')
const url = process.env.DATABASE_URL
const ssl = url && (url.includes('railway.app') || url.includes('supabase.co') || process.env.PGSSLMODE === 'require') ? { rejectUnauthorized: false } : false
const pool = new Pool({ connectionString: url, ssl, keepAlive: true, connectionTimeoutMillis: 5000 })
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
}
