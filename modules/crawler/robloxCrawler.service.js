const axios = require('axios')
const { normalize, upsertWord } = require('./utils')
async function crawlRoblox() {
  const url = 'https://games.roblox.com/v1/games/list?sortOrder=Asc&limit=100'
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, timeout: 15000 })
  const data = res.data && res.data.data ? res.data.data : []
  for (const it of data) {
    const words = normalize([it.name, it.description].filter(Boolean).join(' '))
    for (const w of words) await upsertWord(w, 'roblox')
  }
}
module.exports = { crawlRoblox }
