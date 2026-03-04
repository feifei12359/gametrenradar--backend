const axios = require('axios')
const cheerio = require('cheerio')
const { normalize, upsertWord } = require('./utils')
async function crawlSteam() {
  const url = 'https://store.steampowered.com/search/?sort_by=Released_DESC'
  const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html' }, timeout: 15000 })
  const $ = cheerio.load(res.data || '')
  const items = []
  $('.search_result_row').each((i, el) => {
    const name = $(el).find('.title').text().trim()
    if (name) items.push(name)
  })
  for (const name of items) {
    const words = normalize(name)
    for (const w of words) await upsertWord(w, 'steam')
  }
}
module.exports = { crawlSteam }
