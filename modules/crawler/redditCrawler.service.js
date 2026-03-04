const axios = require('axios')
const { normalize, upsertWord } = require('./utils')
const subs = ['gaming','roblox','Steam','indiegames']
async function crawlReddit() {
  for (const s of subs) {
    const url = `https://www.reddit.com/r/${s}/new.json?limit=50`
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, timeout: 15000 })
    const posts = res.data && res.data.data && res.data.data.children ? res.data.data.children : []
    for (const p of posts) {
      const t = p.data && p.data.title ? p.data.title : ''
      const flair = p.data && p.data.link_flair_text ? p.data.link_flair_text : ''
      const sub = p.data && p.data.subreddit ? p.data.subreddit : ''
      const words = normalize([t, flair, sub].filter(Boolean).join(' '))
      for (const w of words) await upsertWord(w, 'reddit')
    }
  }
}
module.exports = { crawlReddit }
