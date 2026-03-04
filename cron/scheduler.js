const { crawlSteam } = require('../modules/crawler/steamCrawler.service')
const { crawlRoblox } = require('../modules/crawler/robloxCrawler.service')
const { crawlReddit } = require('../modules/crawler/redditCrawler.service')
const { crawlYouTube } = require('../modules/crawler/youtubeCrawler.service')
const { analyze } = require('../modules/trend/trendAnalysis.service')
const { decide } = require('../modules/ai/gemini.service')
const db = require('../db/connection')
async function runDaily() {
  try { await crawlSteam() } catch (e) {}
  try { await crawlRoblox() } catch (e) {}
  try { await crawlReddit() } catch (e) {}
  try { await crawlYouTube() } catch (e) {}
}
async function runTwoHourly() {
  try {
    await analyze()
    const rows = await db.query('SELECT p.id, s.word, p.growth_rate, p.acceleration, p.platform_score, s.first_seen_at FROM label_prediction p JOIN label_sources s ON p.label_id=s.id WHERE p.ai_score IS NULL OR p.ai_score=0 ORDER BY p.calculated_at DESC LIMIT 200')
    for (const r of rows.rows) {
      const ai = await decide({ word: r.word, growth_rate: r.growth_rate, acceleration: r.acceleration, platform_score: r.platform_score, days_since_first_seen: Math.max(0, Math.floor((Date.now() - new Date(r.first_seen_at).getTime())/(24*60*60*1000))) })
      const updated = await db.query('UPDATE label_prediction SET ai_score=$1, prediction_score=prediction_score + $1 * 0.3 WHERE id=$2 RETURNING prediction_score', [ai, r.id])
      const ps = updated.rows[0].prediction_score
      const status = ps >= 3.5 ? 'exploding' : (ps >= 2 ? 'early_trend' : 'normal')
      await db.query('UPDATE label_prediction SET status=$1 WHERE id=$2', [status, r.id])
    }
  } catch (e) {}
}
function start() {
  runDaily()
  setInterval(runDaily, 24*60*60*1000)
  setInterval(runTwoHourly, 2*60*60*1000)
}
module.exports = { start, runDaily, runTwoHourly }
