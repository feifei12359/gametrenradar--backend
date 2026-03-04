let cache = new Map()
function setCache(k, v) { cache.set(k, { v, t: Date.now() }) }
function getCache(k) { const x = cache.get(k); if (!x) return null; if (Date.now() - x.t > 24 * 60 * 60 * 1000) { cache.delete(k); return null } return x.v }

const { GameService } = require('../game/game.service')

async function register(app) {
  const http = app.getHttpAdapter().getInstance()
  const gameService = app.get(GameService)
  const lowerGeneric = new Set(['shooter', 'puzzle', 'racing', 'defense', 'adventure', 'simulator', 'clicker', 'idle', 'arcade', 'strategy', 'game'])
  async function compute() {
    const games = await gameService.getGames()
    console.log('Found games:', games.length)

    const now = Date.now()
    const fourteenDays = 14 * 24 * 60 * 60 * 1000
    const tokens = new Map()

    for (const g of games) {
      const created = new Date(g.createdAt).getTime()
      const words = String(g.name || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 1)
      console.log('Processing game:', g.name, 'words:', words)

      for (const w of words) {
        if (lowerGeneric.has(w)) {
          console.log('Skipping generic word:', w)
          continue
        }
        if (!tokens.has(w)) tokens.set(w, { firstSeen: created, recentCount: 0, totalCount: 0 })
        const t = tokens.get(w)
        if (created < t.firstSeen) t.firstSeen = created
        t.totalCount += 1
        if (now - created <= fourteenDays) t.recentCount += 1
      }
    }

    console.log('Found tokens:', tokens.size)

    const result = []
    for (const [w, t] of tokens.entries()) {
      const daysSinceFirst = (now - t.firstSeen) / (1000 * 60 * 60 * 24)
      const noveltyScore = Math.round(t.recentCount * 2 + Math.max(0, 14 - daysSinceFirst) + (t.totalCount === 1 ? 5 : 0))
      const growthRate = Math.round(t.recentCount * 10)
      const acceleration = Math.max(0, growthRate - Math.round((t.totalCount - t.recentCount) * 5))
      const platformScore = Math.min(100, t.totalCount * 10)
      const aiScore = noveltyScore
      result.push({
        word: w,
        prediction_score: noveltyScore,
        growth_rate: growthRate,
        acceleration,
        platform_score: platformScore,
        ai_score: aiScore,
        first_seen_at: new Date(t.firstSeen).toISOString(),
        platforms: []
      })
    }

    console.log('Generated trends:', result.length)
    result.sort((a, b) => b.prediction_score - a.prediction_score)
    return result
  }

  http.get('/api/trend/exploding', async (req, res) => {
    try {
      const c = getCache('exploding'); if (c) return res.json(c)
      const result = (await compute()).filter(t => t.growth_rate > 5)
      setCache('exploding', result); res.json(result)
    } catch (e) {
      res.json([])
    }
  })

  http.get('/api/trend/early', async (req, res) => {
    try {
      const c = getCache('early'); if (c) return res.json(c)
      const result = (await compute()).filter(t => t.growth_rate <= 20)
      setCache('early', result); res.json(result)
    } catch (e) {
      res.json([])
    }
  })

  http.get('/api/trend/all', async (req, res) => {
    try {
      const c = getCache('all'); if (c) return res.json(c)
      const result = await compute()
      setCache('all', result); res.json(result)
    } catch (e) {
      res.json([])
    }
  })
}
module.exports = { register }
