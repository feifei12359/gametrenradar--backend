const stop = new Set(['the','and','for','with','from','that','this','have','will','your','into','over','then','they','them','their','there','here','what','when','where','which','also','only','very','much','more','less','some','such','many','most','game','play','free','new'])
const db = require('../../db/connection')
function normalize(text) {
  const t = String(text || '').toLowerCase().replace(/[^a-z0-9\s-]+/g, ' ').trim()
  const w = t.split(/\s+/).filter(v => v && v.length >= 4 && !/^\d+$/.test(v) && !stop.has(v))
  return w
}
async function upsertWord(word, platform) {
  const now = new Date()
  const res = await db.query('INSERT INTO label_sources(word, platform, first_seen_at, last_seen_at, total_mentions) VALUES($1,$2,$3,$3,1) ON CONFLICT (word, platform) DO UPDATE SET last_seen_at=$3, total_mentions=label_sources.total_mentions+1 RETURNING id', [word, platform, now])
  const id = res.rows[0].id
  const d = new Date().toISOString().slice(0,10)
  await db.query('INSERT INTO label_timeseries(label_id, date, platform, mention_count) VALUES($1,$2,$3,1) ON CONFLICT DO NOTHING', [id, d, platform])
}
module.exports = { normalize, upsertWord }
