const db = require('../../db/connection')
async function analyze() {
  const today = new Date().toISOString().slice(0,10)
  const y = new Date(Date.now() - 24*60*60*1000).toISOString().slice(0,10)
  const d2 = new Date(Date.now() - 2*24*60*60*1000).toISOString().slice(0,10)
  const recent7Start = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10)
  const prev7Start = new Date(Date.now() - 14*24*60*60*1000).toISOString().slice(0,10)
  const prev7End = new Date(Date.now() - 7*24*60*60*1000).toISOString().slice(0,10)
  const labels = await db.query('SELECT id, word, first_seen_at FROM label_sources')
  const distinctPlatforms = await db.query('SELECT label_id, COUNT(DISTINCT platform) c FROM label_timeseries GROUP BY label_id')
  const dp = new Map(distinctPlatforms.rows.map(r => [r.label_id, r.c]))
  for (const l of labels.rows) {
    const r7 = await db.query('SELECT COALESCE(SUM(mention_count),0) s FROM label_timeseries WHERE label_id=$1 AND date >= $2', [l.id, recent7Start])
    const p7 = await db.query('SELECT COALESCE(SUM(mention_count),0) s FROM label_timeseries WHERE label_id=$1 AND date >= $2 AND date < $3', [l.id, prev7Start, prev7End])
    const t = await db.query('SELECT COALESCE(SUM(mention_count),0) s FROM label_timeseries WHERE label_id=$1 AND date=$2', [l.id, today])
    const yy = await db.query('SELECT COALESCE(SUM(mention_count),0) s FROM label_timeseries WHERE label_id=$1 AND date=$2', [l.id, y])
    const dd = await db.query('SELECT COALESCE(SUM(mention_count),0) s FROM label_timeseries WHERE label_id=$1 AND date=$2', [l.id, d2])
    const recent7 = Number(r7.rows[0].s)
    const previous7 = Number(p7.rows[0].s)
    const todayCount = Number(t.rows[0].s)
    const yesterdayCount = Number(yy.rows[0].s)
    const dayBeforeCount = Number(dd.rows[0].s)
    const growth_rate = previous7 === 0 ? 5 : (recent7 - previous7) / previous7
    const daily_growth_today = todayCount - yesterdayCount
    const daily_growth_yesterday = yesterdayCount - dayBeforeCount
    const acceleration = daily_growth_today - daily_growth_yesterday
    const platform_score = Math.min(1, (dp.get(l.id) || 0) / 4)
    const days_since_first = Math.max(0, Math.floor((Date.now() - new Date(l.first_seen_at).getTime()) / (24*60*60*1000)))
    const new_word_weight = days_since_first <= 7 ? 1 : 0
    let prediction_score = 0.4 * growth_rate + 0.3 * acceleration + 0.2 * platform_score + 0.1 * new_word_weight
    const status = prediction_score >= 3.5 ? 'exploding' : (prediction_score >= 2 ? 'early_trend' : 'normal')
    await db.query('INSERT INTO label_prediction(label_id, growth_rate, acceleration, platform_score, ai_score, prediction_score, status) VALUES($1,$2,$3,$4,$5,$6,$7)', [l.id, growth_rate, acceleration, platform_score, 0, prediction_score, status])
  }
}
module.exports = { analyze }
