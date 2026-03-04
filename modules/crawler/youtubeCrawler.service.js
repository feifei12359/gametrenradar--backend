const axios = require('axios')
const { normalize, upsertWord } = require('./utils')
async function crawlYouTube() {
  const key = process.env.YOUTUBE_API_KEY || ''
  if (!key) return
  const url = 'https://www.googleapis.com/youtube/v3/search'
  const params = {
    key,
    q: 'gaming',
    part: 'snippet',
    type: 'video',
    publishedAfter: new Date(Date.now() - 24*60*60*1000).toISOString(),
    maxResults: 50
  }
  const res = await axios.get(url, { params, timeout: 15000 })
  const items = res.data && res.data.items ? res.data.items : []
  for (const it of items) {
    const title = it.snippet && it.snippet.title ? it.snippet.title : ''
    const tags = it.snippet && it.snippet.tags ? it.snippet.tags.join(' ') : ''
    const words = normalize([title, tags].filter(Boolean).join(' '))
    for (const w of words) await upsertWord(w, 'youtube')
  }
}
module.exports = { crawlYouTube }
